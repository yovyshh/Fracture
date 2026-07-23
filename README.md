<pre align="center">
                                   █████╗█████╗   █████╗ █████╗██████████╗██╗ ██╗██████╗ ███████╗
                                   ██╔══╝██╔══██╗██╔══██╗██╔══╝╚══██╔══╝██║   ██║██╔══██╗██╔════╝
                                   ████╗ ██████╔╝███████║██║      ██║   ██║   ██║██████╔╝█████╗  
                                   ██╔═╝ ██╔══██╗██╔══██║██║      ██║   ██║   ██║██╔══██╗██╔══╝  
                                   ██║   ██║  ██║██║  ██║╚█████╗  ██║   ╚██████╔╝██║  ██║███████╗
                                   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚════╝  ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
</pre>

<h1 align="center">Fracture</h1>

<p align="center">
  <b>Local AI video scene splitter · cluster · curate · lossless export</b>
</p>

<p align="center">
  <a href="https://github.com/yovyshh/Fracture"><img src="https://img.shields.io/badge/GitHub-yovyshh%2FFracture-0047FF?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows"></a>
  <a href="#stack"><img src="https://img.shields.io/badge/Stack-Python%20%7C%20PyQt6%20%7C%20CLIP-111111?style=for-the-badge" alt="Stack"></a>
  <a href="#pipeline"><img src="https://img.shields.io/badge/AI-CLIP%20%2B%20DBSCAN-a855f7?style=for-the-badge" alt="AI"></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/Mode-Offline%20%2F%20Local-f59e0b?style=for-the-badge" alt="Offline"></a>
</p>

---

**Fracture** is a desktop video editing assistant that turns long footage into a curated master without cloud uploads and without a quality tax.

It finds scene boundaries from **I-frames** (near-instant), embeds thumbnails with **CLIP**, groups look-alikes with **DBSCAN**, and lets you assemble a timeline — then stitches your selection with **FFmpeg stream-copy** so the bits that leave match the bits that came in.

Black terminal UI. Electric blue accents. Built for speed on a normal Windows box.

```
import → detect → embed → cluster → curate → export
   │        │        │        │        │        └── ffmpeg -c copy (lossless)
   │        │        │        │        └── media pool + timeline
   │        │        │        └── cosine DBSCAN (tunable eps)
   │        │        └── clip-ViT-B-32 (cached, optional GPU)
   │        └── ffprobe I-frames + 224px mid-scene JPEGs
   └── drag-drop / file dialog / key I
```

<table>
<tr>
  <td width="28%"><b>Blazing scene split</b></td>
  <td>Uses <code>ffprobe</code> packet flags — no full decode. Caps &amp; subsamples dense keyframe sections so long videos stay snappy.</td>
</tr>
<tr>
  <td><b>Semantic clustering</b></td>
  <td>CLIP vision embeddings (L2-normalized) + cosine DBSCAN. No fixed <code>K</code>. Noise labeled <code>-1</code>. Tune eps / min samples live.</td>
</tr>
<tr>
  <td><b>Instant recluster</b></td>
  <td>Embeddings are cached. Change Settings → Apply and clusters refresh without re-extracting frames or reloading the model.</td>
</tr>
<tr>
  <td><b>Human-in-the-loop timeline</b></td>
  <td>Click scenes into a drag-reorder queue. Cluster chips filter the pool. Shift+click a chip to bulk-add. De-dupe, undo, duration pill.</td>
</tr>
<tr>
  <td><b>Lossless export</b></td>
  <td>FFmpeg concat demuxer with <code>-c copy</code>. Optional accurate re-encode mode for frame-perfect cuts. Cancelable. No pipe deadlocks.</td>
</tr>
<tr>
  <td><b>Hermes-black UI</b></td>
  <td>Pure black canvas, electric blue <code>#0047FF</code>, monospace chrome, ASCII brand mark, sharp corners. Looks like a terminal that edits video.</td>
</tr>
<tr>
  <td><b>Non-blocking workers</b></td>
  <td>Analysis, export, and hover preview each run on QThreads. Esc cancels. Model preloads in the background on launch.</td>
</tr>
<tr>
  <td><b>Fully local</b></td>
  <td>No account. No upload. FFmpeg on PATH + a Python venv. After the first CLIP download, you can go offline.</td>
</tr>
</table>

---

## Quick Start

### Requirements

| Need | Notes |
|------|--------|
| **OS** | Windows 10/11 (primary) |
| **Python** | 3.10–3.12 recommended |
| **FFmpeg** | `ffmpeg` + `ffprobe` on your `PATH` |
| **GPU** *(optional)* | CUDA / MPS auto-detected for faster CLIP encode |

### Install

