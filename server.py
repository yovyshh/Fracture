"""Fracture FastAPI backend — wraps video_processor / ml_engine / exporter."""
from __future__ import annotations

import asyncio
import logging
import os
import shutil
import tempfile
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from exporter import export_video
from ml_engine import MLEngine, preload_model_async
from video_processor import check_dependencies, detect_scenes_and_extract_frames

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
TEMP_ROOT = Path(tempfile.gettempdir()) / "fracture_web"
TEMP_ROOT.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Fracture", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State ────────────────────────────────────────────────
ml = MLEngine()
_model_ready = False
_model_error: Optional[str] = None

jobs: dict[str, dict[str, Any]] = {}
ws_clients: list[WebSocket] = []
_ws_lock = threading.Lock()

# In-memory session for current project
session: dict[str, Any] = {
    "video_path": None,
    "scenes": [],
    "timeline": [],
    "eps": 0.35,
    "min_samples": 2,
    "accurate_export": False,
    "theme": "dark",
    "accent": "violet",
    "recent": [],  # recent video paths
}


class SettingsIn(BaseModel):
    eps: float = 0.35
    min_samples: int = 2
    accurate_export: bool = False
    theme: str = "dark"
    accent: str = "violet"


class ImportIn(BaseModel):
    path: str


class TimelineIn(BaseModel):
    scenes: list[dict[str, Any]] = Field(default_factory=list)


class ExportIn(BaseModel):
    output_path: str
    scenes: Optional[list[dict[str, Any]]] = None
    accurate: Optional[bool] = None


class ReclusterIn(BaseModel):
    eps: Optional[float] = None
    min_samples: Optional[int] = None


# ── Helpers ──────────────────────────────────────────────
def _set_model_ready(ok: bool, err: Optional[str]):
    global _model_ready, _model_error
    _model_ready = ok
    _model_error = err
    _broadcast({"type": "model", "ready": ok, "error": err})


_loop: asyncio.AbstractEventLoop | None = None


def _broadcast(msg: dict):
    if _loop is None:
        return
    dead = []
    with _ws_lock:
        clients = list(ws_clients)
    for ws in clients:
        try:
            asyncio.run_coroutine_threadsafe(ws.send_json(msg), _loop)
        except Exception:
            dead.append(ws)
    if dead:
        with _ws_lock:
            for ws in dead:
                if ws in ws_clients:
                    ws_clients.remove(ws)


@app.on_event("startup")
async def on_startup():
    global _loop
    _loop = asyncio.get_event_loop()
    preload_model_async(_set_model_ready)


def _update_job(job_id: str, **kwargs):
    job = jobs.get(job_id)
    if not job:
        return
    job.update(kwargs)
    job["updated"] = time.time()
    _broadcast({"type": "job", "job": _public_job(job)})


def _public_job(job: dict) -> dict:
    return {
        "id": job["id"],
        "kind": job["kind"],
        "status": job["status"],
        "progress": job.get("progress", 0),
        "message": job.get("message", ""),
        "error": job.get("error"),
        "result": job.get("result"),
    }


def _scene_public(s: dict) -> dict:
    """Return scene with frame served via /api/frame/{id}."""
    out = {
        "id": s["id"],
        "start_time": s["start_time"],
        "end_time": s["end_time"],
        "duration": s["duration"],
        "cluster": s.get("cluster", -1),
        "frame_url": f"/api/frame/{s['id']}?t={int(os.path.getmtime(s['frame_path'])) if os.path.isfile(s.get('frame_path','')) else 0}",
    }
    return out


# ── REST ─────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "ok": True,
        "ffmpeg": check_dependencies(),
        "model_ready": _model_ready,
        "model_error": _model_error,
    }


@app.get("/api/session")
def get_session():
    return {
        "video_path": session["video_path"],
        "video_name": os.path.basename(session["video_path"]) if session["video_path"] else None,
        "scenes": [_scene_public(s) for s in session["scenes"]],
        "timeline": [_scene_public(s) for s in session["timeline"]],
        "eps": session["eps"],
        "min_samples": session["min_samples"],
        "accurate_export": session["accurate_export"],
        "theme": session["theme"],
        "accent": session["accent"],
        "recent": session["recent"],
        "model_ready": _model_ready,
        "ffmpeg": check_dependencies(),
    }


