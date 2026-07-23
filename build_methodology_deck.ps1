<# Build Fracture Methodology deck with officecli #>
$ErrorActionPreference = "Continue"
$FILE = Join-Path $PSScriptRoot "Fracture_Methodology.pptx"

# Fracture-aligned palette
$BG     = "09090B"
$CARD   = "18181B"
$BORDER = "27272A"
$BLUE   = "2563EB"
$BLUE2  = "3B82F6"
$WHITE  = "FAFAFA"
$MUTED  = "A1A1AA"
$GREEN  = "22C55E"
$PURPLE = "8B5CF6"
$AMBER  = "F59E0B"
$CYAN   = "06B6D4"
$RED    = "EF4444"
$SOFT   = "1E293B"

function OC([string[]]$ArgsList) {
    & officecli @ArgsList 2>&1 | Out-Null
}

function New-Slide($num, $bg = $BG) {
    OC @("add", $FILE, "/", "--type", "slide", "--prop", "layout=blank", "--prop", "background=$bg")
}

function Shape($slide, $name, $preset, $fill, $opacity, $line, $x, $y, $w, $h) {
    OC @("add", $FILE, "/slide[$slide]", "--type", "shape",
        "--prop", "name=$name", "--prop", "preset=$preset",
        "--prop", "fill=$fill", "--prop", "opacity=$opacity", "--prop", "line=$line",
        "--prop", "x=$x", "--prop", "y=$y", "--prop", "width=$w", "--prop", "height=$h")
}

function Text($slide, $name, $text, $x, $y, $w, $h, $size, $color = $WHITE, $align = "left", [switch]$Bold, $font = "Segoe UI") {
    $args = @(
        "add", $FILE, "/slide[$slide]", "--type", "shape",
        "--prop", "name=$name", "--prop", "text=$text",
        "--prop", "font=$font", "--prop", "size=$size", "--prop", "color=$color",
        "--prop", "align=$align", "--prop", "fill=none", "--prop", "line=none",
        "--prop", "x=$x", "--prop", "y=$y", "--prop", "width=$w", "--prop", "height=$h"
    )
    if ($Bold) { $args += @("--prop", "bold=true") }
    OC $args
}

function Card($slide, $name, $x, $y, $w, $h, $fill = $CARD, $line = $BORDER) {
    Shape $slide $name "roundRect" $fill "1" $line $x $y $w $h
}

function AccentBar($slide, $name, $x, $y, $w, $h, $color = $BLUE) {
    Shape $slide $name "rect" $color "1" "none" $x $y $w $h
}

function Notes($slide, $text) {
    OC @("add", $FILE, "/slide[$slide]", "--type", "notes", "--prop", "text=$text")
}

Write-Host "Creating $FILE ..."
if (Test-Path $FILE) { Remove-Item $FILE -Force }
OC @("create", $FILE)
OC @("open", $FILE)
OC @("set", $FILE, "/", "--prop", "title=Fracture Methodology", "--prop", "author=Fracture", "--prop", "description=Technical methodology for Fracture AI video scene clustering")

