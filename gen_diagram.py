import json
import os

elements = []
seed = 100

BOX_W = 280
BOX_H = 64
BOX_X = 40
ARROW_X = BOX_X + BOX_W // 2

boxes = [
    ("rect_0", 30,   "Input Video\n(MP4 / MKV / AVI / MOV)",    "#2563EB", "#DBEAFE"),
    ("rect_1", 124,  "ffprobe\nI-frame Detection",              "#059669", "#D1FAE5"),
    ("rect_2", 218,  "ffmpeg\nFrame Extraction",                "#059669", "#D1FAE5"),
    ("rect_3", 332,  "CLIP\nEmbeddings (512-dim)",              "#7C3AED", "#EDE9FE"),
    ("rect_4", 446,  "DBSCAN\nScene Clustering",               "#7C3AED", "#EDE9FE"),
    ("rect_5", 540,  "Media Pool\nScene Grid",                  "#2563EB", "#DBEAFE"),
    ("rect_6", 634,  "Timeline\nAssembly",                      "#2563EB", "#DBEAFE"),
    ("rect_7", 728,  "FFmpeg Concat\nLossless Export",          "#EA580C", "#FED7AA"),
]

annotations = [
    ("ann_0", 370, 38,  "User imports a video file\n.mp4 / .mkv / .avi / .mov"),
    ("ann_1", 370, 132, "ffprobe reads I-frame packet headers\nNo decoding — near-instant"),
    ("ann_2", 370, 226, "8 parallel workers, semaphore(4)\n1 frame at midpoint per scene"),
    ("ann_3", 370, 340, "Vision Transformer (ViT-B-32)\n→ 512-dim semantic embedding"),
    ("ann_4", 370, 454, "StandardScaler + DBSCAN\neps=0.5, min_samples=2"),
    ("ann_5", 370, 548, "Sorted by cluster_id\nHover preview at 15 FPS"),
    ("ann_6", 370, 642, "Drag-to-reorder timeline\nInline delete + keyboard shortcuts"),
    ("ann_7", 370, 736, "FFmpeg concat demuxer\n-c copy (lossless, no re-encode)"),
]

arrows_gap = [30, 30, 50, 50, 30, 30, 30]

for i, (rid, y, text, border, bg) in enumerate(boxes):
    rid_elem = f"rect_{i}"
    tid_elem = f"text_{i}"

    elements.append({
        "id": rid_elem,
        "type": "rectangle",
        "x": BOX_X,
        "y": y,
        "width": BOX_W,
        "height": BOX_H,
        "angle": 0,
        "strokeColor": border,
        "backgroundColor": bg,
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "roundness": {"type": 3},
        "seed": seed + i * 10,
        "version": 1,
        "isDeleted": False,
        "boundElements": [{"type": "text", "id": tid_elem}],
        "updated": 1,
        "link": None,
        "locked": False,
    })

    elements.append({
        "id": tid_elem,
        "type": "text",
        "x": BOX_X + 10,
        "y": y + 8,
        "width": BOX_W - 20,
        "height": 40,
        "angle": 0,
        "strokeColor": border,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 0,
        "opacity": 100,
        "groupIds": [],
        "roundness": None,
        "seed": seed + i * 10 + 1,
        "version": 1,
        "isDeleted": False,
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
        "text": text,
        "fontSize": 15,
        "fontFamily": 1,
        "textAlign": "center",
        "verticalAlign": "middle",
        "containerId": rid_elem,
        "originalText": text,
        "autoResize": True,
        "lineHeight": 1.25,
    })

for i in range(7):
    src_y = boxes[i][1] + BOX_H
    gap = arrows_gap[i]
    arrow_y = src_y
    arr_id = f"arrow_{i}"

    elements.append({
        "id": arr_id,
        "type": "arrow",
        "x": ARROW_X,
        "y": arrow_y,
        "width": 0,
        "height": gap,
        "angle": 0,
        "strokeColor": "#888888",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 80,
        "groupIds": [],
        "roundness": {"type": 2},
        "seed": seed + 100 + i * 10,
        "version": 1,
        "isDeleted": False,
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
        "points": [[0, 0], [0, gap]],
        "lastCommittedPoint": None,
        "startBinding": {
            "elementId": f"rect_{i}",
            "focus": 0,
            "gap": 1,
        },
        "endBinding": {
            "elementId": f"rect_{i+1}",
            "focus": 0,
            "gap": 1,
        },
        "startArrowhead": None,
        "endArrowhead": "arrow",
    })

for ann_id, x, y, text in annotations:
    idx = ann_id.split("_")[1]
    elements.append({
        "id": ann_id,
        "type": "text",
        "x": x,
        "y": y,
        "width": 280,
        "height": 32,
        "angle": 0,
        "strokeColor": "#555555",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 0,
        "opacity": 100,
        "groupIds": [],
        "roundness": None,
        "seed": seed + 200 + int(idx) * 10,
        "version": 1,
        "isDeleted": False,
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
        "text": text,
        "fontSize": 12,
        "fontFamily": 1,
        "textAlign": "left",
        "verticalAlign": "top",
        "containerId": None,
        "originalText": text,
        "autoResize": True,
        "lineHeight": 1.25,
    })

# Title
elements.insert(0, {
    "id": "title_text",
    "type": "text",
    "x": 40,
    "y": 0,
    "width": 400,
    "height": 25,
    "angle": 0,
    "strokeColor": "#111111",
    "backgroundColor": "transparent",
    "fillStyle": "solid",
    "strokeWidth": 1,
    "strokeStyle": "solid",
    "roughness": 0,
    "opacity": 100,
    "groupIds": [],
    "roundness": None,
    "seed": 999,
    "version": 1,
    "isDeleted": False,
    "boundElements": None,
    "updated": 1,
    "link": None,
    "locked": False,
    "text": "Fracture — AI Video Processing Pipeline",
    "fontSize": 20,
    "fontFamily": 1,
    "textAlign": "left",
    "verticalAlign": "top",
    "containerId": None,
    "originalText": "Fracture — AI Video Processing Pipeline",
    "autoResize": True,
    "lineHeight": 1.25,
})

doc = {
    "type": "excalidraw",
    "version": 2,
    "source": "https://excalidraw.com",
    "elements": elements,
    "appState": {
        "viewBackgroundColor": "#ffffff",
        "gridSize": None,
    },
}

os.makedirs("output", exist_ok=True)

with open("output/fracture_pipeline.excalidraw", "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)

print("Generated output/fracture_pipeline.excalidraw")
