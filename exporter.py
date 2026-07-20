import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

def export_video(original_video_path, timeline_scenes, output_path, progress_callback=None):
    if not timeline_scenes:
        raise ValueError("Timeline is empty!")

    if progress_callback:
        progress_callback(0, "Preparing export...")

    concat_file_path = os.path.join(tempfile.gettempdir(), "concat_list.txt")

    safe_video_path = original_video_path.replace('\\', '/')

    with open(concat_file_path, "w", encoding='utf-8') as f:
        for scene in timeline_scenes:
            f.write(f"file '{safe_video_path}'\n")
            f.write(f"inpoint {scene['start_time']:.3f}\n")
            f.write(f"outpoint {scene['end_time']:.3f}\n")

    cmd = [
        "ffmpeg",
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file_path,
        "-c", "copy",
        output_path
    ]

    startupinfo = None
    if os.name == 'nt':
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

    try:
        if progress_callback:
            progress_callback(50, "Running FFmpeg concat...")
        logger.info(f"Exporting {len(timeline_scenes)} scenes to {output_path}")
        subprocess.run(cmd, check=True, startupinfo=startupinfo, capture_output=True)
        if progress_callback:
            progress_callback(100, "Export complete!")
    except subprocess.CalledProcessError as e:
        error_output = e.stderr.decode('utf-8', errors='ignore')
        logger.error(f"FFmpeg export failed: {error_output}")
        raise RuntimeError(f"FFmpeg export failed:\n{error_output}")
    finally:
        if os.path.exists(concat_file_path):
            os.remove(concat_file_path)