# ═══════════════════════════════════════════════════════════
# S1 — Title
# ═══════════════════════════════════════════════════════════
Write-Host "S1: Title"
New-Slide 1
Shape 1 "deco-orb-1" "ellipse" $BLUE "0.18" "none" "26cm" "1cm" "10cm" "10cm"
Shape 1 "deco-orb-2" "ellipse" $PURPLE "0.12" "none" "-2cm" "12cm" "8cm" "8cm"
AccentBar 1 "top-line" "2.2cm" "4.2cm" "4cm" "0.08cm" $BLUE
Text 1 "badge" "TECHNICAL METHODOLOGY" "2.2cm" "3.2cm" "14cm" "0.8cm" "12" $BLUE "left" -Bold
Text 1 "title" "Fracture" "2.2cm" "4.6cm" "28cm" "1.8cm" "54" $WHITE "left" -Bold
Text 1 "subtitle" "AI-Powered Scene Detection & Clustering Pipeline" "2.2cm" "6.6cm" "28cm" "1cm" "22" $MUTED
Text 1 "tagline" "Local · Offline · Lossless  |  Python · PyQt6 · CLIP · FFmpeg" "2.2cm" "8.2cm" "28cm" "0.7cm" "14" $MUTED
Card 1 "pill-1" "2.2cm" "10.2cm" "5.2cm" "0.9cm" $SOFT $BLUE
Text 1 "pill-1-t" "Keyframe Extract" "2.2cm" "10.35cm" "5.2cm" "0.65cm" "12" $BLUE2 "center" -Bold
Card 1 "pill-2" "7.8cm" "10.2cm" "5.2cm" "0.9cm" $SOFT $PURPLE
Text 1 "pill-2-t" "CLIP Embeddings" "7.8cm" "10.35cm" "5.2cm" "0.65cm" "12" $PURPLE "center" -Bold
Card 1 "pill-3" "13.4cm" "10.2cm" "5.2cm" "0.9cm" $SOFT $GREEN
Text 1 "pill-3-t" "DBSCAN Clusters" "13.4cm" "10.35cm" "5.2cm" "0.65cm" "12" $GREEN "center" -Bold
Card 1 "pill-4" "19cm" "10.2cm" "5.2cm" "0.9cm" $SOFT $AMBER
Text 1 "pill-4-t" "Lossless Export" "19cm" "10.35cm" "5.2cm" "0.65cm" "12" $AMBER "center" -Bold
Notes 1 "Introduce Fracture as a local AI video assistant that splits scenes via I-frames, clusters them with CLIP+DBSCAN, and exports losslessly."

# ═══════════════════════════════════════════════════════════
# S2 — Problem & Goal
# ═══════════════════════════════════════════════════════════
Write-Host "S2: Problem"
New-Slide 2
AccentBar 2 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 2 "sec" "01  PROBLEM" "1.8cm" "1cm" "10cm" "0.5cm" "12" $BLUE "left" -Bold
Text 2 "title" "Why automate scene splitting?" "1.8cm" "1.6cm" "28cm" "1.1cm" "32" $WHITE "left" -Bold

# Problem cards
Card 2 "c1" "1.8cm" "3.4cm" "9.2cm" "5.6cm"
AccentBar 2 "c1a" "1.8cm" "3.4cm" "9.2cm" "0.1cm" $RED
Text 2 "c1t" "Manual Editing Friction" "2.2cm" "3.8cm" "8.4cm" "0.7cm" "16" $WHITE "left" -Bold
Text 2 "c1b" "Editors scrub large files frame-by-frame to find cut points. Dense I-frame structure and long runtimes make this slow, error-prone, and hard to scale across many clips." "2.2cm" "4.7cm" "8.4cm" "3.8cm" "14" $MUTED

Card 2 "c2" "11.6cm" "3.4cm" "9.2cm" "5.6cm"
AccentBar 2 "c2a" "11.6cm" "3.4cm" "9.2cm" "0.1cm" $AMBER
Text 2 "c2t" "Naive CV Approaches" "12cm" "3.8cm" "8.4cm" "0.7cm" "16" $WHITE "left" -Bold
Text 2 "c2b" "Pixel-diff scene detectors re-decode every frame, struggle with gradual transitions, and lack semantic understanding — two visually similar shots in different places look 'different' to pure pixel metrics." "12cm" "4.7cm" "8.4cm" "3.8cm" "14" $MUTED

Card 2 "c3" "21.4cm" "3.4cm" "9.2cm" "5.6cm"
AccentBar 2 "c3a" "21.4cm" "3.4cm" "9.2cm" "0.1cm" $GREEN
Text 2 "c3t" "Fracture Goal" "21.8cm" "3.8cm" "8.4cm" "0.7cm" "16" $WHITE "left" -Bold
Text 2 "c3b" "Near-instant keyframe extraction, semantic grouping of related scenes, interactive curation, and quality-preserving export — all offline on the desktop." "21.8cm" "4.7cm" "8.4cm" "3.8cm" "14" $MUTED

Text 2 "foot" "Design constraint: zero cloud dependency · no re-encode tax on export · tunable clustering" "1.8cm" "9.8cm" "28cm" "0.6cm" "13" $MUTED
Notes 2 "Frame the problem: speed, semantics, and quality. Fracture targets local offline workflows."

