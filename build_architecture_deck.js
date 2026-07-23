/**
 * Fracture — Architecture Presentation (pptxgenjs)
 * Dark premium deck aligned with the Fracture product UI.
 */
const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "Fracture_Architecture.pptx");
const PIPELINE_IMG = path.join(__dirname, "output", "fracture_pipeline.png");

const C = {
  bg: "09090B",
  card: "18181B",
  soft: "1E293B",
  border: "27272A",
  white: "FAFAFA",
  muted: "A1A1AA",
  dim: "71717A",
  blue: "2563EB",
  cyan: "06B6D4",
  purple: "8B5CF6",
  green: "22C55E",
  amber: "F59E0B",
  orange: "F97316",
  red: "EF4444",
};

const TOTAL = 11;

function sh() {
  return { type: "outer", color: "000000", blur: 14, offset: 3, opacity: 0.35 };
}

function bg(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: C.bg },
  });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: opts.fill || C.card },
    line: { color: opts.line || C.border, width: 1 },
    rectRadius: opts.r ?? 0.1,
    shadow: opts.noShadow ? undefined : sh(),
  });
}

function pill(slide, x, y, w, h, label, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: C.soft },
    line: { color, width: 1.25 },
    rectRadius: 0.08,
  });
  slide.addText(label, {
    x, y, w, h,
    fontSize: 11, fontFace: "Calibri", bold: true,
    color, align: "center", valign: "middle", margin: 0,
  });
}

function sec(slide, label, color = C.blue) {
  slide.addText(label, {
    x: 0.5, y: 0.26, w: 9, h: 0.3,
    fontSize: 11, fontFace: "Calibri", bold: true,
    color, margin: 0, charSpacing: 2,
  });
}

function h1(slide, text, y = 0.52) {
  slide.addText(text, {
    x: 0.5, y, w: 9.1, h: 0.5,
    fontSize: 26, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });
}

function sub(slide, text, y = 1.02) {
  slide.addText(text, {
    x: 0.5, y, w: 9.1, h: 0.35,
    fontSize: 13, fontFace: "Calibri",
    color: C.muted, margin: 0,
  });
}

function foot(slide, n) {
  slide.addText("Fracture  ·  Architecture", {
    x: 0.5, y: 5.3, w: 6, h: 0.22,
    fontSize: 10, fontFace: "Calibri", color: C.dim, margin: 0,
  });
  slide.addText(`${n}  /  ${TOTAL}`, {
    x: 8.3, y: 5.3, w: 1.3, h: 0.22,
    fontSize: 10, fontFace: "Calibri", color: C.dim, align: "right", margin: 0,
  });
}

function dotRow(slide, items, x0, y0, w, color) {
  items.forEach((t, i) => {
    const y = y0 + i * 0.38;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x0, y: y + 0.08, w: 0.12, h: 0.12,
      fill: { color },
      line: { color, transparency: 100 },
    });
    slide.addText(t, {
      x: x0 + 0.24, y, w: w - 0.24, h: 0.34,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0, valign: "middle",
    });
  });
}

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 });
pptx.layout = "LAYOUT_16x9";
pptx.author = "Fracture";
pptx.title = "Fracture Architecture";
pptx.subject = "Local AI video scene clustering — system architecture";

// ───────── S1 Title ─────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.ellipse, {
    x: 7.0, y: -1.0, w: 4.5, h: 4.5,
    fill: { color: C.blue, transparency: 84 },
    line: { color: C.blue, transparency: 100 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: -1.4, y: 3.0, w: 3.6, h: 3.6,
    fill: { color: C.purple, transparency: 88 },
    line: { color: C.purple, transparency: 100 },
  });

  s.addText("SYSTEM ARCHITECTURE", {
    x: 0.7, y: 1.25, w: 8.5, h: 0.32,
    fontSize: 12, fontFace: "Calibri", bold: true,
    color: C.blue, margin: 0, charSpacing: 3,
  });
  s.addText("Fracture", {
    x: 0.7, y: 1.65, w: 8.5, h: 0.85,
    fontSize: 52, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });
  s.addText("Local AI video scene detection, clustering & lossless export", {
    x: 0.7, y: 2.55, w: 8.6, h: 0.38,
    fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0,
  });

  [
    ["I-frame Extract", C.cyan],
    ["CLIP Embeddings", C.purple],
    ["DBSCAN Clusters", C.green],
    ["Lossless Export", C.amber],
  ].forEach(([label, col], i) => pill(s, 0.7 + i * 2.2, 3.35, 2.05, 0.42, label, col));

  s.addText("Python  ·  PyQt6  ·  FFmpeg  ·  sentence-transformers  ·  scikit-learn", {
    x: 0.7, y: 4.2, w: 8.6, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.dim, margin: 0,
  });
  s.addNotes("Introduce Fracture: local AI desktop assistant for scene split, clustering, and lossless export.");
}

