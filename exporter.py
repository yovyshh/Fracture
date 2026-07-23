import logging
import os
import subprocess
import tempfile
import threading
import time

logger = logging.getLogger(__name__)


def _escape_concat_path(path):
    """Escape a path for FFmpeg concat demuxer single-quoted file lines."""
    normalized = path.replace("\\", "/")
    return normalized.replace("'", r"'\''")


def _startupinfo():
    if os.name != "nt":
        return None
    info = subprocess.STARTUPINFO()
    info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    return info


def _drain(stream, sink: list):
    """Background reader so pipe buffers never fill and deadlock FFmpeg."""
    try:
        if stream is None:
            return
        for line in stream:
            sink.append(line)
    except Exception:
        pass


def export_video(
    original_video_path,
    timeline_scenes,
    output_path,
    progress_callback=None,
    cancel_event=None,
    accurate=False,
):
    """
    Lossless (default) or accurate re-encode export of selected timeline scenes.

    cancel_event: threading.Event — when set, aborts running FFmpeg.
    accurate: if True, re-encode cuts for frame-accurate boundaries.
    """
    if not timeline_scenes:
        raise ValueError("Timeline is empty!")

    if progress_callback:
        progress_callback(5, "Preparing export…")

    fd, concat_file_path = tempfile.mkstemp(prefix="fracture_concat_", suffix=".txt")
    os.close(fd)

    proc = None
    try:
        safe_video_path = _escape_concat_path(original_video_path)

        with open(concat_file_path, "w", encoding="utf-8") as f:
            for scene in timeline_scenes:
                f.write(f"file '{safe_video_path}'\n")
                f.write(f"inpoint {scene['start_time']:.3f}\n")
                f.write(f"outpoint {scene['end_time']:.3f}\n")

        # Write progress to a temp file — avoids stdout/stderr pipe deadlocks on Windows
        prog_fd, prog_path = tempfile.mkstemp(prefix="fracture_prog_", suffix=".txt")
        os.close(prog_fd)

        if accurate:
            cmd = [
                "ffmpeg", "-hide_banner", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file_path,
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "18",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                "-progress", prog_path,
                "-nostats",
                output_path,
            ]
            mode_label = "Re-encoding"
        else:
            # Stream copy — should finish in seconds for short timelines
            cmd = [
                "ffmpeg", "-hide_banner", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file_path,
                "-c", "copy",
                "-progress", prog_path,
                "-nostats",
                output_path,
            ]
            mode_label = "Muxing (lossless)"

        if progress_callback:
            progress_callback(12, f"{mode_label}…")

        logger.info(
            "Exporting %d scenes → %s (accurate=%s)",
            len(timeline_scenes), output_path, accurate,
        )

        # stderr drained on a side thread; stdout unused
        err_lines: list[str] = []
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            startupinfo=_startupinfo(),
            text=True,
            encoding="utf-8",
            errors="ignore",
        )
        drain_t = threading.Thread(
            target=_drain, args=(proc.stderr, err_lines), daemon=True
        )
        drain_t.start()

        expected_ms = max(
            1.0,
            sum(float(s.get("duration", 0)) for s in timeline_scenes) * 1000.0,
        )
        last_pct = 12
        last_size = 0
        stall_ticks = 0

        # Poll progress file + process until exit
        while True:
            if cancel_event is not None and cancel_event.is_set():
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill()
                raise RuntimeError("Export cancelled.")

            code = proc.poll()
            # Read progress file tail
            try:
                with open(prog_path, "r", encoding="utf-8", errors="ignore") as pf:
                    content = pf.read()
                out_ms = None
                for line in content.splitlines():
                    if line.startswith("out_time_ms="):
                        try:
                            out_ms = float(line.split("=", 1)[1])
                        except ValueError:
                            pass
                if out_ms is not None:
                    pct = 12 + int(min(80, (out_ms / expected_ms) * 80))
                    if pct > last_pct and progress_callback:
                        last_pct = pct
                        progress_callback(pct, f"{mode_label}… {pct}%")
            except OSError:
                pass

            # Heartbeat if progress file is quiet (common with -c copy)
            try:
                sz = os.path.getsize(output_path) if os.path.isfile(output_path) else 0
            except OSError:
                sz = 0
            if sz > last_size:
                last_size = sz
                stall_ticks = 0
                if last_pct < 90 and progress_callback:
                    last_pct = min(90, last_pct + 3)
                    progress_callback(last_pct, f"{mode_label}… writing")
            else:
                stall_ticks += 1

            if code is not None:
                break

            # Safety: if process seems alive forever with no growth (5 min)
            if stall_ticks > 600:  # 600 * 0.5s = 5 min
                proc.kill()
                raise RuntimeError("Export timed out (no output growth).")

            time.sleep(0.25)

        drain_t.join(timeout=2)
        stderr = "".join(err_lines)

        if cancel_event is not None and cancel_event.is_set():
            raise RuntimeError("Export cancelled.")

        if code != 0:
            logger.error("FFmpeg export failed (code=%s): %s", code, stderr[-2000:])
            raise RuntimeError(
                f"FFmpeg export failed (exit {code}):\n{(stderr or 'no stderr')[-2000:]}"
            )

        if not os.path.isfile(output_path) or os.path.getsize(output_path) < 32:
            raise RuntimeError(
                "Export finished but output file is missing or empty.\n"
                + (stderr[-1500:] if stderr else "")
            )

        if progress_callback:
            progress_callback(96, "Checking output…")
        _validate_output(output_path, timeline_scenes)

        if progress_callback:
            progress_callback(100, "Export complete!")
        logger.info("Export complete: %s (%d bytes)", output_path, os.path.getsize(output_path))
    finally:
        if proc is not None and proc.poll() is None:
            try:
                proc.kill()
            except Exception:
                pass
        for p in (concat_file_path, locals().get("prog_path")):
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass


def _validate_output(output_path, timeline_scenes):
    if not os.path.isfile(output_path):
        raise RuntimeError("Export finished but output file is missing.")
    expected = sum(float(s.get("duration", 0)) for s in timeline_scenes)
    if expected <= 0:
        return
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            output_path,
        ]
        r = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            startupinfo=_startupinfo(),
            check=True,
            timeout=15,
        )
        actual = float(r.stdout.strip())
        if abs(actual - expected) > max(1.0, expected * 0.25):
            logger.warning(
                "Output duration %.2fs differs from expected %.2fs",
                actual, expected,
            )
    except Exception as e:
        logger.debug("Duration validation skipped: %s", e)