# ═══════════════════════════════════════════════════════════
# S3 — Pipeline Overview
# ═══════════════════════════════════════════════════════════
Write-Host "S3: Pipeline"
New-Slide 3
AccentBar 3 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 3 "sec" "02  PIPELINE" "1.8cm" "0.9cm" "10cm" "0.5cm" "12" $BLUE "left" -Bold
Text 3 "title" "End-to-end methodology" "1.8cm" "1.5cm" "28cm" "0.9cm" "30" $WHITE "left" -Bold
Text 3 "sub" "Five stages from raw video to curated master" "1.8cm" "2.4cm" "28cm" "0.5cm" "14" $MUTED

$sx = @(1.6, 7.6, 13.6, 19.6, 25.6)
$sc = @($CYAN, $BLUE, $PURPLE, $AMBER, $GREEN)
$st = @("Detect", "Extract", "Embed", "Cluster", "Export")
$sd = @("I-frame pts`nvia ffprobe", "Mid-scene`nJPEG thumbs", "CLIP ViT-B/32`nvectors", "DBSCAN on`nembeddings", "FFmpeg concat`nstream copy")
for ($i = 0; $i -lt 5; $i++) {
    $x = "$($sx[$i])cm"
    $nx = "$($sx[$i] + 1.85)cm"
    Card 3 "stc$i" $x "3.6cm" "5.4cm" "6cm"
    Shape 3 "stn$i" "ellipse" $sc[$i] "1" "none" $nx "4cm" "1.7cm" "1.7cm"
    Text 3 "stnum$i" "$($i+1)" $nx "4.3cm" "1.7cm" "1.2cm" "22" $WHITE "center" -Bold
    Text 3 "stt$i" $st[$i] $x "6cm" "5.4cm" "0.7cm" "16" $WHITE "center" -Bold
    Text 3 "std$i" $sd[$i] $x "6.8cm" "5.4cm" "2.2cm" "13" $MUTED "center"
}
# arrows between stages (simple chevrons as text)
for ($i = 0; $i -lt 4; $i++) {
    $ax = "$($sx[$i] + 5.15)cm"
    Text 3 "arr$i" ">" $ax "5.8cm" "0.6cm" "0.8cm" "20" $BORDER "center" -Bold
}

Text 3 "mods" "Modules:  video_processor.py  →  ml_engine.py  →  ui_components.py  →  exporter.py" "1.8cm" "10.4cm" "28cm" "0.6cm" "13" $MUTED
Notes 3 "Walk the five-stage pipeline and map each stage to a source module."

# ═══════════════════════════════════════════════════════════
# S4 — Scene Detection
# ═══════════════════════════════════════════════════════════
Write-Host "S4: Detection"
New-Slide 4
AccentBar 4 "bar" "0" "0" "0.15cm" "19.05cm" $CYAN
Text 4 "sec" "03  SCENE DETECTION" "1.8cm" "0.9cm" "14cm" "0.5cm" "12" $CYAN "left" -Bold
Text 4 "title" "I-frame based cut points" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

Card 4 "left" "1.8cm" "2.8cm" "15cm" "7.8cm"
Text 4 "lt" "How it works" "2.3cm" "3.2cm" "14cm" "0.6cm" "16" $WHITE "left" -Bold
Text 4 "lb1" "1.  Run ffprobe on video stream packets" "2.3cm" "4.1cm" "14cm" "0.55cm" "14" $MUTED
Text 4 "lb2" "2.  Select packets with keyframe flag (K)" "2.3cm" "4.75cm" "14cm" "0.55cm" "14" $MUTED
Text 4 "lb3" "3.  Collect pts_time for each I-frame" "2.3cm" "5.4cm" "14cm" "0.55cm" "14" $MUTED
Text 4 "lb4" "4.  Force 0.0 start + duration end bounds" "2.3cm" "6.05cm" "14cm" "0.55cm" "14" $MUTED
Text 4 "lb5" "5.  Adjacent keyframes define scene [t_i, t_i+1)" "2.3cm" "6.7cm" "14cm" "0.55cm" "14" $MUTED
Text 4 "lb6" "6.  Drop micro-scenes with duration < 0.1s" "2.3cm" "7.35cm" "14cm" "0.55cm" "14" $MUTED
Text 4 "why" "Why I-frames? Encoders place them at natural cut boundaries. Reading packet flags avoids full decode — orders of magnitude faster than frame-diff CV." "2.3cm" "8.3cm" "14cm" "1.8cm" "13" $MUTED