// ───────── S2 Overview ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "01  OVERVIEW");
  h1(s, "What Fracture does");
  sub(s, "Split a video by scenes → group look-alikes with AI → curate a timeline → export without re-encoding.");

  const items = [
    { n: "1", t: "Fast scene split", d: "ffprobe I-frames instead of decoding every frame — near-instant cut points.", c: C.cyan },
    { n: "2", t: "Semantic clusters", d: "CLIP embeddings + DBSCAN group related scenes without choosing K.", c: C.purple },
    { n: "3", t: "Human curation", d: "Media Pool + Timeline: pick, reorder, delete. Hover previews keep context.", c: C.blue },
    { n: "4", t: "Lossless master", d: "FFmpeg concat demuxer with stream copy — quality in equals quality out.", c: C.green },
  ];
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.75;
    const y = 1.55 + row * 1.6;
    card(s, x, y, 4.5, 1.45);
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.22, y: y + 0.5, w: 0.4, h: 0.4,
      fill: { color: it.c },
      line: { color: it.c, transparency: 100 },
    });
    s.addText(it.n, {
      x: x + 0.22, y: y + 0.5, w: 0.4, h: 0.4,
      fontSize: 13, fontFace: "Calibri", bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(it.t, {
      x: x + 0.8, y: y + 0.28, w: 3.45, h: 0.35,
      fontSize: 16, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.8, y: y + 0.7, w: 3.45, h: 0.55,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });
  foot(s, 2);
  s.addNotes("Four value props. Stress offline operation and no re-encode tax.");
}

// ───────── S3 Layers ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "02  ARCHITECTURE");
  h1(s, "Three layers, one desktop process");
  sub(s, "The UI never blocks — heavy work runs in QThreads that call processors, ML, and FFmpeg.");

  const layers = [
    {
      name: "Presentation",
      color: C.cyan,
      files: "main.py  ·  ui_components.py",
      bits: ["MainWindow, Settings, Timeline", "Media Pool scene grid", "PreviewWorker on hover", "Dark / light themes"],
    },
    {
      name: "Logic",
      color: C.green,
      files: "workers  ·  processor  ·  ML  ·  export",
      bits: ["AnalysisWorker thread", "ExportWorker thread", "Detect → embed → cluster", "Concat list builder"],
    },
    {
      name: "System / Media",
      color: C.purple,
      files: "FFmpeg  ·  CLIP  ·  OpenCV  ·  disk",
      bits: ["ffprobe I-frame timestamps", "Mid-scene JPEG thumbs", "CLIP ViT-B/32 vectors", "concat -c copy output"],
    },
  ];

  layers.forEach((L, i) => {
    const x = 0.45 + i * 3.18;
    card(s, x, 1.55, 3.05, 3.4);
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.18, y: 1.75, w: 2.7, h: 0.38,
      fill: { color: L.color, transparency: 78 },
      line: { color: L.color, width: 1 },
      rectRadius: 0.06,
    });
    s.addText(L.name, {
      x: x + 0.18, y: 1.75, w: 2.7, h: 0.38,
      fontSize: 13, fontFace: "Calibri", bold: true,
      color: L.color, align: "center", valign: "middle", margin: 0,
    });
    s.addText(L.files, {
      x: x + 0.15, y: 2.25, w: 2.75, h: 0.5,
      fontSize: 10, fontFace: "Calibri", color: C.dim, align: "center", margin: 0,
    });
    dotRow(s, L.bits, x + 0.25, 2.9, 2.6, L.color);
  });
  foot(s, 3);
  s.addNotes("UI → Logic workers → System tools. Keep the UI thread free.");
}