@app.post("/api/settings")
def set_settings(body: SettingsIn):
    session["eps"] = body.eps
    session["min_samples"] = body.min_samples
    session["accurate_export"] = body.accurate_export
    session["theme"] = body.theme
    session["accent"] = body.accent
    return {"ok": True}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Accept a browser file upload and save under TEMP_ROOT/uploads."""
    if not file.filename:
        raise HTTPException(400, "No filename")
    name = os.path.basename(file.filename)
    ext = Path(name).suffix.lower()
    if ext not in {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v"}:
        raise HTTPException(400, f"Unsupported format: {ext or '(none)'}")

    dest_dir = TEMP_ROOT / "uploads"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{uuid.uuid4().hex[:10]}_{name}"
    try:
        with dest.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
    except Exception as e:
        logger.exception("upload failed")
        raise HTTPException(500, f"Upload failed: {e}") from e

    if dest.stat().st_size < 64:
        dest.unlink(missing_ok=True)
        raise HTTPException(400, "File too small or empty")

    return {"path": str(dest.resolve()), "name": name}


@app.post("/api/import")
def import_video(body: ImportIn):
    path = body.path.strip().strip('"')
    if not path or not os.path.isfile(path):
        raise HTTPException(400, f"File not found: {path}")
    if not check_dependencies():
        raise HTTPException(400, "FFmpeg/ffprobe not found on PATH")

    job_id = str(uuid.uuid4())
    cancel = threading.Event()
    jobs[job_id] = {
        "id": job_id,
        "kind": "analyze",
        "status": "running",
        "progress": 0,
        "message": "Starting…",
        "cancel": cancel,
        "error": None,
        "result": None,
    }

    def run():
        try:
            session["video_path"] = path
            # recent list
            rec = [r for r in session["recent"] if r.get("path") != path]
            rec.insert(0, {"path": path, "name": os.path.basename(path), "ts": time.time()})
            session["recent"] = rec[:12]
            session["timeline"] = []
            session["scenes"] = []
            ml.clear_cache()

            frames_dir = TEMP_ROOT / "frames"
            if frames_dir.exists():
                shutil.rmtree(frames_dir, ignore_errors=True)
            frames_dir.mkdir(parents=True, exist_ok=True)

            def prog(p, m):
                _update_job(job_id, progress=p, message=m)

            scenes, err = detect_scenes_and_extract_frames(
                path, str(frames_dir), progress_callback=prog, cancel_event=cancel
            )
            if cancel.is_set():
                _update_job(job_id, status="cancelled", message="Cancelled")
                return
            if err:
                _update_job(job_id, status="error", error=err, message=err)
                return

            clustered = ml.cluster_scenes(
                scenes,
                eps=session["eps"],
                min_samples=session["min_samples"],
                progress_callback=prog,
                cancel_event=cancel,
            )
            if cancel.is_set():
                _update_job(job_id, status="cancelled", message="Cancelled")
                return

            clustered.sort(key=lambda x: (x.get("cluster", -1), x.get("start_time", 0)))
            session["scenes"] = clustered
            _update_job(
                job_id,
                status="done",
                progress=100,
                message="Analysis complete",
                result={
                    "scenes": [_scene_public(s) for s in clustered],
                    "video_path": path,
                    "video_name": os.path.basename(path),
                },
            )
            _broadcast({"type": "session", "session": get_session()})
        except Exception as e:
            logger.exception("analyze failed")
            _update_job(job_id, status="error", error=str(e), message=str(e))

    threading.Thread(target=run, name=f"analyze-{job_id[:8]}", daemon=True).start()
    return {"job_id": job_id}


@app.post("/api/recluster")
def recluster(body: ReclusterIn):
    if not session["scenes"]:
        raise HTTPException(400, "No scenes loaded")
    if body.eps is not None:
        session["eps"] = body.eps
    if body.min_samples is not None:
        session["min_samples"] = body.min_samples

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id": job_id,
        "kind": "recluster",
        "status": "running",
        "progress": 0,
        "message": "Reclustering…",
        "cancel": threading.Event(),
        "error": None,
        "result": None,
    }

    def run():
        try:
            def prog(p, m):
                _update_job(job_id, progress=p, message=m)

            scenes = [dict(s) for s in session["scenes"]]
            if ml._cached_embeddings is not None and len(ml._cached_embeddings) == len(scenes):
                clustered = ml.recluster_cached(
                    scenes, eps=session["eps"], min_samples=session["min_samples"], progress_callback=prog
                )
            else:
                clustered = ml.cluster_scenes(
                    scenes, eps=session["eps"], min_samples=session["min_samples"], progress_callback=prog
                )
            clustered.sort(key=lambda x: (x.get("cluster", -1), x.get("start_time", 0)))
            session["scenes"] = clustered
            _update_job(
                job_id,
                status="done",
                progress=100,
                message="Recluster complete",
                result={"scenes": [_scene_public(s) for s in clustered]},
            )
            _broadcast({"type": "session", "session": get_session()})
        except Exception as e:
            logger.exception("recluster failed")
            _update_job(job_id, status="error", error=str(e), message=str(e))

    threading.Thread(target=run, daemon=True).start()
    return {"job_id": job_id}


@app.post("/api/timeline")
def set_timeline(body: TimelineIn):
    # Map by id from session scenes when possible
    by_id = {s["id"]: s for s in session["scenes"]}
    tl = []
    for item in body.scenes:
        sid = item.get("id")
        if sid in by_id:
            tl.append(by_id[sid])
        else:
            tl.append(item)
    session["timeline"] = tl
    return {"ok": True, "count": len(tl), "duration": sum(float(s.get("duration", 0)) for s in tl)}


@app.post("/api/export")
def export(body: ExportIn):
    if not session["video_path"]:
        raise HTTPException(400, "No video loaded")
    scenes = body.scenes if body.scenes is not None else session["timeline"]
    if not scenes:
        raise HTTPException(400, "Timeline is empty")
    out = body.output_path.strip().strip('"')
    if not out:
        raise HTTPException(400, "Output path required")
    if not out.lower().endswith(".mp4"):
        out += ".mp4"

    # Resolve full scene objects
    by_id = {s["id"]: s for s in session["scenes"]}
    ordered = []
    for item in scenes:
        sid = item.get("id")
        ordered.append(by_id.get(sid, item))

    job_id = str(uuid.uuid4())
    cancel = threading.Event()
    jobs[job_id] = {
        "id": job_id,
        "kind": "export",
        "status": "running",
        "progress": 0,
        "message": "Exporting…",
        "cancel": cancel,
        "error": None,
        "result": None,
    }
    accurate = session["accurate_export"] if body.accurate is None else body.accurate

    def run():
        try:
            def prog(p, m):
                _update_job(job_id, progress=p, message=m)

            export_video(
                session["video_path"],
                ordered,
                out,
                progress_callback=prog,
                cancel_event=cancel,
                accurate=accurate,
            )
            if cancel.is_set():
                _update_job(job_id, status="cancelled", message="Cancelled")
                return
            _update_job(
                job_id,
                status="done",
                progress=100,
                message="Export complete",
                result={"output_path": out},
            )
        except Exception as e:
            logger.exception("export failed")
            _update_job(job_id, status="error", error=str(e), message=str(e))

    threading.Thread(target=run, daemon=True).start()
    return {"job_id": job_id}


@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    job["cancel"].set()
    _update_job(job_id, message="Cancelling…")
    return {"ok": True}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return _public_job(job)


@app.get("/api/frame/{scene_id}")
def get_frame(scene_id: int):
    for s in session["scenes"]:
        if int(s["id"]) == int(scene_id):
            fp = s.get("frame_path")
            if fp and os.path.isfile(fp):
                return FileResponse(fp, media_type="image/jpeg")
    raise HTTPException(404, "Frame not found")


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    with _ws_lock:
        ws_clients.append(ws)
    try:
        await ws.send_json({"type": "hello", "session": get_session()})
        while True:
            # keep alive / ignore client pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        with _ws_lock:
            if ws in ws_clients:
                ws_clients.remove(ws)


# Static frontend last
if FRONTEND.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND), html=True), name="frontend")