Card 4 "right" "17.4cm" "2.8cm" "13.2cm" "7.8cm"
Text 4 "rt" "Tooling" "17.9cm" "3.2cm" "12cm" "0.6cm" "16" $WHITE "left" -Bold
Card 4 "r1" "17.9cm" "4.1cm" "12.2cm" "1.5cm" $SOFT $CYAN
Text 4 "r1t" "ffprobe  ·  packet=pts_time,flags" "18.2cm" "4.25cm" "11.6cm" "0.5cm" "13" $CYAN "left" -Bold
Text 4 "r1d" "CSV parse of keyframe timestamps" "18.2cm" "4.85cm" "11.6cm" "0.5cm" "12" $MUTED
Card 4 "r2" "17.9cm" "5.9cm" "12.2cm" "1.5cm" $SOFT $BLUE
Text 4 "r2t" "ffprobe  ·  format=duration" "18.2cm" "6.05cm" "11.6cm" "0.5cm" "13" $BLUE "left" -Bold
Text 4 "r2d" "Total length for end-of-file bound" "18.2cm" "6.65cm" "11.6cm" "0.5cm" "12" $MUTED
Card 4 "r3" "17.9cm" "7.7cm" "12.2cm" "1.5cm" $SOFT $GREEN
Text 4 "r3t" "video_processor.py" "18.2cm" "7.85cm" "11.6cm" "0.5cm" "13" $GREEN "left" -Bold
Text 4 "r3d" "detect_scenes_and_extract_frames()" "18.2cm" "8.45cm" "11.6cm" "0.5cm" "12" $MUTED
Notes 4 "Explain I-frame scene detection and why it is faster than full decode."

# ═══════════════════════════════════════════════════════════
# S5 — Frame Extraction
# ═══════════════════════════════════════════════════════════
Write-Host "S5: Extract"
New-Slide 5
AccentBar 5 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 5 "sec" "04  FRAME EXTRACTION" "1.8cm" "0.9cm" "14cm" "0.5cm" "12" $BLUE "left" -Bold
Text 5 "title" "Representative thumbnails at scale" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

Card 5 "m1" "1.8cm" "2.9cm" "9.5cm" "7.6cm"
AccentBar 5 "m1a" "1.8cm" "2.9cm" "9.5cm" "0.1cm" $BLUE
Text 5 "m1t" "Sampling strategy" "2.3cm" "3.3cm" "8.6cm" "0.6cm" "16" $WHITE "left" -Bold
Text 5 "m1b" "For each scene [start, end]:`n`nmiddle = start + duration / 2`n`nExtract a single JPEG at middle time with ffmpeg -ss -vframes 1 -q:v 2.`n`nOne frame per scene is enough for semantic clustering and UI preview." "2.3cm" "4.2cm" "8.6cm" "5.8cm" "14" $MUTED

Card 5 "m2" "11.8cm" "2.9cm" "9.5cm" "7.6cm"
AccentBar 5 "m2a" "11.8cm" "2.9cm" "9.5cm" "0.1cm" $PURPLE
Text 5 "m2t" "Parallelism" "12.3cm" "3.3cm" "8.6cm" "0.6cm" "16" $WHITE "left" -Bold
Text 5 "m2b" "ThreadPoolExecutor(max_workers=8)`n`nSemaphore(4) caps concurrent ffmpeg processes to avoid disk/CPU thrash.`n`nProgress callback maps completion to 10–50% of overall analysis bar." "12.3cm" "4.2cm" "8.6cm" "5.8cm" "14" $MUTED

Card 5 "m3" "21.8cm" "2.9cm" "9.5cm" "7.6cm"
AccentBar 5 "m3a" "21.8cm" "2.9cm" "9.5cm" "0.1cm" $AMBER
Text 5 "m3t" "Artifacts" "22.3cm" "3.3cm" "8.6cm" "0.6cm" "16" $WHITE "left" -Bold
Text 5 "m3b" "Temp dir:`n%TEMP%/video_classifier_frames`n`nFiles: scene_XXXX.jpg`n`nScene dict fields:`nid, start_time, end_time,`nduration, frame_path`n`nWindows: STARTF_USESHOWWINDOW hides console flashes." "22.3cm" "4.2cm" "8.6cm" "5.8cm" "14" $MUTED
Notes 5 "Detail parallel mid-scene thumbnail extraction and concurrency limits."