// ───────── S4 Data flow ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "03  DATA FLOW");
  h1(s, "End-to-end pipeline");
  sub(s, "From raw video file to curated master MP4 — seven stages.");

  const stages = [
    { t: "Video", d: "MP4/MKV\nAVI/MOV", c: C.muted },
    { t: "I-frames", d: "ffprobe\npacket flags", c: C.cyan },
    { t: "JPEGs", d: "mid-scene\nextract", c: C.blue },
    { t: "Embed", d: "CLIP\n512-d", c: C.purple },
    { t: "Cluster", d: "DBSCAN\neps / min", c: C.amber },
    { t: "Timeline", d: "curate &\nreorder", c: C.green },
    { t: "Export", d: "concat\n-c copy", c: C.orange },
  ];

  stages.forEach((st, i) => {
    const x = 0.35 + i * 1.38;
    card(s, x, 1.7, 1.25, 1.85, { noShadow: true });
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.38, y: 1.88, w: 0.48, h: 0.48,
      fill: { color: st.c },
      line: { color: st.c, transparency: 100 },
    });
    s.addText(String(i + 1), {
      x: x + 0.38, y: 1.88, w: 0.48, h: 0.48,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.t, {
      x: x + 0.05, y: 2.5, w: 1.15, h: 0.32,
      fontSize: 12, fontFace: "Calibri", bold: true,
      color: C.white, align: "center", margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.05, y: 2.85, w: 1.15, h: 0.55,
      fontSize: 10, fontFace: "Calibri",
      color: C.muted, align: "center", margin: 0,
    });
    if (i < stages.length - 1) {
      s.addText("→", {
        x: x + 1.18, y: 2.4, w: 0.25, h: 0.35,
        fontSize: 14, fontFace: "Calibri", bold: true,
        color: C.border, align: "center", margin: 0,
      });
    }
  });

  // Module mapping strip
  card(s, 0.5, 3.85, 9.0, 1.1, { fill: C.soft, noShadow: true });
  s.addText("Module map", {
    x: 0.7, y: 3.98, w: 2, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: C.blue, margin: 0,
  });
  s.addText("video_processor.py     →     ml_engine.py     →     ui_components.py     →     exporter.py", {
    x: 0.7, y: 4.35, w: 8.6, h: 0.35,
    fontSize: 13, fontFace: "Calibri", color: C.white, margin: 0,
  });
  foot(s, 4);
  s.addNotes("Walk the seven-stage flow and map stages to source modules.");
}

