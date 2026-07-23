# Fracture

**Fracture** is a local, AI-powered desktop video editing assistant for fast scene splitting and intelligent frame clustering. Built in Python with a Hermes-inspired PyQt6 dark UI.

## Features

- **Fast keyframe extraction** — `ffprobe` I-frames (no full decode)
- **CLIP + DBSCAN clustering** — L2-normalized embeddings, cosine distance
- **Instant recluster** — tweak epsilon / min samples without re-importing
- **Hermes-style UI** — slate canvas, cyan accents, cluster chips, duration pill
- **Cluster bulk-add** — Shift+click a chip, or right-click a thumbnail
- **Timeline** — reorder, de-dupe, undo (Ctrl+Z), duration total
- **Cancelable jobs** — analysis & export (Esc)
- **Lossless export** — FFmpeg concat `-c copy` (optional accurate re-encode)
- **Drag-and-drop import**
- **Model preload** on startup
- **Project save** (`.fracture.json`)

## Stack

- **GUI:** PyQt6
- **Video:** FFmpeg / ffprobe, OpenCV
- **ML:** `sentence-transformers` (`clip-ViT-B-32`), scikit-learn

## Requirements

- Windows (primary), FFmpeg + ffprobe on `PATH`
- Python 3.10–3.12 recommended (3.14 venv may need rebuilt wheels)

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Or double-click `Fracture.vbs` for a windowless launch.

## How to use

1. **Import** video (button, `I`, or drag-drop)
2. Wait for analysis — scenes appear in the Media Pool
3. **Filter** by cluster chips; **Shift+click** a chip to add the whole cluster
4. **Click** scenes onto the Timeline; drag to reorder; `Del` to remove; `Ctrl+Z` undo
5. **Settings** (`S`) — theme, DBSCAN eps / min samples, accurate export
6. **Export** (`E`) — lossless master MP4

## Shortcuts

| Key | Action |
|-----|--------|
| `I` | Import |
| `E` | Export |
| `S` | Settings |
| `Esc` | Cancel running job |
| `Ctrl+Z` | Undo timeline |
| `1–9` | Filter cluster N |
| `0` | Show all clusters |

## Project layout

```
Fracture/
├── main.py               # Entry + logging
├── ui_components.py      # Hermes-themed PyQt6 UI
├── video_processor.py    # I-frame detect + frame extract
├── ml_engine.py          # CLIP embeddings + cosine DBSCAN
├── exporter.py           # Concat export (cancelable)
├── requirements.txt
├── icons/
└── README.md
```

## Clustering notes

Default `eps=0.35` with **cosine** metric on L2-normalized CLIP vectors.  
Lower eps → tighter clusters. Higher → broader groups. Noise labeled `-1`.

## License

Project-local use.
