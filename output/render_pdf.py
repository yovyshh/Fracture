import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

fig, ax = plt.subplots(1, 1, figsize=(10, 11))
ax.set_xlim(0, 10)
ax.set_ylim(0, 11.5)
ax.axis("off")
ax.set_facecolor("white")

COLORS = {
    "blue":   {"fill": "#DBEAFE", "edge": "#2563EB"},
    "green":  {"fill": "#D1FAE5", "edge": "#059669"},
    "purple": {"fill": "#EDE9FE", "edge": "#7C3AED"},
    "orange": {"fill": "#FED7AA", "edge": "#EA580C"},
}

BW = 1.8
BH = 0.55
CX = 0.8

# (x, y_bottom, text, color)
boxes = [
    (CX, 10.0, "Input Video\n(MP4 / MKV / AVI / MOV)",     "blue"),
    (CX, 9.0,  "ffprobe\nI-frame Detection",               "green"),
    (CX, 8.0,  "ffmpeg\nFrame Extraction",                 "green"),
    (CX, 6.8,  "CLIP\nEmbeddings (512-dim)",               "purple"),
    (CX, 5.6,  "DBSCAN\nScene Clustering",                "purple"),
    (CX, 4.6,  "Media Pool\nScene Grid",                   "blue"),
    (CX, 3.6,  "Timeline\nAssembly",                       "blue"),
    (CX, 2.6,  "FFmpeg Concat\nLossless Export",           "orange"),
]

annotations = [
    "User imports a video file",
    "Reads I-frame packet headers \u2014 no decoding",
    "8 parallel workers, semaphore(4)",
    "Vision Transformer \u2192 512-dim embedding",
    "StandardScaler + eps=0.5, min_samples=2",
    "Sorted by cluster_id, hover preview 15 FPS",
    "Drag-to-reorder, inline delete",
    "FFmpeg concat demuxer, -c copy (lossless)",
]

for i, (x, y, text, color) in enumerate(boxes):
    c = COLORS[color]
    bbox = FancyBboxPatch(
        (x, y), BW, BH,
        boxstyle="round,pad=0.08",
        facecolor=c["fill"],
        edgecolor=c["edge"],
        linewidth=2,
    )
    ax.add_patch(bbox)

    lines = text.split("\n")
    for j, line in enumerate(lines):
        ax.text(
            x + BW / 2, y + BH - 0.08 - (j + 0.5) * (BH / len(lines)),
            line, ha="center", va="center",
            fontsize=10, fontweight="bold", color=c["edge"],
        )

    # annotation to the right
    ax.text(
        x + BW + 0.3, y + BH / 2, annotations[i],
        ha="left", va="center", fontsize=9, color="#555555", fontfamily="monospace",
    )

# Arrows between consecutive boxes
for src in range(len(boxes) - 1):
    dst = src + 1
    xc = boxes[src][0] + BW / 2
    y_start = boxes[src][1]       # bottom of source
    y_end = boxes[dst][1] + BH    # top of destination
    arrow = FancyArrowPatch(
        (xc, y_start), (xc, y_end),
        arrowstyle="-|>", color="#888888",
        linewidth=2, mutation_scale=20,
    )
    ax.add_patch(arrow)

# Title
ax.text(
    CX, 11.1,
    "Fracture \u2014 AI Video Processing Pipeline",
    fontsize=16, fontweight="bold", ha="left", va="center", color="#111111",
)

# Legend
legend_elements = [
    mpatches.Patch(facecolor="#DBEAFE", edgecolor="#2563EB", label="User Input / UI"),
    mpatches.Patch(facecolor="#D1FAE5", edgecolor="#059669", label="Video Processing"),
    mpatches.Patch(facecolor="#EDE9FE", edgecolor="#7C3AED", label="Machine Learning"),
    mpatches.Patch(facecolor="#FED7AA", edgecolor="#EA580C", label="Output / Export"),
]
ax.legend(
    handles=legend_elements, loc="lower center", ncol=4,
    framealpha=0.9, edgecolor="#D1D5DB", fontsize=9,
    bbox_to_anchor=(0.5, 0.02),
)

plt.tight_layout()
plt.savefig("fracture_pipeline.pdf", dpi=200, bbox_inches="tight", facecolor="white")
plt.savefig("fracture_pipeline.png", dpi=200, bbox_inches="tight", facecolor="white")
print("Generated fracture_pipeline.pdf and fracture_pipeline.png")