// ───────── S5 Detection & extract ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "04  SCENE DETECTION", C.cyan);
  h1(s, "I-frames in, JPEGs out");
  sub(s, "Avoid full decode. Read packet headers, then sample one frame per scene.");

  card(s, 0.5, 1.5, 4.5, 3.4);
  s.addText("Detect  ·  ffprobe", {
    x: 0.75, y: 1.7, w: 4, h: 0.35,
    fontSize: 15, fontFace: "Calibri", bold: true, color: C.cyan, margin: 0,
  });
  const left = [
    "Select video stream packets",
    "Keep rows with keyframe flag K",
    "Collect pts_time timestamps",
    "Bound with 0.0 and duration",
    "Scene = [tᵢ , tᵢ₊₁)",
    "Drop micro-scenes < 0.1s",
  ];
  left.forEach((t, i) => {
    s.addText(`${i + 1}.  ${t}`, {
      x: 0.75, y: 2.2 + i * 0.38, w: 4, h: 0.35,
      fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });

  card(s, 5.2, 1.5, 4.3, 3.4);
  s.addText("Extract  ·  ffmpeg", {
    x: 5.45, y: 1.7, w: 3.9, h: 0.35,
    fontSize: 15, fontFace: "Calibri", bold: true, color: C.blue, margin: 0,
  });
  const right = [
    { h: "Midpoint sample", d: "start + duration / 2 → one JPEG" },
    { h: "Parallelism", d: "8 workers, semaphore(4) cap" },
    { h: "Artifacts", d: "%TEMP%/video_classifier_frames" },
    { h: "Windows polish", d: "Hide console via STARTUPINFO" },
  ];
  right.forEach((r, i) => {
    const y = 2.2 + i * 0.62;
    s.addText(r.h, {
      x: 5.45, y, w: 3.85, h: 0.28,
      fontSize: 13, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
    });
    s.addText(r.d, {
      x: 5.45, y: y + 0.26, w: 3.85, h: 0.28,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });
  foot(s, 5);
  s.addNotes("I-frame detection is the speed secret. Parallel extract feeds CLIP.");
}

// ───────── S6 ML ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "05  MACHINE LEARNING", C.purple);
  h1(s, "CLIP embeddings + DBSCAN");
  sub(s, "Vision semantics first, density clustering second — no labeled dataset required.");

  // left CLIP
  card(s, 0.5, 1.5, 4.5, 3.4);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.7, y: 1.7, w: 1.5, h: 0.32,
    fill: { color: C.purple, transparency: 75 },
    line: { color: C.purple, width: 1 },
    rectRadius: 0.05,
  });
  s.addText("EMBED", {
    x: 0.7, y: 1.7, w: 1.5, h: 0.32,
    fontSize: 11, fontFace: "Calibri", bold: true,
    color: C.purple, align: "center", valign: "middle", margin: 0,
  });
  s.addText("clip-ViT-B-32", {
    x: 0.7, y: 2.15, w: 4.05, h: 0.35,
    fontSize: 18, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
  });
  s.addText("sentence-transformers · local inference after first download", {
    x: 0.7, y: 2.5, w: 4.05, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.dim, margin: 0,
  });
  const clipBits = [
    "PIL opens each scene JPEG",
    "Encode chunks of 32, batch 8",
    "512-d semantic vector per scene",
    "Global model singleton (cached)",
    "Captures content, not just color",
  ];
  clipBits.forEach((t, i) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: 0.75, y: 3.05 + i * 0.32, w: 0.1, h: 0.1,
      fill: { color: C.purple },
      line: { color: C.purple, transparency: 100 },
    });
    s.addText(t, {
      x: 1.0, y: 2.96 + i * 0.32, w: 3.75, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });

  // right DBSCAN
  card(s, 5.2, 1.5, 4.3, 3.4);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 5.4, y: 1.7, w: 1.7, h: 0.32,
    fill: { color: C.amber, transparency: 75 },
    line: { color: C.amber, width: 1 },
    rectRadius: 0.05,
  });
  s.addText("CLUSTER", {
    x: 5.4, y: 1.7, w: 1.7, h: 0.32,
    fontSize: 11, fontFace: "Calibri", bold: true,
    color: C.amber, align: "center", valign: "middle", margin: 0,
  });
  s.addText("DBSCAN", {
    x: 5.4, y: 2.15, w: 3.9, h: 0.35,
    fontSize: 18, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
  });
  s.addText("No fixed K  ·  density-based  ·  noise label −1", {
    x: 5.4, y: 2.5, w: 3.9, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.dim, margin: 0,
  });

  // param cards
  [
    { k: "eps", v: "0.5", d: "Neighborhood radius" },
    { k: "min_samples", v: "2", d: "Core point threshold" },
  ].forEach((p, i) => {
    const x = 5.4 + i * 1.95;
    card(s, x, 3.0, 1.85, 1.55, { fill: C.soft, noShadow: true, line: C.border });
    s.addText(p.k, {
      x: x + 0.1, y: 3.15, w: 1.65, h: 0.28,
      fontSize: 11, fontFace: "Calibri", color: C.amber, margin: 0,
    });
    s.addText(p.v, {
      x: x + 0.1, y: 3.45, w: 1.65, h: 0.45,
      fontSize: 28, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
    });
    s.addText(p.d, {
      x: x + 0.1, y: 4.05, w: 1.65, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });
  foot(s, 6);
  s.addNotes("CLIP for meaning, DBSCAN for grouping. Settings panel tunes eps / min_samples.");
}

// ───────── S7 UI ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "06  PRESENTATION LAYER", C.cyan);
  h1(s, "Curation without leaving the desk");
  sub(s, "PyQt6 dark UI: Media Pool above, Timeline below, workers for analysis and export.");

  const ui = [
    { t: "Media Pool", d: "Cluster-sorted scene thumbnails. Click to add. Hover plays a short OpenCV preview (≤15 fps).", c: C.cyan },
    { t: "Timeline", d: "Drag-reorder queue. Inline delete icon or Del/Backspace. Order = export order.", c: C.blue },
    { t: "Settings", d: "Theme, DBSCAN eps (0.1–5.0), min samples (1–20). Applied on next analysis run.", c: C.purple },
    { t: "Workers", d: "AnalysisWorker + ExportWorker + PreviewWorker keep the main thread responsive.", c: C.green },
  ];
  ui.forEach((u, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.75;
    const y = 1.55 + row * 1.6;
    card(s, x, y, 4.5, 1.45);
    s.addText(u.t, {
      x: x + 0.3, y: y + 0.28, w: 3.95, h: 0.35,
      fontSize: 16, fontFace: "Calibri", bold: true, color: u.c, margin: 0,
    });
    s.addText(u.d, {
      x: x + 0.3, y: y + 0.7, w: 3.95, h: 0.55,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });
  foot(s, 7);
  s.addNotes("Human-in-the-loop: AI proposes clusters, editor builds the story.");
}

// ───────── S8 Export ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "07  EXPORT", C.orange);
  h1(s, "Lossless stitch via concat demuxer");
  sub(s, "No quality tax. Stream copy preserves the original codec bitstream.");

  // steps
  const steps = [
    { n: "01", t: "Collect order", d: "Read timeline list UserRole scene dicts in visual order." },
    { n: "02", t: "Write list", d: "Temp concat_list.txt with file + inpoint + outpoint per scene." },
    { n: "03", t: "Run FFmpeg", d: "ffmpeg -f concat -safe 0 -i list -c copy out.mp4" },
    { n: "04", t: "Cleanup", d: "Delete temp list. Notify UI. Keep ExportWorker non-blocking." },
  ];
  steps.forEach((st, i) => {
    const x = 0.5 + i * 2.35;
    card(s, x, 1.55, 2.2, 2.55);
    s.addText(st.n, {
      x: x + 0.15, y: 1.75, w: 1.9, h: 0.35,
      fontSize: 18, fontFace: "Calibri", bold: true, color: C.orange, margin: 0,
    });
    s.addText(st.t, {
      x: x + 0.15, y: 2.25, w: 1.9, h: 0.35,
      fontSize: 14, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.15, y: 2.7, w: 1.9, h: 1.1,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });

  card(s, 0.5, 4.3, 9.0, 0.75, { fill: C.soft, noShadow: true });
  s.addText("Why -c copy?  Cuts snap to keyframe-aligned in/out points already derived from I-frames — so stream copy is both fast and correct.", {
    x: 0.7, y: 4.42, w: 8.6, h: 0.5,
    fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0, valign: "middle",
  });
  foot(s, 8);
  s.addNotes("Explain concat demuxer and why I-frame boundaries make -c copy safe.");
}

// ───────── S9 Stack ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "08  TECHNOLOGY");
  h1(s, "Stack at a glance");
  sub(s, "Everything runs locally on Windows. FFmpeg must be on PATH.");

  const stack = [
    { t: "GUI", d: "PyQt6 · Fusion style · custom QSS", c: C.cyan },
    { t: "Video I/O", d: "FFmpeg · ffprobe · OpenCV", c: C.blue },
    { t: "ML", d: "CLIP ViT-B/32 · scikit-learn DBSCAN", c: C.purple },
    { t: "Packaging", d: "PyInstaller one-file · Fracture.exe", c: C.amber },
    { t: "Concurrency", d: "QThread · ThreadPool · Semaphore(4)", c: C.green },
    { t: "Storage", d: "Temp JPEGs · model cache · MP4 out", c: C.orange },
  ];
  stack.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.15;
    const y = 1.55 + row * 1.6;
    card(s, x, y, 3.0, 1.4);
    s.addText(st.t, {
      x: x + 0.25, y: y + 0.3, w: 2.5, h: 0.35,
      fontSize: 15, fontFace: "Calibri", bold: true, color: st.c, margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.25, y: y + 0.75, w: 2.5, h: 0.4,
      fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });
  foot(s, 9);
  s.addNotes("Call out PATH dependency for FFmpeg and offline model cache.");
}

// ───────── S10 How to use ─────────
{
  const s = pptx.addSlide();
  bg(s);
  sec(s, "09  WORKFLOW");
  h1(s, "Five clicks to a master");
  sub(s, "Designed for speed: analyze once, curate freely, export lossless.");

  const steps = [
    { n: "1", t: "Import", d: "Load MP4 / MKV / AVI / MOV" },
    { n: "2", t: "Analyze", d: "Background detect + cluster" },
    { n: "3", t: "Tune", d: "Optional eps / min_samples" },
    { n: "4", t: "Curate", d: "Build timeline from pool" },
    { n: "5", t: "Export", d: "Merge & save master MP4" },
  ];
  steps.forEach((st, i) => {
    const x = 0.45 + i * 1.9;
    // connector
    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.rect, {
        x: x + 1.55, y: 2.85, w: 0.5, h: 0.04,
        fill: { color: C.border },
        line: { color: C.border, transparency: 100 },
      });
    }
    card(s, x, 1.8, 1.75, 2.6);
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.55, y: 2.1, w: 0.65, h: 0.65,
      fill: { color: C.blue },
      line: { color: C.blue, transparency: 100 },
    });
    s.addText(st.n, {
      x: x + 0.55, y: 2.1, w: 0.65, h: 0.65,
      fontSize: 20, fontFace: "Calibri", bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.t, {
      x: x + 0.1, y: 3.0, w: 1.55, h: 0.4,
      fontSize: 15, fontFace: "Calibri", bold: true,
      color: C.white, align: "center", margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.1, y: 3.45, w: 1.55, h: 0.7,
      fontSize: 12, fontFace: "Calibri",
      color: C.muted, align: "center", margin: 0,
    });
  });
  foot(s, 10);
  s.addNotes("Demo path: import → wait for analysis → drag scenes → export.");
}

