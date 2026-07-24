# Fracture

Fast desktop scene-splitting software for editors.

Fracture helps editors turn long videos into usable clips quickly. Import a video, split it into scenes, preview results instantly, curate your timeline, and export only what you want — all lossless, all local.

## Features

- **Fast keyframe-based scene splitting** — ffprobe packet scan, sub-second detection
- **Instant clip previewing** — hover any thumbnail to seek the main player
- **Smart scene clustering** — group detected scenes by visual similarity
- **Lossless MP4 export** — stream-copy (`-c copy`) concatenation, no quality loss
- **Multi-theme support** — Moonlight, Amethyst, Frost, Ember with instant switching
- **Customizable font picker** — JetBrains Mono, Fira Code, Inter, SF Mono
- **Export history** — browse and re-access past exports
- **HEVC / H.264 support** — depends on system codecs
- **Settings panel** — clustering, hardware, and export preferences
- **Resizable Wails-native interface** — glassmorphic title bar, sidebar navigation

## How It Works

```
Frontend (React + TypeScript + Tailwind)
          ↓
Desktop Layer (Wails v2 + Go)
          ↓
FFprobe / FFmpeg
```

### Frontend

Handles:

- importing videos
- previewing clips
- scene grid display
- timeline curation
- settings & themes
- export history

### Go Backend

Handles:

- keyframe extraction via ffprobe
- HTTP Range video streaming
- thumbnail generation (parallel FFmpeg JPEGs)
- lossless stream-copy export
- file system operations

### Why Keyframes?

Older scene detection used frame-by-frame analysis or full-decode brightness probes.

The current version uses ffprobe keyframe packet scan because it is:

- **much faster** — seconds instead of minutes
- **simpler** — no full decode needed
- **practical for real editors** — instant feedback on import
- **lossless export** — no re-encode penalty
- **easy to correct** — merge tools and timeline curation afterward

## Repository Structure

```
fracture-ui/
│
├── app.go                  # Go backend (keyframes, video server, export)
├── main.go                 # Application entry point
├── wails.json              # Wails configuration
├── go.mod / go.sum         # Go module
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main React component (all pages)
│   │   ├── main.tsx        # Vite entry point
│   │   ├── index.css       # Tailwind + theme CSS variables
│   │   └── components/
│   │       ├── TitleBar.tsx # Draggable title bar + window controls
│   │       └── Sidebar.tsx  # Side navigation
│   ├── package.json
│   └── ...
│
├── build/
│   ├── appicon.png         # App icon
│   └── windows/
│       └── icon.ico        # Windows icon
│
└── README.md
```

## Getting Started

### Requirements

Install:

- **Go** 1.21+
- **Node.js** 18+ + pnpm
- **Wails** v2 CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- **FFmpeg** / **FFprobe** (on PATH)
- **Windows** (current main target)

### Dev Mode

```bash
git clone https://github.com/yovyshh/Fracture.git
cd fracture-ui
wails dev
```

Opens a native window with hot-reload on both Go and frontend changes.

### Build Desktop App

```bash
wails build
```

Produces a standalone `.exe` in `build/bin/`.

## Current Focus

- More export formats (MKV, WebM, GIF)
- Preserve original codec/settings by default
- Quality slider for export bitrate
- Hover audio playback (toggleable)
- Clip timestamps shown under grid clips
- Original aspect ratio clip cells
- Better merge-export stability
- Performance optimization for heavy exports
- Combine clips into one compilation
- Linux / macOS support

## License

Fracture is licensed under the GNU GPL v3.0.

Any derivative work must also be open-source under the same license.
