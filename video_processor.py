import logging
import os
import subprocess
import concurrent.futures
import threading

logger = logging.getLogger(__name__)

# Parallel extract — keep CPU from thrashing while staying fast
ffmpeg_semaphore = threading.Semaphore(6)
MAX_WORKERS = 10

# Performance knobs
MAX_SCENES = 120          # hard cap — evenly subsample if more I-frame gaps
MIN_SCENE_SEC = 0.15
FRAME_SCALE = 224         # CLIP native-ish size; tiny JPEGs = fast encode+embed
JPEG_Q = 5                # 2=best/slow, 5=good enough for CLIP

_deps_cached = False
_deps_result = False


def check_dependencies():
    global _deps_cached, _deps_result
    if _deps_cached:
        return _deps_result
    _deps_cached = True
    try:
        subprocess.run(["ffprobe", "-version"], capture_output=True, check=True)
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        _deps_result = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        _deps_result = False
    return _deps_result


def _startupinfo():
    if os.name != "nt":
        return None
    info = subprocess.STARTUPINFO()
    info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    return info


def extract_single_frame(video_path, middle_time, frame_path, startupinfo, cancel_event=None):
    """Seek-first extract of a tiny JPEG suitable for CLIP."""
    if cancel_event is not None and cancel_event.is_set():
        return None
    with ffmpeg_semaphore:
        if cancel_event is not None and cancel_event.is_set():
            return None
        # -ss BEFORE -i = input seek (fast). Scale down before encode.
        cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-y",
            "-ss", f"{middle_time:.3f}",
            "-i", video_path,
            "-frames:v", "1",
            "-an",
            "-vf", f"scale={FRAME_SCALE}:{FRAME_SCALE}:force_original_aspect_ratio=decrease",
            "-q:v", str(JPEG_Q),
            "-threads", "1",
            frame_path,
        ]
        try:
            subprocess.run(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                startupinfo=startupinfo,
                timeout=30,
                check=False,
            )
        except subprocess.TimeoutExpired:
            logger.warning("Frame extract timed out at t=%.2f", middle_time)
            return None
        return frame_path if os.path.isfile(frame_path) else None


def _subsample_indices(n, max_n):
    """Evenly pick max_n indices from range(n)."""
    if n <= max_n:
        return list(range(n))
    # Inclusive endpoints
    return sorted({int(round(i * (n - 1) / (max_n - 1))) for i in range(max_n)})


def detect_scenes_and_extract_frames(video_path, output_dir, progress_callback=None, cancel_event=None):
    """
    Detect I-frame based scenes and extract midpoint JPEGs.

    Always returns (scenes_data: list, error: str|None).
    """
    if not check_dependencies():
        return [], (
            "System Error: FFmpeg or FFprobe was not found in the system PATH. "
            "Please install FFmpeg and ensure it is added to your PATH."
        )

    if progress_callback:
        progress_callback(3, "Scanning keyframes…")

    cmd = [
        "ffprobe",
        "-loglevel", "error",
        "-select_streams", "v:0",
        "-show_entries", "packet=pts_time,flags",
        "-of", "csv=print_section=0",
        video_path,
    ]
    startupinfo = _startupinfo()

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, startupinfo=startupinfo, check=True
        )
    except subprocess.CalledProcessError as e:
        return [], f"FFprobe error: {e.stderr}"
    except FileNotFoundError:
        return [], "System Error: ffprobe executable not found."

    if cancel_event is not None and cancel_event.is_set():
        return [], "Cancelled."

    keyframes = []
    for line in result.stdout.splitlines():
        if "K" not in line:
            continue
        parts = line.split(",")
        if not parts:
            continue
        try:
            pts_val = parts[0].strip()
            if pts_val and pts_val != "N/A":
                keyframes.append(float(pts_val))
        except ValueError:
            pass

    if keyframes:
        keyframes = sorted(set(keyframes))

    if not keyframes or abs(keyframes[0]) > 1e-6:
        keyframes.insert(0, 0.0)

    cmd_dur = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path,
    ]
    try:
        dur_result = subprocess.run(
            cmd_dur, capture_output=True, text=True, startupinfo=startupinfo, check=True
        )
        total_duration = float(dur_result.stdout.strip())
    except Exception:
        total_duration = keyframes[-1] if keyframes else 0.0

    if keyframes[-1] < total_duration - 0.05:
        keyframes.append(total_duration)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Build raw scene candidates
    raw = []
    for i in range(len(keyframes) - 1):
        start_time = keyframes[i]
        end_time = keyframes[i + 1]
        duration = end_time - start_time
        if duration < MIN_SCENE_SEC:
            continue
        raw.append((i, start_time, end_time, duration))

    if not raw:
        return [], "No valid scenes found."

    # Subsample if too many (long videos with dense I-frames)
    if len(raw) > MAX_SCENES:
        keep = _subsample_indices(len(raw), MAX_SCENES)
        raw = [raw[j] for j in keep]
        if progress_callback:
            progress_callback(
                8,
                f"Subsampled to {len(raw)} scenes (cap {MAX_SCENES})…",
            )
        logger.info("Subsampled scenes %d → %d", len(keyframes) - 1, len(raw))

    if progress_callback:
        progress_callback(10, f"Extracting {len(raw)} thumbnails…")

    scenes_data = []
    futures = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for idx, (orig_i, start_time, end_time, duration) in enumerate(raw):
            if cancel_event is not None and cancel_event.is_set():
                executor.shutdown(wait=False, cancel_futures=True)
                return [], "Cancelled."

            middle_time = start_time + duration / 2.0
            frame_path = os.path.join(output_dir, f"scene_{orig_i:04d}.jpg")
            scene = {
                "id": orig_i,
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "frame_path": frame_path,
            }
            scenes_data.append(scene)
            futures.append(
                executor.submit(
                    extract_single_frame,
                    video_path,
                    middle_time,
                    frame_path,
                    startupinfo,
                    cancel_event,
                )
            )

        completed = 0
        total_tasks = len(futures)
        for fut in concurrent.futures.as_completed(futures):
            if cancel_event is not None and cancel_event.is_set():
                executor.shutdown(wait=False, cancel_futures=True)
                return [], "Cancelled."
            try:
                fut.result()
            except Exception as e:
                logger.warning("Extract task error: %s", e)
            completed += 1
            if progress_callback and (completed % 3 == 0 or completed == total_tasks):
                progress = 10 + int(completed / total_tasks * 45)
                progress_callback(progress, f"Frames {completed}/{total_tasks}")

    scenes_data = [s for s in scenes_data if os.path.isfile(s["frame_path"])]
    if not scenes_data:
        return [], "Frame extraction produced no images."

    # Restore chronological order
    scenes_data.sort(key=lambda s: s["start_time"])
    logger.info("Detected %d scenes from %s", len(scenes_data), video_path)
    return scenes_data, None