# ═══════════════════════════════════════════════════════════
# S6 — CLIP Embeddings
# ═══════════════════════════════════════════════════════════
Write-Host "S6: Embed"
New-Slide 6
AccentBar 6 "bar" "0" "0" "0.15cm" "19.05cm" $PURPLE
Text 6 "sec" "05  VISUAL EMBEDDINGS" "1.8cm" "0.9cm" "16cm" "0.5cm" "12" $PURPLE "left" -Bold
Text 6 "title" "CLIP turns frames into vectors" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

Card 6 "main" "1.8cm" "2.8cm" "18.5cm" "7.8cm"
Text 6 "mt" "Model: sentence-transformers / clip-ViT-B-32" "2.3cm" "3.2cm" "17.5cm" "0.6cm" "16" $WHITE "left" -Bold
Text 6 "mb" "OpenAI CLIP Vision Transformer encodes each scene JPEG into a dense embedding that captures semantic content — not just color histograms.`n`n• Images loaded via PIL, encoded in chunks of 32`n• encode() batch_size = 8 for GPU/CPU balance`n• Embeddings stacked with numpy.vstack`n• Global singleton cache: model loads once, reused across imports`n• Progress window: ~50% load, ~70% encode" "2.3cm" "4.1cm" "17.5cm" "6cm" "14" $MUTED

Card 6 "side" "20.8cm" "2.8cm" "10.5cm" "7.8cm"
Text 6 "st" "Why CLIP?" "21.3cm" "3.2cm" "9.6cm" "0.6cm" "16" $WHITE "left" -Bold
Card 6 "s1" "21.3cm" "4.1cm" "9.6cm" "1.7cm" $SOFT $PURPLE
Text 6 "s1t" "Semantic similarity" "21.6cm" "4.25cm" "9cm" "0.5cm" "13" $PURPLE "left" -Bold
Text 6 "s1d" "Same subject, different lighting still clusters" "21.6cm" "4.9cm" "9cm" "0.7cm" "12" $MUTED
Card 6 "s2" "21.3cm" "6.1cm" "9.6cm" "1.7cm" $SOFT $BLUE
Text 6 "s2t" "Zero-shot vision" "21.6cm" "6.25cm" "9cm" "0.5cm" "13" $BLUE "left" -Bold
Text 6 "s2d" "No custom labeled scene dataset needed" "21.6cm" "6.9cm" "9cm" "0.7cm" "12" $MUTED
Card 6 "s3" "21.3cm" "8.1cm" "9.6cm" "1.7cm" $SOFT $GREEN
Text 6 "s3t" "Local inference" "21.6cm" "8.25cm" "9cm" "0.5cm" "13" $GREEN "left" -Bold
Text 6 "s3d" "Runs fully offline after first download" "21.6cm" "8.9cm" "9cm" "0.7cm" "12" $MUTED
Notes 6 "Explain CLIP embedding strategy and model caching."

# ═══════════════════════════════════════════════════════════
# S7 — DBSCAN Clustering
# ═══════════════════════════════════════════════════════════
Write-Host "S7: Cluster"
New-Slide 7
AccentBar 7 "bar" "0" "0" "0.15cm" "19.05cm" $AMBER
Text 7 "sec" "06  CLUSTERING" "1.8cm" "0.9cm" "12cm" "0.5cm" "12" $AMBER "left" -Bold
Text 7 "title" "DBSCAN groups similar scenes" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

Card 7 "a" "1.8cm" "2.8cm" "14.5cm" "7.8cm"
Text 7 "at" "Algorithm pipeline" "2.3cm" "3.2cm" "13.5cm" "0.6cm" "16" $WHITE "left" -Bold
Text 7 "ab" "1. StandardScaler on embedding matrix`n   — equalizes feature variance before density search`n`n2. DBSCAN(metric='euclidean')`n   — density-based: no pre-set K clusters`n`n3. Defaults (Settings-tunable):`n   · eps = 0.5   (neighborhood radius)`n   · min_samples = 2`n`n4. Label written to scene['cluster']`n   — noise points get -1`n`n5. UI color-codes clusters in Media Pool" "2.3cm" "4cm" "13.5cm" "6.2cm" "13" $MUTED

