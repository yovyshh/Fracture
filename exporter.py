import os
import subprocess
import tempfile

def export_video(original_video_path, timeline_scenes, output_path):
    """
    Exports the video losslessly using ffmpeg's concat demuxer.
    timeline_scenes: list of dictionaries with 'start_time' and 'end_time'
    """
    if not timeline_scenes:
        raise ValueError("Timeline is empty!")

    # Prepare the concat file for one-pass slicing/merging
    concat_file_path = os.path.join(tempfile.gettempdir(), "concat_list.txt")
    
    # FFmpeg concat demuxer requires forward slashes or properly escaped paths on Windows
    safe_video_path = original_video_path.replace('\\', '/')
    
    with open(concat_file_path, "w", encoding='utf-8') as f:
        for scene in timeline_scenes:
            f.write(f"file '{safe_video_path}'\n")
            f.write(f"inpoint {scene['start_time']:.3f}\n")
            f.write(f"outpoint {scene['end_time']:.3f}\n")

    cmd = [
        "ffmpeg",
        "-y",               # Overwrite
        "-f", "concat",     # Use concat demuxer
        "-safe", "0",       # Allow absolute paths
        "-i", concat_file_path,
        "-c", "copy",       # Stream copy (no re-encoding, instantaneous)
        output_path
    ]
    
    startupinfo = None
    if os.name == 'nt':
        # Prevents empty console window popup on Windows
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

    try:
        subprocess.run(cmd, check=True, startupinfo=startupinfo, capture_output=True)
    except subprocess.CalledProcessError as e:
        error_output = e.stderr.decode('utf-8', errors='ignore')
        raise RuntimeError(f"FFmpeg export failed:\n{error_output}")
    finally:
        # Cleanup
        if os.path.exists(concat_file_path):
            os.remove(concat_file_path)
