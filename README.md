# Fracture

**Fracture** is an ultra-fast, local, AI-powered desktop video editing assistant designed for seamless scene splitting and intelligent frame clustering. Built purely in Python with a premium, sleek PyQt6 dark-mode interface, Fracture automates the tedious task of parsing large video files by instantly extracting keyframes and grouping them via Machine Learning.

## Features

- **Blazing Fast Keyframe Extraction**: Bypasses traditional frame-by-frame decoding overhead. Fracture uses `ffprobe` to directly extract and analyze I-frames, making video parsing nearly instantaneous.
- **AI-Powered Scene Clustering**: Leverages Hugging Face's `sentence-transformers` (`clip-ViT-B-32`) and Scikit-Learn's KMeans algorithm to intelligently group similar scenes into distinct, color-coded clusters based on visual semantics.
- **Ultra-Modern UI/UX**: Built with a sleek, minimalist dark theme featuring Electric Violet accents, pill-shaped geometry, glowing drop shadows, buttery smooth 60 FPS pixel-scrolling, and a dynamic binary ambient background running at near-zero CPU cost.
- **Drag-and-Drop Timeline**: A fully interactive timeline queue that allows you to curate, reorder, and seamlessly delete clips with custom inline UI controls or simple keyboard shortcuts.
- **Lossless Export**: Uses FFmpeg's `concat` demuxer to merge your curated timeline selections into a final master video without any quality degradation or re-encoding penalties.

## Technology Stack

- **GUI & Frontend**: PyQt6
- **Video & Computer Vision**: OpenCV (`cv2`), `ffmpeg-python`, `ffprobe`
- **Machine Learning**: `sentence-transformers`, `scikit-learn`
- **OS Compatibility**: Fully optimized for Windows environments (invisible background subprocess handling)

## How to Use

1. **Import Video**: Click the import button to load your `.mp4`, `.mkv`, `.avi`, or `.mov` file.
2. **Analysis**: Fracture will silently extract and cluster the keyframes in the background, displaying the results in the Media Pool.
3. **Curate Timeline**: Drag your desired clusters from the Media Pool down to the Timeline Queue. Right-click or use the inline 'X' button to remove scenes.
4. **Export**: Hit 'Merge & Export' to instantly stitch your selections together into a final, lossless output file.