Card 7 "b" "16.8cm" "2.8cm" "14.5cm" "3.6cm"
Text 7 "bt" "Why DBSCAN over K-Means?" "17.3cm" "3.2cm" "13.5cm" "0.55cm" "15" $WHITE "left" -Bold
Text 7 "bb" "Video scene counts are unknown a priori. DBSCAN discovers natural density groups and isolates outliers instead of forcing every frame into a fixed number of centroids." "17.3cm" "4cm" "13.5cm" "2cm" "13" $MUTED

Card 7 "c" "16.8cm" "6.8cm" "14.5cm" "3.8cm"
Text 7 "ct" "User controls (Settings panel)" "17.3cm" "7.2cm" "13.5cm" "0.55cm" "15" $WHITE "left" -Bold
Text 7 "cb" "↑ eps  → fewer, broader clusters`n↓ eps  → more, tighter clusters`n↑ min_samples → stricter core points`nRe-run analysis after retuning" "17.3cm" "7.95cm" "13.5cm" "2.2cm" "13" $MUTED
Notes 7 "Cover StandardScaler + DBSCAN and tunable parameters."

# ═══════════════════════════════════════════════════════════
# S8 — Interaction & Export
# ═══════════════════════════════════════════════════════════
Write-Host "S8: Export"
New-Slide 8
AccentBar 8 "bar" "0" "0" "0.15cm" "19.05cm" $GREEN
Text 8 "sec" "07  CURATION & EXPORT" "1.8cm" "0.9cm" "16cm" "0.5cm" "12" $GREEN "left" -Bold
Text 8 "title" "Human-in-the-loop, lossless out" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

Card 8 "u1" "1.8cm" "2.8cm" "9.5cm" "7.8cm"
AccentBar 8 "u1a" "1.8cm" "2.8cm" "9.5cm" "0.1cm" $BLUE
Text 8 "u1t" "Media Pool" "2.3cm" "3.3cm" "8.6cm" "0.55cm" "16" $WHITE "left" -Bold
Text 8 "u1b" "Clustered scene thumbnails`n`nHover → live preview worker (OpenCV decode of clip range)`n`nDrag selected clusters into Timeline Queue`n`nDark/light theme via stylesheet" "2.3cm" "4.1cm" "8.6cm" "5.8cm" "13" $MUTED

Card 8 "u2" "11.8cm" "2.8cm" "9.5cm" "7.8cm"
AccentBar 8 "u2a" "11.8cm" "2.8cm" "9.5cm" "0.1cm" $PURPLE
Text 8 "u2t" "Timeline Queue" "12.3cm" "3.3cm" "8.6cm" "0.55cm" "16" $WHITE "left" -Bold
Text 8 "u2b" "Reorder by drag-and-drop`n`nInline remove / keyboard shortcuts`n`nPreserves scene start/end times for export`n`nCustom TimelineDelegate for polish" "12.3cm" "4.1cm" "8.6cm" "5.8cm" "13" $MUTED

Card 8 "u3" "21.8cm" "2.8cm" "9.5cm" "7.8cm"
AccentBar 8 "u3a" "21.8cm" "2.8cm" "9.5cm" "0.1cm" $GREEN
Text 8 "u3t" "Lossless Export" "22.3cm" "3.3cm" "8.6cm" "0.55cm" "16" $WHITE "left" -Bold
Text 8 "u3b" "Build concat_list.txt:`n  file + inpoint + outpoint`n`nffmpeg -f concat -c copy`n`nNo re-encode → no quality loss`n`nExportWorker QThread keeps UI free" "22.3cm" "4.1cm" "8.6cm" "5.8cm" "13" $MUTED
Notes 8 "Describe curation UX and FFmpeg concat demuxer stream-copy export."

# ═══════════════════════════════════════════════════════════
# S9 — Architecture
# ═══════════════════════════════════════════════════════════
Write-Host "S9: Architecture"
New-Slide 9
AccentBar 9 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 9 "sec" "08  ARCHITECTURE" "1.8cm" "0.9cm" "14cm" "0.5cm" "12" $BLUE "left" -Bold
Text 9 "title" "Layered desktop system" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

# Horizontal layers
Card 9 "L1" "1.8cm" "2.9cm" "29.5cm" "1.7cm" $SOFT $BLUE
Text 9 "L1t" "UI Layer" "2.2cm" "3.05cm" "6cm" "0.5cm" "14" $BLUE "left" -Bold
Text 9 "L1d" "main.py · ui_components.py  —  MainWindow, SettingsDialog, SceneThumbnail, Timeline, Workers (QThread)" "8.5cm" "3.2cm" "22cm" "1.1cm" "13" $MUTED

