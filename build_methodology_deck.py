"""Build Fracture Methodology presentation with officecli."""
import os
import subprocess
import sys

FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "Fracture_Methodology.pptx"))

BG, CARD, BORDER = "09090B", "18181B", "27272A"
BLUE, BLUE2, WHITE, MUTED = "2563EB", "3B82F6", "FAFAFA", "A1A1AA"
GREEN, PURPLE, AMBER, CYAN, RED, SOFT = "22C55E", "8B5CF6", "F59E0B", "06B6D4", "EF4444", "1E293B"


OFFICECLI_JS = os.path.expandvars(
    r"%APPDATA%\npm\node_modules\@officecli\officecli\officecli.js"
)


def oc(*args):
    cmd = ["node", OFFICECLI_JS, *[str(a) for a in args]]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "")[:400]
        print(f"  WARN exit={r.returncode}: {' '.join(str(a) for a in args)[:90]}\n  {err}")
    return r


def add_slide(n, bg=BG):
    oc("add", FILE, "/", "--type", "slide", "--prop", "layout=blank", "--prop", f"background={bg}")


def shape(slide, name, preset, fill, opacity, line, x, y, w, h):
    oc(
        "add", FILE, f"/slide[{slide}]", "--type", "shape",
        "--prop", f"name={name}", "--prop", f"preset={preset}",
        "--prop", f"fill={fill}", "--prop", f"opacity={opacity}", "--prop", f"line={line}",
        "--prop", f"x={x}", "--prop", f"y={y}", "--prop", f"width={w}", "--prop", f"height={h}",
    )


def text(slide, name, txt, x, y, w, h, size, color=WHITE, align="left", bold=False, font="Segoe UI"):
    args = [
        "add", FILE, f"/slide[{slide}]", "--type", "shape",
        "--prop", f"name={name}", "--prop", f"text={txt}",
        "--prop", f"font={font}", "--prop", f"size={size}", "--prop", f"color={color}",
        "--prop", f"align={align}", "--prop", "fill=none", "--prop", "line=none",
        "--prop", f"x={x}", "--prop", f"y={y}", "--prop", f"width={w}", "--prop", f"height={h}",
    ]
    if bold:
        args += ["--prop", "bold=true"]
    oc(*args)


def card(slide, name, x, y, w, h, fill=CARD, line=BORDER):
    shape(slide, name, "roundRect", fill, "1", line, x, y, w, h)


def accent(slide, name, x, y, w, h, color=BLUE):
    shape(slide, name, "rect", color, "1", "none", x, y, w, h)


def notes(slide, txt):
    oc("add", FILE, f"/slide[{slide}]", "--type", "notes", "--prop", f"text={txt}")


