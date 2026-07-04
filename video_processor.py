import os
import cv2
import subprocess

def detect_scenes_and_extract_frames(video_path, output_dir, progress_callback=None):
    if progress_callback:
        progress_callback(5, "Extracting keyframes (fast scene detection)...")
        
    # Use ffprobe to get keyframes for ultra-fast scene splitting
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
        print("ffprobe error:", e.stderr)
        return []
        
    keyframes = []
    for line in result.stdout.splitlines():
        if 'K' in line:
            parts = line.split(',')
            if len(parts) >= 1:
                try:
                    # Depending on ffprobe output format, pts_time is usually the first field
                    # when print_section=0. For some formats it's `pts_time,flags`
                    pts_val = parts[0]
                    # Sometimes the value is 'N/A' or empty
                    if pts_val and pts_val.strip() != 'N/A':
                        keyframes.append(float(pts_val.strip()))
                except ValueError:
                    pass

    if not keyframes or keyframes[0] != 0.0:
        keyframes.insert(0, 0.0)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0: 
        fps = 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    total_duration = frame_count / fps if fps else 0.0
    
    # Append total duration so we can calculate the duration of the final scene
    if keyframes[-1] < total_duration:
        keyframes.append(total_duration)
    
    scenes_data = []
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    total_scenes = len(keyframes) - 1
    
    for i in range(total_scenes):
        start_time = keyframes[i]
        end_time = keyframes[i+1]
        duration = end_time - start_time
        
        if duration < 0.1:
            continue
            
        middle_time = start_time + (duration / 2)
        middle_frame = int(middle_time * fps)
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
        ret, frame = cap.read()
        
        if ret:
            frame_path = os.path.join(output_dir, f"scene_{i:04d}.jpg")
            cv2.imwrite(frame_path, frame)
            
            scenes_data.append({
                'id': i,
                'start_time': start_time,
                'end_time': end_time,
                'duration': duration,
                'frame_path': frame_path
            })
            
        if progress_callback:
            progress = 10 + int((i + 1) / total_scenes * 40)
            progress_callback(progress, f"Extracting frame {i+1}/{total_scenes}...")
            
    cap.release()
    return scenes_data
