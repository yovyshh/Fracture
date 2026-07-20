import logging
import os
import subprocess
import concurrent.futures
import threading

logger = logging.getLogger(__name__)

ffmpeg_semaphore = threading.Semaphore(4)

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

def extract_single_frame(video_path, middle_time, frame_path, startupinfo):
    with ffmpeg_semaphore:
        cmd = ["ffmpeg", "-y", "-ss", str(middle_time), "-i", video_path, "-vframes", "1", "-q:v", "2", frame_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, startupinfo=startupinfo)
        return frame_path

def detect_scenes_and_extract_frames(video_path, output_dir, progress_callback=None):
    if not check_dependencies():
        return [], "System Error: FFmpeg or FFprobe was not found in the system PATH. Please install FFmpeg and ensure it is added to your PATH environment variable."

    if progress_callback:
        progress_callback(5, "Extracting keyframes (fast scene detection)...")

    cmd = [
        "ffprobe",
        "-loglevel", "error",
        "-select_streams", "v:0",
        "-show_entries", "packet=pts_time,flags",
        "-of", "csv=print_section=0",
        video_path
    ]

    startupinfo = None
    if os.name == 'nt':
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, startupinfo=startupinfo, check=True)
    except subprocess.CalledProcessError as e:
        return [], f"FFprobe error: {e.stderr}"
    except FileNotFoundError:
        return [], "System Error: ffprobe executable not found."

    keyframes = []
    for line in result.stdout.splitlines():
        if 'K' in line:
            parts = line.split(',')
            if len(parts) >= 1:
                try:
                    pts_val = parts[0]
                    if pts_val and pts_val.strip() != 'N/A':
                        keyframes.append(float(pts_val.strip()))
                except ValueError:
                    pass

    if not keyframes or keyframes[0] != 0.0:
        keyframes.insert(0, 0.0)

    cmd_dur = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path]
    try:
        dur_result = subprocess.run(cmd_dur, capture_output=True, text=True, startupinfo=startupinfo, check=True)
        total_duration = float(dur_result.stdout.strip())
    except:
        total_duration = 0.0

    if keyframes[-1] < total_duration:
        keyframes.append(total_duration)

    scenes_data = []
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    total_scenes = len(keyframes) - 1
    if total_scenes == 0:
        return [], "No keyframes detected in video. Please check the video format."

    tasks = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        for i in range(total_scenes):
            start_time = keyframes[i]
            end_time = keyframes[i+1]
            duration = end_time - start_time

            if duration < 0.1:
                continue

            middle_time = start_time + (duration / 2)
            frame_path = os.path.join(output_dir, f"scene_{i:04d}.jpg")

            scenes_data.append({
                'id': i,
                'start_time': start_time,
                'end_time': end_time,
                'duration': duration,
                'frame_path': frame_path
            })

            tasks.append((i, executor.submit(extract_single_frame, video_path, middle_time, frame_path, startupinfo)))

        completed = 0
        total_tasks = len(tasks)
        if total_tasks == 0:
            return [], "No valid scenes found for extraction."

        for i, future in tasks:
            try:
                future.result()
                completed += 1
                if progress_callback:
                    progress = 10 + int((completed) / total_tasks * 40)
                    progress_callback(progress, f"Extracting frame {completed}/{total_tasks}...")
            except Exception as e:
                return [], f"Extraction error: {str(e)}"

    return scenes_data