```bash
git clone https://github.com/yovyshh/Fracture.git
cd Fracture

python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### Run

```bash
python main.py
```

Or double-click **`Fracture.vbs`** for a windowless launch (`pythonw`).

> **First run:** CLIP (`clip-ViT-B-32`) downloads once via Hugging Face, then stays cached. Status bar shows when the model is ready.

---

## How to use

1. **Import** a video — button, drag-and-drop, or press `I`  
2. Wait for analysis — thumbnails land in the **Media Pool**  
3. **Filter** with cluster chips · **Shift+click** a chip to add the whole cluster  
4. **Click** scenes onto the **Timeline** · drag to reorder · `Del` / red **DEL** to remove · `Ctrl+Z` undo  
5. Open **Settings** (`S`) — theme, DBSCAN `eps` / `min_samples`, accurate export toggle  
6. **Export** (`E`) — lossless master MP4  

### Shortcuts

| Key | Action |
|-----|--------|
| `I` | Import video |
| `E` | Export timeline |
| `S` | Settings |
| `Esc` | Cancel running job |
| `Ctrl+Z` | Undo timeline change |
| `0` | Show all clusters |
| `1`–`9` | Filter cluster N |
| `Del` / `Backspace` | Remove selected timeline clips |

---

## Pipeline

```
┌────────────┐   ┌─────────────┐   ┌──────────────┐   ┌────────────┐
│  ffprobe   │ → │   ffmpeg    │ → │ CLIP ViT-B/32│ → │   DBSCAN   │
│  I-frames  │   │ 224px JPEG  │   │  512-d emb   │   │   cosine   │
└────────────┘   └─────────────┘   └──────────────┘   └────────────┘
                                                           │
                     ┌──────────────┐   ┌──────────────────┘
                     │   Timeline   │ ← │   Media Pool
                     └──────┬───────┘
                            ▼
                   ┌─────────────────┐
                   │ ffmpeg concat   │
                   │ -c copy (or x264│
                   │  accurate mode) │
                   └─────────────────┘
```

Diagrams & architecture HTML live under [`output/`](./output/).

---

## Stack

| Layer | Tech |
|-------|------|
| **GUI** | PyQt6 · Fusion · custom QSS (black / blue mono) |
| **Video** | FFmpeg · ffprobe · OpenCV (hover preview) |
| **ML** | `sentence-transformers` · CLIP ViT-B/32 · scikit-learn DBSCAN |
| **Packaging** | PyInstaller spec · VBS launcher · optional one-file exe |

---

## Project layout

```text
Fracture/
├── main.py                 # Entry + rotating logs (~/.fracture/)
├── ui_components.py        # Window, workers, timeline, theme
├── video_processor.py      # I-frame detect + parallel extract
├── ml_engine.py            # CLIP encode + cosine clustering
├── exporter.py             # Concat export (cancel-safe)
├── requirements.txt
├── Fracture.spec           # PyInstaller
├── Fracture.vbs            # Silent Windows launch
├── icons/
├── output/                 # Pipeline diagrams + architecture HTML
└── README.md
```

---

## Clustering notes

- Default **`eps = 0.35`**, **`min_samples = 2`**, metric **`cosine`** on L2-normalized embeddings  
- Lower eps → tighter / more clusters · higher eps → broader groups  
- Noise scenes show as **`noise`** in the pool  
- Scene count is capped (~120) with even subsample on dense I-frame footage so analysis stays interactive  

---

## Build a standalone exe *(optional)*

With PyInstaller and deps installed:

```bash
pyinstaller Fracture.spec
# → dist/Fracture.exe   (local only — not committed; exceeds GitHub size limits)
```

Keep FFmpeg on PATH for the packaged app as well.

---

## Docs & decks

| Asset | What |
|-------|------|
| [`output/fracture-architecture.html`](./output/fracture-architecture.html) | Interactive architecture diagram |
| [`Fracture_Architecture.pptx`](./Fracture_Architecture.pptx) | Architecture slide deck |
| [`Fracture_Methodology.pptx`](./Fracture_Methodology.pptx) | Methodology deck |
| [`output/fracture_pipeline.png`](./output/fracture_pipeline.png) | Pipeline graphic |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “FFmpeg not found” | Install FFmpeg and add it to system `PATH`, then restart the app |
| First analysis slow | CLIP model downloading / loading — only once; watch status bar |
| Export stuck (old builds) | Update to latest `exporter.py` (progress-file + stderr drain). Kill orphaned `ffmpeg.exe` if needed |
| Clusters look wrong | Settings → lower/raise **eps** → Apply (instant recluster if embeddings cached) |
| Python 3.14 + broken numpy | Prefer 3.11/3.12 venv; rebuild wheels for your interpreter |

Logs: `~/.fracture/fracture.log` (Windows: `%USERPROFILE%\.fracture\fracture.log`).

---

<p align="center">
  <code>// local · offline · lossless</code><br>
  <sub>Fracture — split the cut, keep the quality.</sub>
</p>