Card 9 "L2" "1.8cm" "4.9cm" "29.5cm" "1.7cm" $SOFT $PURPLE
Text 9 "L2t" "Logic Layer" "2.2cm" "5.05cm" "6cm" "0.5cm" "14" $PURPLE "left" -Bold
Text 9 "L2d" "ml_engine.py · video_processor.py  —  CLIP encode, DBSCAN, ffprobe parse, parallel extract" "8.5cm" "5.2cm" "22cm" "1.1cm" "13" $MUTED

Card 9 "L3" "1.8cm" "6.9cm" "29.5cm" "1.7cm" $SOFT $GREEN
Text 9 "L3t" "Media Layer" "2.2cm" "7.05cm" "6cm" "0.5cm" "14" $GREEN "left" -Bold
Text 9 "L3d" "exporter.py · FFmpeg / ffprobe / OpenCV  —  concat demuxer, preview decode, PATH dependency checks" "8.5cm" "7.2cm" "22cm" "1.1cm" "13" $MUTED

Card 9 "L4" "1.8cm" "8.9cm" "29.5cm" "1.7cm" $SOFT $AMBER
Text 9 "L4t" "Runtime" "2.2cm" "9.05cm" "6cm" "0.5cm" "14" $AMBER "left" -Bold
Text 9 "L4d" "PyQt6 Fusion · Windows VBS launcher · PyInstaller Fracture.exe · local model cache" "8.5cm" "9.2cm" "22cm" "1.1cm" "13" $MUTED
Notes 9 "Show four-layer architecture from UI to runtime packaging."

# ═══════════════════════════════════════════════════════════
# S10 — Design Decisions
# ═══════════════════════════════════════════════════════════
Write-Host "S10: Decisions"
New-Slide 10
AccentBar 10 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 10 "sec" "09  DESIGN DECISIONS" "1.8cm" "0.9cm" "16cm" "0.5cm" "12" $BLUE "left" -Bold
Text 10 "title" "Trade-offs that shape Fracture" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

$decisions = @(
    @{ t="I-frames over full decode"; d="Speed first. Misses soft dissolves that lack new keyframes — acceptable for most encoded cuts."; c=$CYAN },
    @{ t="CLIP over handcrafted features"; d="Semantic robustness without labeled data; model download + RAM cost on first run."; c=$PURPLE },
    @{ t="DBSCAN over fixed-K"; d="Unknown cluster count; eps tuning required for best results."; c=$AMBER },
    @{ t="Stream-copy export"; d="Zero quality loss, but cut points must land on keyframes for clean seeks."; c=$GREEN },
    @{ t="Background QThreads"; d="UI stays responsive; cancel flags for analysis/export workers."; c=$BLUE },
    @{ t="Fully local stack"; d="Privacy + offline use; no server cost, user must install FFmpeg."; c=$RED }
)
$dx = @(1.8, 12.3, 22.8, 1.8, 12.3, 22.8)
$dy = @(2.8, 2.8, 2.8, 7.0, 7.0, 7.0)
for ($i = 0; $i -lt 6; $i++) {
    $d = $decisions[$i]
    Card 10 "d$i" "$($dx[$i])cm" "$($dy[$i])cm" "9.8cm" "3.8cm"
    AccentBar 10 "da$i" "$($dx[$i])cm" "$($dy[$i])cm" "9.8cm" "0.08cm" $d.c
    Text 10 "dt$i" $d.t "$($dx[$i]+0.4)cm" "$($dy[$i]+0.4)cm" "9cm" "0.7cm" "14" $WHITE "left" -Bold
    Text 10 "dd$i" $d.d "$($dx[$i]+0.4)cm" "$($dy[$i]+1.3)cm" "9cm" "2.1cm" "12" $MUTED
}
Notes 10 "Discuss methodology trade-offs honestly."

# ═══════════════════════════════════════════════════════════
# S11 — Tech Stack
# ═══════════════════════════════════════════════════════════
Write-Host "S11: Stack"
New-Slide 11
AccentBar 11 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 11 "sec" "10  TECHNOLOGY STACK" "1.8cm" "0.9cm" "16cm" "0.5cm" "12" $BLUE "left" -Bold
Text 11 "title" "Libraries & system tools" "1.8cm" "1.5cm" "28cm" "0.9cm" "28" $WHITE "left" -Bold

