# Fracture Web — premium AI workspace

## Design

Calm Linear / Apple / Cursor aesthetic. Five destinations only.

| Route | Purpose |
|-------|---------|
| `/` | Home workspace |
| `/projects` | Project list |
| `/inference` | Upload + process only |
| `/results` | After a run completes |
| `/analytics` | Metrics & charts |
| `/settings` | Theme + preferences |

## Run

```bash
# API
cd ..
venv\Scripts\activate
python -m uvicorn server:app --host 127.0.0.1 --port 8765

# UI
cd web
npm install
npm run dev
```

Open http://localhost:3000

Theme (dark/light + accent) applies instantly and persists in localStorage.
Upload requires the API on port 8765.