// ───────── S11 Close ─────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.ellipse, {
    x: 6.8, y: -0.6, w: 4.2, h: 4.2,
    fill: { color: C.blue, transparency: 86 },
    line: { color: C.blue, transparency: 100 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: -1.2, y: 3.4, w: 3, h: 3,
    fill: { color: C.purple, transparency: 90 },
    line: { color: C.purple, transparency: 100 },
  });

  s.addText("IN ONE LINE", {
    x: 0.7, y: 1.5, w: 8.5, h: 0.3,
    fontSize: 12, fontFace: "Calibri", bold: true,
    color: C.blue, margin: 0, charSpacing: 3,
  });
  s.addText("UI picks clips. AI groups look-alikes.\nFFmpeg does the real video work — all local.", {
    x: 0.7, y: 2.0, w: 8.5, h: 1.2,
    fontSize: 26, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });
  s.addText("Fracture  ·  offline  ·  lossless  ·  open stack", {
    x: 0.7, y: 3.5, w: 8.5, h: 0.35,
    fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0,
  });
  s.addText("Companion diagram: output/fracture-architecture.html", {
    x: 0.7, y: 4.3, w: 8.5, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.dim, margin: 0,
  });
  s.addNotes("Close on the mental model. Point to architecture HTML if needed.");
}

// Optional pipeline image slide if asset exists — insert before close? Already 11 slides.
// If image exists, we could replace S4 content area — skip to keep count clean.

pptx.writeFile({ fileName: OUT })
  .then(() => {
    console.log("Wrote", OUT);
    if (fs.existsSync(PIPELINE_IMG)) {
      console.log("Pipeline image available at", PIPELINE_IMG, "(not embedded; flow is vector-style)");
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
