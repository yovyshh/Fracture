# Fracture Web UI

Premium **Next.js 15** front-end for Fracture — Linear / Apple / Vercel aesthetic.

## Stack

- React 19 · Next.js App Router
- Tailwind CSS · custom design tokens
- GSAP page/stagger timelines
- Framer Motion micro-interactions
- Lenis smooth scroll
- Lucide icons · Recharts
- Talks to FastAPI backend (`server.py`) via `NEXT_PUBLIC_API_URL`

## Design tokens

| Token | Value |
|-------|-------|
| Canvas | `#09090B` |
| Surface | `#111113` |
| Accent | `#7C3AED` |
| Success | `#22C55E` |
| Radius | 18–24px |

## Run

```bash
# Terminal A — Python engine
cd ..
venv\Scripts\activate
python -m uvicorn server:app --host 127.0.0.1 --port 8765

# Terminal B — Web UI
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# optional API base
set NEXT_PUBLIC_API_URL=http://127.0.0.1:8765
```

## Routes

| Path | Screen |
|------|--------|
| `/` | Dashboard · hero · pipeline · live inference |
| `/upload` | Drag-drop import |
| `/classification` | Clusters + live panel |
| `/results` | Preview · timeline · probabilities |
| `/dataset` | Explorer · distribution |
| `/analytics` | Metrics · ROC-style charts · confusion matrix |
| `/models` | Checkpoint · loss curves |
| `/training` | Live training loop |
| `/settings` | Clustering / export / status |

## Structure

```
src/
  app/                 # routes
  components/
    layout/            # AppShell, Sidebar, TopBar
    dashboard/         # Hero, Pipeline, Stats
    upload/            # DropZone
    motion/            # GSAP Reveal
    ui/                # Button, Card, Badge, Progress
  lib/                 # cn(), api client
```
