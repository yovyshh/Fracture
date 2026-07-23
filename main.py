"""
Fracture desktop launcher
────────────────────────
SpotiFLAC-style web UI (HTML/CSS/JS) + FastAPI backend + pywebview shell.

  python main.py
"""
from __future__ import annotations

import logging
import os
import socket
import sys
import threading
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def setup_logging():
    log_dir = Path.home() / ".fracture"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "fracture.log"
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s  %(levelname)-7s  %(name)s  %(message)s", "%H:%M:%S")
    fh = RotatingFileHandler(log_path, maxBytes=2_000_000, backupCount=3, encoding="utf-8")
    fh.setFormatter(fmt)
    root.addHandler(fh)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    root.addHandler(sh)
    logging.getLogger(__name__).info("Logging → %s", log_path)


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_server(port: int):
    import uvicorn
    from server import app

    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning", access_log=False)


class Api:
    """Exposed to JS via window.pywebview.api"""

    def open_file(self) -> str:
        try:
            import webview
            result = webview.windows[0].create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False,
                file_types=(
                    "Video (*.mp4;*.mkv;*.avi;*.mov;*.webm;*.m4v)",
                    "All files (*.*)",
                ),
            )
            if result and len(result) > 0:
                return str(result[0])
        except Exception as e:
            logging.getLogger(__name__).exception("open_file: %s", e)
        return ""

    def save_file(self) -> str:
        try:
            import webview
            result = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename="fracture_export.mp4",
                file_types=("MP4 (*.mp4)",),
            )
            if result:
                # pywebview may return str or tuple
                path = result if isinstance(result, str) else result[0]
                return str(path)
        except Exception as e:
            logging.getLogger(__name__).exception("save_file: %s", e)
        return ""


def wait_ready(port: int, timeout: float = 15.0) -> bool:
    import urllib.request

    url = f"http://127.0.0.1:{port}/api/health"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=0.5) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(0.15)
    return False


def main():
    setup_logging()
    log = logging.getLogger("fracture")

    # Ensure frontend exists
    fe = ROOT / "frontend" / "index.html"
    if not fe.is_file():
        log.error("Frontend missing: %s", fe)
        print("ERROR: frontend/index.html not found")
        sys.exit(1)

    port = free_port()
    t = threading.Thread(target=start_server, args=(port,), name="uvicorn", daemon=True)
    t.start()

    if not wait_ready(port):
        print("ERROR: backend failed to start")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}/"
    log.info("UI at %s", url)

    # Prefer native window; fall back to browser
    try:
        import webview

        webview.create_window(
            "Fracture",
            url,
            width=1280,
            height=820,
            min_size=(960, 640),
            background_color="#0a0a0a",
            text_select=True,
            js_api=Api(),
        )
        webview.start(debug=False)
    except Exception as e:
        log.exception("webview failed: %s — opening browser", e)
        import webbrowser

        webbrowser.open(url)
        print(f"Fracture running at {url}  (Ctrl+C to quit)")
        try:
            while t.is_alive():
                time.sleep(1)
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