def main():
    print("Creating", FILE)
    if os.path.exists(FILE):
        try:
            os.remove(FILE)
        except OSError:
            oc("close", FILE)
            os.remove(FILE)

    oc("create", FILE)
    oc("open", FILE)
    oc(
        "set", FILE, "/",
        "--prop", "title=Fracture Methodology",
        "--prop", "author=Fracture",
        "--prop", "description=Technical methodology for Fracture AI video scene clustering",
    )

    # ── S1 Title ──────────────────────────────────────────
    print("S1: Title")
    add_slide(1)
    shape(1, "deco-orb-1", "ellipse", BLUE, "0.18", "none", "26cm", "1cm", "10cm", "10cm")
    shape(1, "deco-orb-2", "ellipse", PURPLE, "0.12", "none", "-2cm", "12cm", "8cm", "8cm")
    accent(1, "top-line", "2.2cm", "4.2cm", "4cm", "0.08cm", BLUE)
    text(1, "badge", "TECHNICAL METHODOLOGY", "2.2cm", "3.2cm", "14cm", "0.8cm", "12", BLUE, bold=True)
    text(1, "title", "Fracture", "2.2cm", "4.6cm", "28cm", "1.8cm", "54", WHITE, bold=True)
    text(1, "subtitle", "AI-Powered Scene Detection & Clustering Pipeline", "2.2cm", "6.6cm", "28cm", "1cm", "22", MUTED)
    text(1, "tagline", "Local · Offline · Lossless  |  Python · PyQt6 · CLIP · FFmpeg", "2.2cm", "8.2cm", "28cm", "0.7cm", "14", MUTED)
    for i, (label, col, x) in enumerate([
        ("Keyframe Extract", BLUE2, "2.2cm"),
        ("CLIP Embeddings", PURPLE, "7.8cm"),
        ("DBSCAN Clusters", GREEN, "13.4cm"),
        ("Lossless Export", AMBER, "19cm"),
    ]):
        card(1, f"pill-{i}", x, "10.2cm", "5.2cm", "0.9cm", SOFT, col)
        text(1, f"pill-t-{i}", label, x, "10.35cm", "5.2cm", "0.65cm", "12", col, "center", bold=True)
    notes(1, "Introduce Fracture: local AI video assistant for I-frame scene split, CLIP+DBSCAN clustering, lossless export.")

    # ── S2 Problem ────────────────────────────────────────
    print("S2: Problem")
    add_slide(2)
    accent(2, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(2, "sec", "01  PROBLEM", "1.8cm", "1cm", "10cm", "0.5cm", "12", BLUE, bold=True)
    text(2, "title", "Why automate scene splitting?", "1.8cm", "1.6cm", "28cm", "1.1cm", "32", WHITE, bold=True)
    problems = [
        ("Manual Editing Friction", RED,
         "Editors scrub large files frame-by-frame to find cut points. Dense I-frame structure and long runtimes make this slow, error-prone, and hard to scale."),
        ("Naive CV Approaches", AMBER,
         "Pixel-diff detectors re-decode every frame, struggle with gradual transitions, and lack semantic understanding of similar shots."),
        ("Fracture Goal", GREEN,
         "Near-instant keyframe extraction, semantic grouping of related scenes, interactive curation, and quality-preserving export — all offline."),
    ]
    for i, (t, c, b) in enumerate(problems):
        x = f"{1.8 + i * 9.8}cm"
        card(2, f"c{i}", x, "3.4cm", "9.2cm", "5.6cm")
        accent(2, f"ca{i}", x, "3.4cm", "9.2cm", "0.1cm", c)
        text(2, f"ct{i}", t, f"{1.8 + i * 9.8 + 0.4}cm", "3.8cm", "8.4cm", "0.7cm", "16", WHITE, bold=True)
        text(2, f"cb{i}", b, f"{1.8 + i * 9.8 + 0.4}cm", "4.7cm", "8.4cm", "3.8cm", "14", MUTED)
    text(2, "foot", "Design constraint: zero cloud dependency · no re-encode tax on export · tunable clustering",
         "1.8cm", "9.8cm", "28cm", "0.6cm", "13", MUTED)
    notes(2, "Frame the problem: speed, semantics, quality. Local offline workflows.")

    # ── S3 Pipeline ───────────────────────────────────────
    print("S3: Pipeline")
    add_slide(3)
    accent(3, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(3, "sec", "02  PIPELINE", "1.8cm", "0.9cm", "10cm", "0.5cm", "12", BLUE, bold=True)
    text(3, "title", "End-to-end methodology", "1.8cm", "1.5cm", "28cm", "0.9cm", "30", WHITE, bold=True)
    text(3, "sub", "Five stages from raw video to curated master", "1.8cm", "2.4cm", "28cm", "0.5cm", "14", MUTED)
    stages = [
        (CYAN, "Detect", "I-frame pts via ffprobe"),
        (BLUE, "Extract", "Mid-scene JPEG thumbs"),
        (PURPLE, "Embed", "CLIP ViT-B/32 vectors"),
        (AMBER, "Cluster", "DBSCAN on embeddings"),
        (GREEN, "Export", "FFmpeg concat copy"),
    ]
    sx = [1.6, 7.6, 13.6, 19.6, 25.6]
    for i, (col, title, desc) in enumerate(stages):
        x = f"{sx[i]}cm"
        nx = f"{sx[i] + 1.85}cm"
        card(3, f"stc{i}", x, "3.6cm", "5.4cm", "6cm")
        shape(3, f"stn{i}", "ellipse", col, "1", "none", nx, "4cm", "1.7cm", "1.7cm")
        text(3, f"stnum{i}", str(i + 1), nx, "4.3cm", "1.7cm", "1.2cm", "22", WHITE, "center", bold=True)
        text(3, f"stt{i}", title, x, "6cm", "5.4cm", "0.7cm", "16", WHITE, "center", bold=True)
        text(3, f"std{i}", desc, x, "6.8cm", "5.4cm", "2.2cm", "13", MUTED, "center")
    for i in range(4):
        text(3, f"arr{i}", ">", f"{sx[i] + 5.15}cm", "5.8cm", "0.6cm", "0.8cm", "20", BORDER, "center", bold=True)
    text(3, "mods", "Modules:  video_processor.py  →  ml_engine.py  →  ui_components.py  →  exporter.py",
         "1.8cm", "10.4cm", "28cm", "0.6cm", "13", MUTED)
    notes(3, "Walk five-stage pipeline and map each stage to a source module.")

    # ── S4 Detection ──────────────────────────────────────
    print("S4: Detection")
    add_slide(4)
    accent(4, "bar", "0", "0", "0.15cm", "19.05cm", CYAN)
    text(4, "sec", "03  SCENE DETECTION", "1.8cm", "0.9cm", "14cm", "0.5cm", "12", CYAN, bold=True)
    text(4, "title", "I-frame based cut points", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    card(4, "left", "1.8cm", "2.8cm", "15cm", "7.8cm")
    text(4, "lt", "How it works", "2.3cm", "3.2cm", "14cm", "0.6cm", "16", WHITE, bold=True)
    steps = [
        "1.  Run ffprobe on video stream packets",
        "2.  Select packets with keyframe flag (K)",
        "3.  Collect pts_time for each I-frame",
        "4.  Force 0.0 start + duration end bounds",
        "5.  Adjacent keyframes define scene [t_i, t_i+1)",
        "6.  Drop micro-scenes with duration < 0.1s",
    ]
    for i, s in enumerate(steps):
        text(4, f"lb{i}", s, "2.3cm", f"{4.1 + i * 0.55}cm", "14cm", "0.5cm", "14", MUTED)
    text(4, "why",
         "Why I-frames? Encoders place them at natural cut boundaries. Reading packet flags avoids full decode — much faster than frame-diff CV.",
         "2.3cm", "8.0cm", "14cm", "2cm", "13", MUTED)
    card(4, "right", "17.4cm", "2.8cm", "13.2cm", "7.8cm")
    text(4, "rt", "Tooling", "17.9cm", "3.2cm", "12cm", "0.6cm", "16", WHITE, bold=True)
    tools = [
        (CYAN, "ffprobe  ·  packet pts_time,flags", "CSV parse of keyframe timestamps"),
        (BLUE, "ffprobe  ·  format=duration", "Total length for end-of-file bound"),
        (GREEN, "video_processor.py", "detect_scenes_and_extract_frames"),
    ]
    for i, (c, t, d) in enumerate(tools):
        y = 4.1 + i * 1.8
        card(4, f"r{i}", "17.9cm", f"{y}cm", "12.2cm", "1.5cm", SOFT, c)
        text(4, f"r{i}t", t, "18.2cm", f"{y + 0.15}cm", "11.6cm", "0.5cm", "13", c, bold=True)
        text(4, f"r{i}d", d, "18.2cm", f"{y + 0.75}cm", "11.6cm", "0.5cm", "12", MUTED)
    notes(4, "Explain I-frame scene detection and why it is faster than full decode.")

    # ── S5 Extract ────────────────────────────────────────
    print("S5: Extract")
    add_slide(5)
    accent(5, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(5, "sec", "04  FRAME EXTRACTION", "1.8cm", "0.9cm", "14cm", "0.5cm", "12", BLUE, bold=True)
    text(5, "title", "Representative thumbnails at scale", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    cards5 = [
        (BLUE, "Sampling strategy",
         "For each scene [start, end]:\n\nmiddle = start + duration / 2\n\nExtract a single JPEG at middle time with ffmpeg -ss -vframes 1 -q:v 2.\n\nOne frame per scene is enough for semantic clustering and UI preview."),
        (PURPLE, "Parallelism",
         "ThreadPoolExecutor max_workers=8\n\nSemaphore(4) caps concurrent ffmpeg processes to avoid disk/CPU thrash.\n\nProgress callback maps completion to 10-50% of overall analysis bar."),
        (AMBER, "Artifacts",
         "Temp dir: %TEMP%/video_classifier_frames\n\nFiles: scene_XXXX.jpg\n\nScene dict: id, start_time, end_time, duration, frame_path\n\nWindows: hide console flashes via STARTF_USESHOWWINDOW."),
    ]
    for i, (c, t, b) in enumerate(cards5):
        x = f"{1.8 + i * 10}cm"
        card(5, f"m{i}", x, "2.9cm", "9.5cm", "7.6cm")
        accent(5, f"ma{i}", x, "2.9cm", "9.5cm", "0.1cm", c)
        text(5, f"mt{i}", t, f"{1.8 + i * 10 + 0.5}cm", "3.3cm", "8.6cm", "0.6cm", "16", WHITE, bold=True)
        text(5, f"mb{i}", b, f"{1.8 + i * 10 + 0.5}cm", "4.2cm", "8.6cm", "5.8cm", "14", MUTED)
    notes(5, "Detail parallel mid-scene thumbnail extraction and concurrency limits.")

    # ── S6 Embed ──────────────────────────────────────────
    print("S6: Embed")
    add_slide(6)
    accent(6, "bar", "0", "0", "0.15cm", "19.05cm", PURPLE)
    text(6, "sec", "05  VISUAL EMBEDDINGS", "1.8cm", "0.9cm", "16cm", "0.5cm", "12", PURPLE, bold=True)
    text(6, "title", "CLIP turns frames into vectors", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    card(6, "main", "1.8cm", "2.8cm", "18.5cm", "7.8cm")
    text(6, "mt", "Model: sentence-transformers / clip-ViT-B-32", "2.3cm", "3.2cm", "17.5cm", "0.6cm", "16", WHITE, bold=True)
    text(6, "mb",
         "OpenAI CLIP Vision Transformer encodes each scene JPEG into a dense embedding that captures semantic content — not just color histograms.\n\n"
         "• Images loaded via PIL, encoded in chunks of 32\n"
         "• encode batch_size = 8 for GPU/CPU balance\n"
         "• Embeddings stacked with numpy.vstack\n"
         "• Global singleton cache: model loads once, reused across imports\n"
         "• Progress window: ~50% load, ~70% encode",
         "2.3cm", "4.1cm", "17.5cm", "6cm", "14", MUTED)
    card(6, "side", "20.8cm", "2.8cm", "10.5cm", "7.8cm")
    text(6, "st", "Why CLIP?", "21.3cm", "3.2cm", "9.6cm", "0.6cm", "16", WHITE, bold=True)
    why = [
        (PURPLE, "Semantic similarity", "Same subject, different lighting still clusters"),
        (BLUE, "Zero-shot vision", "No custom labeled scene dataset needed"),
        (GREEN, "Local inference", "Runs fully offline after first download"),
    ]
    for i, (c, t, d) in enumerate(why):
        y = 4.1 + i * 2.0
        card(6, f"s{i}", "21.3cm", f"{y}cm", "9.6cm", "1.7cm", SOFT, c)
        text(6, f"s{i}t", t, "21.6cm", f"{y + 0.15}cm", "9cm", "0.5cm", "13", c, bold=True)
        text(6, f"s{i}d", d, "21.6cm", f"{y + 0.75}cm", "9cm", "0.7cm", "12", MUTED)
    notes(6, "Explain CLIP embedding strategy and model caching.")

    # ── S7 Cluster ────────────────────────────────────────
    print("S7: Cluster")
    add_slide(7)
    accent(7, "bar", "0", "0", "0.15cm", "19.05cm", AMBER)
    text(7, "sec", "06  CLUSTERING", "1.8cm", "0.9cm", "12cm", "0.5cm", "12", AMBER, bold=True)
    text(7, "title", "DBSCAN groups similar scenes", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    card(7, "a", "1.8cm", "2.8cm", "14.5cm", "7.8cm")
    text(7, "at", "Algorithm pipeline", "2.3cm", "3.2cm", "13.5cm", "0.6cm", "16", WHITE, bold=True)
    text(7, "ab",
         "1. StandardScaler on embedding matrix\n"
         "   — equalizes feature variance before density search\n\n"
         "2. DBSCAN metric=euclidean\n"
         "   — density-based: no pre-set K clusters\n\n"
         "3. Defaults (Settings-tunable):\n"
         "   · eps = 0.5   (neighborhood radius)\n"
         "   · min_samples = 2\n\n"
         "4. Label written to scene cluster field\n"
         "   — noise points get -1\n\n"
         "5. UI color-codes clusters in Media Pool",
         "2.3cm", "4cm", "13.5cm", "6.2cm", "13", MUTED)
    card(7, "b", "16.8cm", "2.8cm", "14.5cm", "3.6cm")
    text(7, "bt", "Why DBSCAN over K-Means?", "17.3cm", "3.2cm", "13.5cm", "0.55cm", "15", WHITE, bold=True)
    text(7, "bb",
         "Video scene counts are unknown a priori. DBSCAN discovers natural density groups and isolates outliers instead of forcing every frame into a fixed K.",
         "17.3cm", "4cm", "13.5cm", "2cm", "13", MUTED)
    card(7, "c", "16.8cm", "6.8cm", "14.5cm", "3.8cm")
    text(7, "ct", "User controls (Settings panel)", "17.3cm", "7.2cm", "13.5cm", "0.55cm", "15", WHITE, bold=True)
    text(7, "cb",
         "Higher eps  → fewer, broader clusters\n"
         "Lower eps   → more, tighter clusters\n"
         "Higher min_samples → stricter core points\n"
         "Re-run analysis after retuning",
         "17.3cm", "7.95cm", "13.5cm", "2.2cm", "13", MUTED)
    notes(7, "Cover StandardScaler + DBSCAN and tunable parameters.")

    # ── S8 Export ─────────────────────────────────────────
    print("S8: Export")
    add_slide(8)
    accent(8, "bar", "0", "0", "0.15cm", "19.05cm", GREEN)
    text(8, "sec", "07  CURATION & EXPORT", "1.8cm", "0.9cm", "16cm", "0.5cm", "12", GREEN, bold=True)
    text(8, "title", "Human-in-the-loop, lossless out", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    cards8 = [
        (BLUE, "Media Pool",
         "Clustered scene thumbnails\n\nHover → live preview worker (OpenCV decode of clip range)\n\nDrag selected clusters into Timeline Queue\n\nDark/light theme via stylesheet"),
        (PURPLE, "Timeline Queue",
         "Reorder by drag-and-drop\n\nInline remove / keyboard shortcuts\n\nPreserves scene start/end times for export\n\nCustom TimelineDelegate for polish"),
        (GREEN, "Lossless Export",
         "Build concat_list.txt:\n  file + inpoint + outpoint\n\nffmpeg -f concat -c copy\n\nNo re-encode → no quality loss\n\nExportWorker QThread keeps UI free"),
    ]
    for i, (c, t, b) in enumerate(cards8):
        x = f"{1.8 + i * 10}cm"
        card(8, f"u{i}", x, "2.8cm", "9.5cm", "7.8cm")
        accent(8, f"ua{i}", x, "2.8cm", "9.5cm", "0.1cm", c)
        text(8, f"ut{i}", t, f"{1.8 + i * 10 + 0.5}cm", "3.3cm", "8.6cm", "0.55cm", "16", WHITE, bold=True)
        text(8, f"ub{i}", b, f"{1.8 + i * 10 + 0.5}cm", "4.1cm", "8.6cm", "5.8cm", "13", MUTED)
    notes(8, "Describe curation UX and FFmpeg concat demuxer stream-copy export.")

    # ── S9 Architecture ───────────────────────────────────
    print("S9: Architecture")
    add_slide(9)
    accent(9, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(9, "sec", "08  ARCHITECTURE", "1.8cm", "0.9cm", "14cm", "0.5cm", "12", BLUE, bold=True)
    text(9, "title", "Layered desktop system", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    layers = [
        (BLUE, "UI Layer", "main.py · ui_components.py  —  MainWindow, SettingsDialog, SceneThumbnail, Timeline, Workers (QThread)"),
        (PURPLE, "Logic Layer", "ml_engine.py · video_processor.py  —  CLIP encode, DBSCAN, ffprobe parse, parallel extract"),
        (GREEN, "Media Layer", "exporter.py · FFmpeg / ffprobe / OpenCV  —  concat demuxer, preview decode, PATH dependency checks"),
        (AMBER, "Runtime", "PyQt6 Fusion · Windows VBS launcher · PyInstaller Fracture.exe · local model cache"),
    ]
    for i, (c, t, d) in enumerate(layers):
        y = 2.9 + i * 2.0
        card(9, f"L{i}", "1.8cm", f"{y}cm", "29.5cm", "1.7cm", SOFT, c)
        text(9, f"L{i}t", t, "2.2cm", f"{y + 0.15}cm", "6cm", "0.5cm", "14", c, bold=True)
        text(9, f"L{i}d", d, "8.5cm", f"{y + 0.3}cm", "22cm", "1.1cm", "13", MUTED)
    notes(9, "Show four-layer architecture from UI to runtime packaging.")

    # ── S10 Decisions ─────────────────────────────────────
    print("S10: Decisions")
    add_slide(10)
    accent(10, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(10, "sec", "09  DESIGN DECISIONS", "1.8cm", "0.9cm", "16cm", "0.5cm", "12", BLUE, bold=True)
    text(10, "title", "Trade-offs that shape Fracture", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    decisions = [
        (CYAN, "I-frames over full decode", "Speed first. Misses soft dissolves that lack new keyframes — acceptable for most encoded cuts."),
        (PURPLE, "CLIP over handcrafted features", "Semantic robustness without labeled data; model download + RAM cost on first run."),
        (AMBER, "DBSCAN over fixed-K", "Unknown cluster count; eps tuning required for best results."),
        (GREEN, "Stream-copy export", "Zero quality loss, but cut points must land on keyframes for clean seeks."),
        (BLUE, "Background QThreads", "UI stays responsive; cancel flags for analysis/export workers."),
        (RED, "Fully local stack", "Privacy + offline use; no server cost, user must install FFmpeg."),
    ]
    positions = [(1.8, 2.8), (12.3, 2.8), (22.8, 2.8), (1.8, 7.0), (12.3, 7.0), (22.8, 7.0)]
    for i, ((c, t, d), (x, y)) in enumerate(zip(decisions, positions)):
        card(10, f"d{i}", f"{x}cm", f"{y}cm", "9.8cm", "3.8cm")
        accent(10, f"da{i}", f"{x}cm", f"{y}cm", "9.8cm", "0.08cm", c)
        text(10, f"dt{i}", t, f"{x + 0.4}cm", f"{y + 0.4}cm", "9cm", "0.7cm", "14", WHITE, bold=True)
        text(10, f"dd{i}", d, f"{x + 0.4}cm", f"{y + 1.3}cm", "9cm", "2.1cm", "12", MUTED)
    notes(10, "Discuss methodology trade-offs honestly.")

    # ── S11 Stack ─────────────────────────────────────────
    print("S11: Stack")
    add_slide(11)
    accent(11, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(11, "sec", "10  TECHNOLOGY STACK", "1.8cm", "0.9cm", "16cm", "0.5cm", "12", BLUE, bold=True)
    text(11, "title", "Libraries & system tools", "1.8cm", "1.5cm", "28cm", "0.9cm", "28", WHITE, bold=True)
    stack = [
        (BLUE, "GUI", "PyQt6 · Fusion style · custom QSS"),
        (CYAN, "Video I/O", "FFmpeg · ffprobe · OpenCV (cv2)"),
        (PURPLE, "ML", "sentence-transformers · CLIP ViT-B/32"),
        (AMBER, "Clustering", "scikit-learn DBSCAN · StandardScaler · NumPy"),
        (GREEN, "Images", "Pillow (PIL) for embedding input"),
        (RED, "Packaging", "PyInstaller · Fracture.spec · Fracture.vbs"),
    ]
    for i, (c, cat, items) in enumerate(stack):
        row, col = divmod(i, 3)
        x = 1.8 + col * 10.2
        y = 2.9 + row * 3.9
        card(11, f"sk{i}", f"{x}cm", f"{y}cm", "9.7cm", "3.5cm")
        shape(11, f"skd{i}", "ellipse", c, "1", "none", f"{x + 0.45}cm", f"{y + 0.55}cm", "0.55cm", "0.55cm")
        text(11, f"skt{i}", cat, f"{x + 1.3}cm", f"{y + 0.5}cm", "7.8cm", "0.65cm", "16", WHITE, bold=True)
        text(11, f"ski{i}", items, f"{x + 0.45}cm", f"{y + 1.5}cm", "8.8cm", "1.5cm", "13", MUTED)
    notes(11, "Quick inventory of the technology stack.")

    # ── S12 Summary ───────────────────────────────────────
    print("S12: Summary")
    add_slide(12)
    shape(12, "orb", "ellipse", BLUE, "0.15", "none", "24cm", "0cm", "12cm", "12cm")
    accent(12, "bar", "0", "0", "0.15cm", "19.05cm", BLUE)
    text(12, "sec", "11  SUMMARY", "1.8cm", "1cm", "12cm", "0.5cm", "12", BLUE, bold=True)
    text(12, "title", "Methodology in one line", "1.8cm", "1.7cm", "28cm", "1cm", "30", WHITE, bold=True)
    text(12, "line",
         "Detect cuts from I-frames → embed mid-frames with CLIP → density-cluster with DBSCAN → curate → stream-copy export.",
         "1.8cm", "3cm", "28cm", "1.4cm", "16", MUTED)
    for i, (c, t, d) in enumerate([
        (CYAN, "Fast", "Packet-level scene cuts + parallel thumbnail extraction, not full frame decode."),
        (PURPLE, "Semantic", "CLIP embeddings + DBSCAN group visually related scenes without predefining K."),
        (GREEN, "Lossless", "FFmpeg concat demuxer with -c copy preserves original bitstreams."),
    ]):
        x = f"{1.8 + i * 10.2}cm"
        card(12, f"k{i}", x, "5cm", "9.5cm", "4.2cm")
        text(12, f"kt{i}", t, f"{1.8 + i * 10.2 + 0.5}cm", "5.5cm", "8.5cm", "0.6cm", "18", c, bold=True)
        text(12, f"kd{i}", d, f"{1.8 + i * 10.2 + 0.5}cm", "6.4cm", "8.5cm", "2.2cm", "14", MUTED)
    text(12, "end", "Fracture  ·  Local AI video scene assistant  ·  methodology deck",
         "1.8cm", "10cm", "28cm", "0.6cm", "13", MUTED)
    notes(12, "Close with the three pillars: Fast, Semantic, Lossless.")

    print("Closing...")
    oc("close", FILE)
    print("Done:", FILE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
