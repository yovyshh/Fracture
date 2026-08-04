<p align="center">
  <img src="assets/ascii-title.png" alt="Fracture ASCII Title" width="600">
</p>

Fast desktop scene-splitting software for editors.

Fracture turns long videos into usable clips in seconds. Import, detect scenes via DBSCAN colour clustering, preview each clip individually, curate your timeline, and export losslessly. Built-in yt-dlp integration fetches videos from any supported platform directly into your project.

## Features

- **Scene detection** — ffprobe keyframes + DBSCAN (eps=45, minPts=2) on RGB colour features — sub-second on typical videos
- **Per-clip preview** — click any scene tile to load its individual clip; hover to seek the preview video
- **Lossless export** — stream-copy (`-c copy`) concatenation, zero quality loss
- **Built-in downloads** — yt-dlp integration: paste a URL, browse available formats sorted by file size, download with live progress/speed/ETA
- **Physical scene files** — ffmpeg segment muxer splits video into playable `.mp4` files (stream copy, no re-encode)
- **Black/white frame filtering** — auto-detected and marked as Noise cluster for easy removal
- **Download to import** — downloaded videos auto-import with scene detection and thumbnail generation
- **4 themes** — Moonlight, Amethyst, Frost, Ember with instant switching
- **Custom font picker** — JetBrains Mono, Fira Code, Inter, SF Mono
- **Export history** — browse and re-access past exports
- **Frameless window** — Wails-native with floating top-right controls (opacity-40, hover-reveal)
- **Full NSIS installer** — self-contained `.exe` with ffmpeg, ffprobe, yt-dlp, and WebView2 bootstrapper

## How It Works

```
Frontend (React + TypeScript + Tailwind)
          ↓
Desktop Layer (Wails v2 + Go — frameless, HTTP media server)
          ↓
ffprobe (keyframes) → GetFrameColor (RGB) → DBSCAN (clustering)
          ↓
ffmpeg segment muxer (physical split into scene .mp4 files)
          ↓
ffmpeg (parallel thumbnail generation)
          ↓
yt-dlp (video download from URLs)
```

### Frontend

Handles:

- video import with progress tracking
- scene grid with cluster filter buttons
- per-clip preview panel (toggleable, seek-on-hover)
- download form with format browsing and destination picker
- timeline curation (drag-select + export)
- settings, themes, font picker
- export history

### Go Backend

Handles:

- keyframe extraction via ffprobe packet scan (sub-second)
- per-frame colour extraction (1×1 ffmpeg pixel → RGB feature vectors)
- DBSCAN clustering on RGB features
- black/white frame detection (threshold-based)
- physical video splitting via ffmpeg segment muxer (`-f segment`)
- HTTP Range video / clip / thumbnail streaming
- yt-dlp subprocess orchestration (format listing, download with live progress events, timeout handling)
- lossless stream-copy MP4 export
- file system operations

### Why Keyframes + Segment Split?

Older scene detection used frame-by-frame analysis or full-decode brightness probes.

The current version uses ffprobe keyframe packet scan + ffmpeg segment split:

- **much faster** — seconds instead of minutes
- **individual scene files** — each scene is its own playable `.mp4`
- **lossless splitting** — `-c copy` preserves original quality
- **colour-based clustering** — DBSCAN on RGB values groups visually similar scenes
- **noise filtering** — black/white frames flagged for easy removal

## Repository Structure

```
fracture-ui/
│
├── app.go                  # Go backend (keyframes, colour analysis, DBSCAN, segment split, yt-dlp, streaming, export)
├── main.go                 # Application entry point (frameless window config)
├── wails.json              # Wails configuration
├── go.mod / go.sum         # Go module
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main React component (all pages + preview panel)
│   │   ├── main.tsx        # Vite entry point
│   │   ├── index.css       # Tailwind + theme CSS variables
│   │   └── components/
│   │       ├── TitleBar.tsx
│   │       └── Sidebar.tsx
│   ├── package.json
│   └── ...
│
├── build/
│   ├── appicon.png
│   └── windows/
│       ├── icon.ico
│       ├── download_embed.bat      # Download ffmpeg/yt-dlp for local installer builds
│       └── installer/
│           ├── installer.nsi       # NSIS installer script (embeds all deps)
│           └── embed/              # Embedded binaries (downloaded by CI or script)
│
├── .github/workflows/
│   └── build.yml           # CI: build Wails app, download deps, NSIS installer, GitHub release
│
└── README.md
```

## Getting Started

### Requirements

| Tool | Version | Notes |
|------|---------|-------|
| **Go** | 1.21+ | |
| **Node.js** | 18+ | + pnpm |
| **Wails** | v2 | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| **ffmpeg / ffprobe** | 4.0+ | On PATH for dev; bundled in installer for users |
| **yt-dlp** | latest | On PATH for dev; bundled in installer for users |
| **Windows** | 10+ | Current main target |

### Dev Mode

```bash
git clone https://github.com/yovyshh/Fracture.git
cd fracture-ui
wails dev
```

Opens a native frameless window with hot-reload on Go and frontend changes.

### Build Desktop App

```bash
wails build
```

Produces a standalone `.exe` in `build/bin/`.

### Build Installer (Windows)

```bash
# Download embed dependencies (one-time)
build\windows\download_embed.bat

# Build the NSIS installer
cd build\windows\installer
makensis installer.nsi    # requires NSIS installed (choco install nsis)
```

Produces `Fracture-Installer.exe` — a self-contained installer with ffmpeg, ffprobe, yt-dlp, and WebView2 bootstrapper.

## Current Focus

- CLIP embeddings for semantic scene clustering (replace RGB proxy)
- HDBSCAN for truly automatic cluster count
- More export formats (MKV, WebM, GIF)
- Preserve original codec/settings by default
- Quality slider for export bitrate
- Hover audio playback (toggleable)
- Clip timestamps shown under grid clips
- Original aspect ratio clip cells
- Linux / macOS support

## License

Fracture is licensed under the MIT License

Any derivative work must also be open-source under the same license.