$stack = @(
    @{ cat="GUI"; items="PyQt6 · Fusion style · custom QSS"; c=$BLUE },
    @{ cat="Video I/O"; items="FFmpeg · ffprobe · OpenCV (cv2)"; c=$CYAN },
    @{ cat="ML"; items="sentence-transformers · CLIP ViT-B/32"; c=$PURPLE },
    @{ cat="Clustering"; items="scikit-learn DBSCAN · StandardScaler · NumPy"; c=$AMBER },
    @{ cat="Images"; items="Pillow (PIL) for embedding input"; c=$GREEN },
    @{ cat="Packaging"; items="PyInstaller · Fracture.spec · Fracture.vbs"; c=$RED }
)
for ($i = 0; $i -lt 6; $i++) {
    $row = [math]::Floor($i / 3)
    $col = $i % 3
    $x = 1.8 + $col * 10.2
    $y = 2.9 + $row * 3.9
    $s = $stack[$i]
    Card 11 "sk$i" "${x}cm" "${y}cm" "9.7cm" "3.5cm"
    Shape 11 "skd$i" "ellipse" $s.c "1" "none" "$($x+0.45)cm" "$($y+0.55)cm" "0.55cm" "0.55cm"
    Text 11 "skt$i" $s.cat "$($x+1.3)cm" "$($y+0.5)cm" "7.8cm" "0.65cm" "16" $WHITE "left" -Bold
    Text 11 "ski$i" $s.items "$($x+0.45)cm" "$($y+1.5)cm" "8.8cm" "1.5cm" "13" $MUTED
}
Notes 11 "Quick inventory of the technology stack."

# ═══════════════════════════════════════════════════════════
# S12 — Summary
# ═══════════════════════════════════════════════════════════
Write-Host "S12: Summary"
New-Slide 12
Shape 12 "orb" "ellipse" $BLUE "0.15" "none" "24cm" "0cm" "12cm" "12cm"
AccentBar 12 "bar" "0" "0" "0.15cm" "19.05cm" $BLUE
Text 12 "sec" "11  SUMMARY" "1.8cm" "1cm" "12cm" "0.5cm" "12" $BLUE "left" -Bold
Text 12 "title" "Methodology in one line" "1.8cm" "1.7cm" "28cm" "1cm" "30" $WHITE "left" -Bold
Text 12 "line" "Detect cuts from I-frames → embed mid-frames with CLIP → density-cluster with DBSCAN → curate → stream-copy export." "1.8cm" "3cm" "28cm" "1.4cm" "16" $MUTED

Card 12 "k1" "1.8cm" "5cm" "9.5cm" "4.2cm"
Text 12 "k1t" "Fast" "2.3cm" "5.5cm" "8.5cm" "0.6cm" "18" $CYAN "left" -Bold
Text 12 "k1d" "Packet-level scene cuts + parallel thumbnail extraction, not full frame decode." "2.3cm" "6.4cm" "8.5cm" "2.2cm" "14" $MUTED

Card 12 "k2" "12cm" "5cm" "9.5cm" "4.2cm"
Text 12 "k2t" "Semantic" "12.5cm" "5.5cm" "8.5cm" "0.6cm" "18" $PURPLE "left" -Bold
Text 12 "k2d" "CLIP embeddings + DBSCAN group visually related scenes without predefining K." "12.5cm" "6.4cm" "8.5cm" "2.2cm" "14" $MUTED

Card 12 "k3" "22.2cm" "5cm" "9.5cm" "4.2cm"
Text 12 "k3t" "Lossless" "22.7cm" "5.5cm" "8.5cm" "0.6cm" "18" $GREEN "left" -Bold
Text 12 "k3d" "FFmpeg concat demuxer with -c copy preserves original bitstreams." "22.7cm" "6.4cm" "8.5cm" "2.2cm" "14" $MUTED

Text 12 "end" "Fracture  ·  Local AI video scene assistant  ·  methodology deck" "1.8cm" "10cm" "28cm" "0.6cm" "13" $MUTED
Notes 12 "Close with the three pillars: Fast, Semantic, Lossless."

Write-Host "Saving..."
OC @("close", $FILE)
Write-Host "Done: $FILE"
