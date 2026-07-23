"""Build LLM Architecture Presentation with Morph transitions."""
import subprocess, sys, os, json

FILE = os.path.abspath("LLM-Architecture-Deck.pptx")

def oc(*args):
    ps_args = " ".join(str(a) for a in args)
    cmd = ["powershell", "-NoProfile", "-Command", f"officecli {ps_args}"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        err = (r.stderr or r.stdout)[:400]
        print(f"  exit={r.returncode} for {ps_args[-60:]}\n  {err}")
    return r.stdout

def props(**kw):
    """Convert keyword args to a flat list of --prop key=val pairs."""
    out = []
    for k, v in kw.items():
        sv = str(v)
        if " " in sv or "!" in sv or "#" in sv:
            sv = f'"{sv}"'
        out.extend(["--prop", f"{k}={sv}"])
    return out

NAVY = "0C1B33"; GOLD = "C9A84C"; WHITE = "FFFFFF"
MID_NAVY = "1E3A5F"; STEEL = "8EACC1"; CARD = "2C4F7C"

# ============================================================
print("Creating deck...")
oc("create", FILE)
oc("open", FILE)

# ============================================================
# Helper: add a slide with background
# ============================================================
def add_slide(num, bg=NAVY, morph=False):
    args = ["add", FILE, "/", "--type", "slide", "--prop", f"layout=blank", "--prop", f"background={bg}"]
    if morph:
        args.extend(["--prop", "transition=morph"])
    oc(*args)

# ============================================================
# Helper: add a shape
# ============================================================
def add_shape(slide_num, **kw):
    args = ["add", FILE, f"/slide[{slide_num}]", "--type", "shape"]
    for k, v in kw.items():
        args.extend(["--prop", f"{k}={v}"])
    oc(*args)

# ============================================================
# Helper: ghost a shape (move off-canvas)
# ============================================================
def ghost(slide_num, name):
    oc("set", FILE, f'/slide[{slide_num}]/shape[@name={name}]', "--prop", "x=36cm")

# ============================================================
# Helper: add speaker notes
# ============================================================
def notes(slide_num, text):
    oc("add", FILE, f"/slide[{slide_num}]", "--type", "notes", "--prop", f"text={text}")

# ============================================================
# Helper: add a chart
# ============================================================
def add_chart(slide_num, **kw):
    args = ["add", FILE, f"/slide[{slide_num}]", "--type", "chart"]
    for k, v in kw.items():
        if isinstance(v, list):
            v = ",".join(str(x) for x in v)
        args.extend(["--prop", f"{k}={v}"])
    oc(*args)

# ============================================================
# SLIDE 1 — HERO
# ============================================================
print("S1: Hero")
add_slide(1)

# Scene actors
for a in [
    ("!!scene-bar-gold", "rect", "x=4cm,y=9.5cm,width=18cm,height=0.06cm", GOLD, "1", "none"),
    ("!!scene-bar-navy", "rect", "x=2cm,y=3cm,width=0.06cm,height=14cm", MID_NAVY, "1", "none"),
    ("!!scene-frame-gold", "roundRect", "x=7cm,y=3cm,width=8cm,height=6cm", GOLD, "0.12", "none"),
    ("!!scene-frame-navy", "roundRect", "x=20cm,y=10cm,width=10cm,height=6cm", MID_NAVY, "0.25", "none"),
    ("!!scene-accent-gold", "ellipse", "x=28cm,y=2cm,width=3cm,height=3cm", GOLD, "0.15", "none"),
    ("!!scene-accent-steel", "ellipse", "x=2cm,y=14cm,width=4cm,height=4cm", STEEL, "0.12", "none"),
    ("!!scene-dot-gold", "ellipse", "x=18cm,y=16cm,width=1.2cm,height=1.2cm", GOLD, "0.5", "none"),
    ("!!scene-dot-white", "ellipse", "x=25cm,y=3cm,width=0.8cm,height=0.8cm", WHITE, "0.25", "none"),
]:
    oc("add", FILE, "/slide[1]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}", "--prop", f"line={a[5]}",
       "--prop", a[2])

oc("add", FILE, "/slide[1]", "--type", "shape",
   "--prop", f'name=#s1-title', "--prop", "text=Large Language Models",
   "--prop", "font=Segoe UI", "--prop", "size=60", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=5cm", "--prop", "width=28cm", "--prop", "height=4cm",
   "--prop", "align=center")
oc("add", FILE, "/slide[1]", "--type", "shape",
   "--prop", f'name=#s1-subtitle', "--prop", "text=Architecture, Capabilities, and Future Directions",
   "--prop", "font=Segoe UI", "--prop", "size=24", "--prop", f"color={GOLD}",
   "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=11cm", "--prop", "width=28cm", "--prop", "height=2.5cm",
   "--prop", "align=center")

notes(1, "OPENING: Welcome everyone. Today we explore Large Language Models — the technology behind GPT-4, Claude, Gemini, and LLaMA. We will cover what makes them work, what they can do, and where the field is heading.")

# ============================================================
# SLIDE 2 — STATEMENT (morph from S1)
# ============================================================
print("S2: Statement (morph)")
add_slide(2, morph=True)

for a in [
    ("!!scene-bar-gold", "rect", "x=22cm,y=0.5cm,width=8cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=25cm,y=3cm,width=0.06cm,height=14cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=16cm,y=8cm,width=6cm,height=4cm", GOLD, "0.12"),
    ("!!scene-frame-navy", "roundRect", "x=4cm,y=12cm,width=10cm,height=4cm", MID_NAVY, "0.25"),
    ("!!scene-accent-gold", "ellipse", "x=30cm,y=16cm,width=2.5cm,height=2.5cm", GOLD, "0.25"),
    ("!!scene-accent-steel", "ellipse", "x=2cm,y=2cm,width=3cm,height=3cm", STEEL, "0.15"),
    ("!!scene-dot-gold", "ellipse", "x=10cm,y=2cm,width=1cm,height=1cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=14cm,y=16cm,width=0.8cm,height=0.8cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[2]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[2]", "--type", "shape",
   "--prop", f'name=#s2-title', "--prop", "text=The Age of Foundation Models",
   "--prop", "font=Segoe UI", "--prop", "size=44", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=4cm", "--prop", "width=24cm", "--prop", "height=3cm", "--prop", "align=left")
oc("add", FILE, "/slide[2]", "--type", "shape",
   "--prop", f'name=#s2-body',
   "--prop", "text=Large Language Models represent a paradigm shift in artificial intelligence. Built on the Transformer architecture, these models learn from vast text corpora and exhibit emergent abilities that were unthinkable just five years ago.",
   "--prop", "font=Segoe UI", "--prop", "size=20", "--prop", f"color={STEEL}",
   "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=8cm", "--prop", "width=22cm", "--prop", "height=5cm", "--prop", "align=left")

ghost(2, "#s1-title")
ghost(2, "#s1-subtitle")

notes(2, "KEY STATEMENT: GPT-3's 2020 release showed that scaling up Transformers produced abilities no one explicitly programmed. These 'foundation models' now underpin everything from chatbots to scientific discovery.")

# ============================================================
# SLIDE 3 — PILLARS (fade, morph target for S4)
# ============================================================
print("S3: Three Pillars")
add_slide(3)

for a in [
    ("!!scene-bar-gold", "rect", "x=1.5cm,y=3.5cm,width=12cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=24cm,y=2cm,width=0.06cm,height=14cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=10cm,y=5cm,width=12cm,height=10cm", GOLD, "0.10"),
    ("!!scene-frame-navy", "roundRect", "x=1.5cm,y=5cm,width=30cm,height=0.8cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=29cm,y=14cm,width=3cm,height=3cm", GOLD, "0.20"),
    ("!!scene-accent-steel", "ellipse", "x=3cm,y=14cm,width=3.5cm,height=3.5cm", STEEL, "0.12"),
    ("!!scene-dot-gold", "ellipse", "x=20cm,y=15cm,width=1cm,height=1cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=28cm,y=3cm,width=0.6cm,height=0.6cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[3]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

col_w = 8.5; gap = 0.76; total = 3 * col_w + 2 * gap
start_x = (33.87 - total) / 2

oc("add", FILE, "/slide[3]", "--type", "shape",
   "--prop", f'name=#s3-heading', "--prop", "text=Three Pillars of LLM Success",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=1.5cm", "--prop", "width=30cm", "--prop", "height=3cm", "--prop", "align=left")

pillars = [
    ("01", "Scale", "Models with billions of parameters learn rich, hierarchical representations. GPT-3's 175B parameters demonstrated that scale unlocks emergent capabilities."),
    ("02", "Data", "Training on trillions of tokens from diverse sources gives LLMs broad knowledge. Data quality and curation are as critical as quantity."),
    ("03", "Architecture", "The Transformer's self-attention enables parallel processing of long-range dependencies. Innovations like RoPE, GQA, and MoE continue to advance the design."),
]

for i, (num, title, desc) in enumerate(pillars):
    cx = start_x + i * (col_w + gap)
    oc("add", FILE, "/slide[3]", "--type", "shape",
       "--prop", f"name=#s3-card-{i+1}", "--prop", "preset=roundRect",
       "--prop", f"fill={CARD}", "--prop", "opacity=0.35", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", f"y=5.5cm", "--prop", f"width={col_w}cm", "--prop", "height=10cm")
    oc("add", FILE, "/slide[3]", "--type", "shape",
       "--prop", f"name=#s3-num-{i+1}", "--prop", f"text={num}",
       "--prop", "font=Segoe UI", "--prop", "size=48", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", "y=6cm", "--prop", f"width={col_w}cm", "--prop", "height=2.5cm", "--prop", "align=center")
    oc("add", FILE, "/slide[3]", "--type", "shape",
       "--prop", f"name=#s3-card-title-{i+1}", "--prop", f"text={title}",
       "--prop", "font=Segoe UI", "--prop", "size=22", "--prop", "bold=true",
       "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+0.5}cm", "--prop", f"y=8.5cm", "--prop", f"width={col_w-1}cm", "--prop", "height=1.5cm", "--prop", "align=center")
    oc("add", FILE, "/slide[3]", "--type", "shape",
       "--prop", f"name=#s3-card-desc-{i+1}", "--prop", f"text={desc}",
       "--prop", "font=Segoe UI", "--prop", "size=14", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+0.5}cm", "--prop", f"y=10cm", "--prop", f"width={col_w-1}cm", "--prop", "height=5cm", "--prop", "align=center")

ghost(3, "#s2-title"); ghost(3, "#s2-body")

notes(3, "PILLARS: Three factors drive LLM success. SCALE — from 117M parameters in GPT-1 to estimated 1.8T in GPT-4. DATA — training data grew from 1B tokens to 13T+. ARCHITECTURE — the Transformer remains the foundation.")

# ============================================================
# SLIDE 4 — EVIDENCE (morph from S3)
# ============================================================
print("S4: Evidence (morph)")
add_slide(4, morph=True)

for a in [
    ("!!scene-bar-gold", "rect", "x=1.5cm,y=2cm,width=30cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=20cm,y=4cm,width=0.06cm,height=12cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=1.5cm,y=4cm,width=16cm,height=11cm", GOLD, "0.08"),
    ("!!scene-frame-navy", "roundRect", "x=20cm,y=4cm,width=12cm,height=11cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=29cm,y=16cm,width=3cm,height=3cm", GOLD, "0.35"),
    ("!!scene-accent-steel", "ellipse", "x=2cm,y=2cm,width=2.5cm,height=2.5cm", STEEL, "0.15"),
    ("!!scene-dot-gold", "ellipse", "x=12cm,y=2.5cm,width=0.8cm,height=0.8cm", GOLD, "0.55"),
    ("!!scene-dot-white", "ellipse", "x=8cm,y=16cm,width=0.6cm,height=0.6cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[4]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[4]", "--type", "shape",
   "--prop", f'name=#s4-title', "--prop", "text=Scaling Laws",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=0.5cm", "--prop", "width=20cm", "--prop", "height=2.5cm", "--prop", "align=left")

add_chart(4, chartType="column", name="!!scene-chart",
    x="2.5cm", y="4.5cm", width="14cm", height="9cm",
    colors="C9A84C,1E3A5F,8EACC1",
    categories="GPT1,GPT2,GPT3,GPT4,LLaMA,DeepSeek",
    data="Parameters:0.117,1.5,175,1800,65,671",
    chartFill="none", plotFill="none", gridlines=False,
    legend="none", dataLabels="value",
    labelfont="10:C9A84C:Segoe UI",
    axisline="none", axisfont="9:8EACC1:Segoe UI",
    autotitledeleted=True)

kpi_data = [
    ("Training Compute", "10^25 FLOPs", 5.0),
    ("Training Data", "13T+ tokens", 8.5),
    ("Model Size", "1.8T params", 12.0),
]
for label, value, vy in kpi_data:
    oc("add", FILE, "/slide[4]", "--type", "shape",
       "--prop", f"name=#s4-kpi-label-{label.split()[0].lower()}", "--prop", f"text={label}",
       "--prop", "font=Segoe UI", "--prop", "size=14", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", "x=21.5cm", "--prop", f"y={vy}cm", "--prop", "width=9cm", "--prop", "height=1.2cm", "--prop", "align=left")
    oc("add", FILE, "/slide[4]", "--type", "shape",
       "--prop", f"name=#s4-kpi-value-{label.split()[0].lower()}", "--prop", f"text={value}",
       "--prop", "font=Segoe UI", "--prop", "size=32", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", "x=21.5cm", "--prop", f"y={vy+1.2}cm", "--prop", "width=9cm", "--prop", "height=2cm", "--prop", "align=left")

for i in range(1, 4):
    ghost(4, f"#s3-card-{i}"); ghost(4, f"#s3-num-{i}")
    ghost(4, f"#s3-card-title-{i}"); ghost(4, f"#s3-card-desc-{i}")
ghost(4, "#s3-heading")

notes(4, "EVIDENCE: Scaling laws show predictable improvement with compute. Kaplan et al. (2020) demonstrated power-law scaling. The chart shows parameter growth from 117M (GPT-1) to 1.8T (GPT-4).")

# ============================================================
# SLIDE 5 — TIMELINE (fade from S4, morph target for S6)
# ============================================================
print("S5: Timeline")
add_slide(5)

for a in [
    ("!!scene-bar-gold", "rect", "x=1.5cm,y=12cm,width=30cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=2cm,y=2cm,width=0.06cm,height=10cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=20cm,y=14cm,width=10cm,height=3cm", GOLD, "0.10"),
    ("!!scene-frame-navy", "roundRect", "x=6cm,y=2cm,width=25cm,height=8cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=5cm,y=2cm,width=3cm,height=3cm", GOLD, "0.20"),
    ("!!scene-accent-steel", "ellipse", "x=28cm,y=16cm,width=4cm,height=4cm", STEEL, "0.12"),
    ("!!scene-dot-gold", "ellipse", "x=15cm,y=15cm,width=1cm,height=1cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=27cm,y=3cm,width=0.6cm,height=0.6cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[5]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[5]", "--type", "shape",
   "--prop", f'name=#s5-title', "--prop", "text=Evolution of Large Language Models",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=0.5cm", "--prop", "width=30cm", "--prop", "height=2.5cm", "--prop", "align=left")

timeline = [
    ("2017", "Transformer", "Attention Is All You Need"),
    ("2018", "GPT-1 | 117M", "First large generative model"),
    ("2019", "GPT-2 | 1.5B", "Zero-shot transfer at scale"),
    ("2020", "GPT-3 | 175B", "Emergent in-context learning"),
    ("2022", "ChatGPT | RLHF", "Conversational AI boom"),
    ("2023", "GPT-4 | ~1.8T", "Multimodal expert reasoning"),
]

tl_item_w = 4.6; tl_gap = 0.6
tl_total = len(timeline) * tl_item_w + (len(timeline)-1) * tl_gap
tl_off = (33.87 - tl_total) / 2

for i, (year, name, desc) in enumerate(timeline):
    cx = tl_off + i * (tl_item_w + tl_gap)
    oc("add", FILE, "/slide[5]", "--type", "shape",
       "--prop", f"name=#s5-tl-dot-{i+1}", "--prop", "preset=ellipse",
       "--prop", f"fill={GOLD}", "--prop", "opacity=0.7", "--prop", "line=none",
       "--prop", f"x={cx+(tl_item_w-0.8)/2}cm", "--prop", f"y=6.2cm", "--prop", "width=0.8cm", "--prop", "height=0.8cm")
    oc("add", FILE, "/slide[5]", "--type", "shape",
       "--prop", f"name=#s5-tl-year-{i+1}", "--prop", f"text={year}",
       "--prop", "font=Segoe UI", "--prop", "size=14", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", "y=4cm", "--prop", f"width={tl_item_w}cm", "--prop", "height=1.2cm", "--prop", "align=center")
    oc("add", FILE, "/slide[5]", "--type", "shape",
       "--prop", f"name=#s5-tl-name-{i+1}", "--prop", f"text={name}",
       "--prop", "font=Segoe UI", "--prop", "size=13", "--prop", f"color={WHITE}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", f"y=7.2cm", "--prop", f"width={tl_item_w}cm", "--prop", "height=1.8cm", "--prop", "align=center")
    oc("add", FILE, "/slide[5]", "--type", "shape",
       "--prop", f"name=#s5-tl-desc-{i+1}", "--prop", f"text={desc}",
       "--prop", "font=Segoe UI", "--prop", "size=10", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", f"y=9.2cm", "--prop", f"width={tl_item_w}cm", "--prop", "height=1.5cm", "--prop", "align=center")

ghost(5, "#s4-title")
for suffix in ["compute", "data", "params"]:
    ghost(5, f"#s4-kpi-label-{suffix}")
    ghost(5, f"#s4-kpi-value-{suffix}")

notes(5, "TIMELINE: From the 2017 Transformer paper to GPT-4. The jump from GPT-2 to GPT-3 in 2020 was the key inflection point — showing scale alone produces emergent capabilities.")

# ============================================================
# SLIDE 6 — TRAINING PIPELINE (morph from S5)
# ============================================================
print("S6: Training Pipeline (morph)")
add_slide(6, morph=True)

for a in [
    ("!!scene-bar-gold", "rect", "x=1.5cm,y=2cm,width=30cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=16cm,y=3cm,width=0.06cm,height=14cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=1.5cm,y=3.5cm,width=13cm,height=12.5cm", GOLD, "0.10"),
    ("!!scene-frame-navy", "roundRect", "x=18cm,y=3.5cm,width=14cm,height=12.5cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=3cm,y=14cm,width=3cm,height=3cm", GOLD, "0.35"),
    ("!!scene-accent-steel", "ellipse", "x=28cm,y=16cm,width=3.5cm,height=3.5cm", STEEL, "0.12"),
    ("!!scene-dot-gold", "ellipse", "x=8cm,y=16cm,width=0.8cm,height=0.8cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=20cm,y=16cm,width=0.6cm,height=0.6cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[6]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[6]", "--type", "shape",
   "--prop", f'name=#s6-title', "--prop", "text=Training Pipeline",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=0.5cm", "--prop", "width=30cm", "--prop", "height=2.5cm", "--prop", "align=left")

stages = [
    ("Pre-training", "Next-token prediction on massive unlabeled corpora. Models learn syntax, facts, and reasoning patterns. Cost: $1M-$100M+ per run.", "01"),
    ("Fine-tuning", "Supervised learning on curated instruction data. Teaches the model to follow instructions and perform specific tasks.", "02"),
    ("RLHF", "Reinforcement Learning from Human Feedback. Aligns outputs with human preferences — helpfulness, honesty, harmlessness.", "03"),
]
for i, (title, desc, num) in enumerate(stages):
    sy = 4 + i * 4.3
    oc("add", FILE, "/slide[6]", "--type", "shape",
       "--prop", f"name=#s6-stage-card-{i+1}", "--prop", "preset=roundRect",
       "--prop", f"fill={CARD}", "--prop", "opacity=0.25", "--prop", "line=none",
       "--prop", f"x=2.5cm", "--prop", f"y={sy}cm", "--prop", "width=11cm", "--prop", "height=3.5cm")
    oc("add", FILE, "/slide[6]", "--type", "shape",
       "--prop", f"name=#s6-stage-num-{i+1}", "--prop", f"text={num}",
       "--prop", "font=Segoe UI", "--prop", "size=24", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x=2.5cm", "--prop", f"y={sy}cm", "--prop", "width=2cm", "--prop", "height=2cm", "--prop", "align=center")
    oc("add", FILE, "/slide[6]", "--type", "shape",
       "--prop", f"name=#s6-stage-title-{i+1}", "--prop", f"text={title}",
       "--prop", "font=Segoe UI", "--prop", "size=18", "--prop", "bold=true",
       "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x=5cm", "--prop", f"y={sy+0.2}cm", "--prop", "width=8cm", "--prop", "height=1.2cm", "--prop", "align=left")
    oc("add", FILE, "/slide[6]", "--type", "shape",
       "--prop", f"name=#s6-stage-desc-{i+1}", "--prop", f"text={desc}",
       "--prop", "font=Segoe UI", "--prop", "size=11", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x=5cm", "--prop", f"y={sy+1.4}cm", "--prop", "width=8cm", "--prop", "height=2cm", "--prop", "align=left")

oc("add", FILE, "/slide[6]", "--type", "shape",
   "--prop", f'name=#s6-insight-title', "--prop", "text=Why Three Stages?",
   "--prop", "font=Segoe UI", "--prop", "size=20", "--prop", "bold=true",
   "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=19.5cm", "--prop", "y=4.5cm", "--prop", "width=11cm", "--prop", "height=1.5cm", "--prop", "align=left")
oc("add", FILE, "/slide[6]", "--type", "shape",
   "--prop", f'name=#s6-insight-body',
   "--prop", "text=Each stage serves a distinct purpose. Pre-training builds broad knowledge. Fine-tuning shapes behavior. RLHF ensures alignment. Omitting any stage produces a model that is either unsafe, unhelpful, or brittle.",
   "--prop", "font=Segoe UI", "--prop", "size=14", "--prop", f"color={STEEL}",
   "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=19.5cm", "--prop", "y=6.5cm", "--prop", "width=11cm", "--prop", "height=8cm", "--prop", "align=left")

ghost(6, "#s5-title")
for i in range(1, len(timeline)+1):
    for suffix in ["tl-dot", "tl-year", "tl-name", "tl-desc"]:
        ghost(6, f"#s5-{suffix}-{i}")

notes(6, "PIPELINE: Three-stage training. PRE-TRAINING: next-token prediction on trillions of words — most expensive stage. FINE-TUNING: instruction-response pairs for task-following. RLHF: human preferences as reward signal — key to ChatGPT's effectiveness.")

# ============================================================
# SLIDE 7 — CAPABILITIES (fade, morph target for S8)
# ============================================================
print("S7: Capabilities")
add_slide(7)

for a in [
    ("!!scene-bar-gold", "rect", "x=1.5cm,y=16cm,width=10cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=1.5cm,y=3cm,width=0.06cm,height=13cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=24cm,y=3cm,width=8cm,height=12cm", GOLD, "0.10"),
    ("!!scene-frame-navy", "roundRect", "x=2.5cm,y=3cm,width=19cm,height=12cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=2cm,y=2cm,width=2.5cm,height=2.5cm", GOLD, "0.25"),
    ("!!scene-accent-steel", "ellipse", "x=28cm,y=16cm,width=3.5cm,height=3.5cm", STEEL, "0.12"),
    ("!!scene-dot-gold", "ellipse", "x=20cm,y=2.5cm,width=0.8cm,height=0.8cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=15cm,y=16cm,width=0.6cm,height=0.6cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[7]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[7]", "--type", "shape",
   "--prop", f'name=#s7-title', "--prop", "text=Capabilities & Benchmarks",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=0.5cm", "--prop", "width=30cm", "--prop", "height=2.5cm", "--prop", "align=left")

add_chart(7, chartType="bar",
    x="3.5cm", y="4cm", width="16cm", height="10cm",
    colors="C9A84C,1E3A5F,8EACC1",
    categories="MMLU,HumanEval,GSM8K,HellaSwag,BIG-Bench",
    data="Score:86.4,70.2,92.0,95.3,83.5",
    chartFill="none", plotFill="none", gridlines=False,
    legend="none", dataLabels="value",
    labelfont="11:C9A84C:Segoe UI", axisfont="10:8EACC1:Segoe UI",
    axisline="none", autotitledeleted=True)

kpis_s7 = [
    ("MMLU", "86.4%", "Massive Multitask Language Understanding", 4.5),
    ("HumanEval", "70.2%", "Code generation correctness", 8.0),
    ("GSM8K", "92.0%", "Grade-school math reasoning", 11.5),
]
for name, score, desc, ky in kpis_s7:
    oc("add", FILE, "/slide[7]", "--type", "shape",
       "--prop", f"name=#s7-kpi-name-{name.lower()}", "--prop", f"text={name}",
       "--prop", "font=Segoe UI", "--prop", "size=12", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", "x=25.5cm", "--prop", f"y={ky}cm", "--prop", "width=5cm", "--prop", "height=1cm", "--prop", "align=left")
    oc("add", FILE, "/slide[7]", "--type", "shape",
       "--prop", f"name=#s7-kpi-score-{name.lower()}", "--prop", f"text={score}",
       "--prop", "font=Segoe UI", "--prop", "size=28", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", "x=25.5cm", "--prop", f"y={ky+1}cm", "--prop", "width=5cm", "--prop", "height=1.5cm", "--prop", "align=left")
    oc("add", FILE, "/slide[7]", "--type", "shape",
       "--prop", f"name=#s7-kpi-desc-{name.lower()}", "--prop", f"text={desc}",
       "--prop", "font=Segoe UI", "--prop", "size=9", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", "x=25.5cm", "--prop", f"y={ky+2.2}cm", "--prop", "width=5cm", "--prop", "height=1cm", "--prop", "align=left")

ghost(7, "#s6-title"); ghost(7, "#s6-insight-title"); ghost(7, "#s6-insight-body")
for i in range(1, 4):
    for suffix in ["stage-card", "stage-num", "stage-title", "stage-desc"]:
        ghost(7, f"#s6-{suffix}-{i}")

notes(7, "CAPABILITIES: LLMs demonstrate expert-level performance. MMLU: 86.4% across 57 subjects. HumanEval: 70.2% code generation. GSM8K: 92% math reasoning. These scores represent rapid year-over-year improvements.")

# ============================================================
# SLIDE 8 — CHALLENGES (morph from S7)
# ============================================================
print("S8: Challenges (morph)")
add_slide(8, morph=True)

for a in [
    ("!!scene-bar-gold", "rect", "x=22cm,y=0.5cm,width=8cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=20cm,y=3cm,width=0.06cm,height=14cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=1.5cm,y=3cm,width=15cm,height=13cm", GOLD, "0.10"),
    ("!!scene-frame-navy", "roundRect", "x=19cm,y=3cm,width=13cm,height=13cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=30cm,y=16cm,width=2.5cm,height=2.5cm", GOLD, "0.35"),
    ("!!scene-accent-steel", "ellipse", "x=2cm,y=2cm,width=3cm,height=3cm", STEEL, "0.15"),
    ("!!scene-dot-gold", "ellipse", "x=10cm,y=2cm,width=1cm,height=1cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=14cm,y=16cm,width=0.8cm,height=0.8cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[8]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[8]", "--type", "shape",
   "--prop", f'name=#s8-title', "--prop", "text=Challenges & Limitations",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=0.5cm", "--prop", "width=30cm", "--prop", "height=2.5cm", "--prop", "align=left")

challenges = [
    ("Hallucination", "Models generate plausible but factually incorrect information with high confidence. A fundamental limitation of next-token prediction."),
    ("Alignment", "Ensuring model behavior matches human values. RLHF helps but values are subjective and context-dependent."),
    ("Cost", "Training costs $10M-$100M+ per run. Inference at scale requires thousands of GPUs, centralizing capability."),
    ("Environmental", "A single training run emits ~300 tons CO2. Compute demand doubles every 6-10 months."),
]
for i, (title, desc) in enumerate(challenges):
    cx = 2.5 + (i % 2) * 14.5
    cy = 4 + (i // 2) * 6.5
    oc("add", FILE, "/slide[8]", "--type", "shape",
       "--prop", f"name=#s8-ch-card-{i+1}", "--prop", "preset=roundRect",
       "--prop", f"fill={CARD}", "--prop", "opacity=0.25", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", f"y={cy}cm", "--prop", "width=13cm", "--prop", "height=5.5cm")
    oc("add", FILE, "/slide[8]", "--type", "shape",
       "--prop", f"name=#s8-ch-icon-{i+1}", "--prop", "text=!",
       "--prop", "font=Segoe UI", "--prop", "size=24", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+0.5}cm", "--prop", f"y={cy+0.5}cm", "--prop", "width=1.5cm", "--prop", "height=1.5cm", "--prop", "align=center")
    oc("add", FILE, "/slide[8]", "--type", "shape",
       "--prop", f"name=#s8-ch-title-{i+1}", "--prop", f"text={title}",
       "--prop", "font=Segoe UI", "--prop", "size=20", "--prop", "bold=true",
       "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+2.5}cm", "--prop", f"y={cy+0.5}cm", "--prop", "width=9.5cm", "--prop", "height=1.5cm", "--prop", "align=left")
    oc("add", FILE, "/slide[8]", "--type", "shape",
       "--prop", f"name=#s8-ch-desc-{i+1}", "--prop", f"text={desc}",
       "--prop", "font=Segoe UI", "--prop", "size=12", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+2.5}cm", "--prop", f"y={cy+2.2}cm", "--prop", "width=9.5cm", "--prop", "height=3cm", "--prop", "align=left")

ghost(8, "#s7-title")
for name in ["mmlu", "humaneval", "gsm8k"]:
    ghost(8, f"#s7-kpi-name-{name}")
    ghost(8, f"#s7-kpi-score-{name}")
    ghost(8, f"#s7-kpi-desc-{name}")

notes(8, "CHALLENGES: HALLUCINATION — LLMs confidently state false information. ALIGNMENT — what values should AI follow? COST — training costs concentrate power. ENVIRONMENTAL — sustainability concerns.")

# ============================================================
# SLIDE 9 — FUTURE DIRECTIONS (fade, morph target for S10)
# ============================================================
print("S9: Future Directions")
add_slide(9)

for a in [
    ("!!scene-bar-gold", "rect", "x=4cm,y=9.5cm,width=18cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=1.5cm,y=2cm,width=0.06cm,height=15cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=10cm,y=3cm,width=12cm,height=10cm", GOLD, "0.08"),
    ("!!scene-frame-navy", "roundRect", "x=1.5cm,y=3cm,width=30cm,height=0.6cm", MID_NAVY, "0.20"),
    ("!!scene-accent-gold", "ellipse", "x=29cm,y=2cm,width=3cm,height=3cm", GOLD, "0.20"),
    ("!!scene-accent-steel", "ellipse", "x=3cm,y=16cm,width=3.5cm,height=3.5cm", STEEL, "0.12"),
    ("!!scene-dot-gold", "ellipse", "x=28cm,y=15cm,width=1cm,height=1cm", GOLD, "0.5"),
    ("!!scene-dot-white", "ellipse", "x=20cm,y=2.5cm,width=0.6cm,height=0.6cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[9]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[9]", "--type", "shape",
   "--prop", f'name=#s9-title', "--prop", "text=Future Directions",
   "--prop", "font=Segoe UI", "--prop", "size=36", "--prop", "bold=true",
   "--prop", f"color={WHITE}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=1.5cm", "--prop", "y=0.5cm", "--prop", "width=30cm", "--prop", "height=2.5cm", "--prop", "align=left")

futures = [
    ("AI Agents", "LLMs as autonomous agents that plan, use tools, browse the web, and execute multi-step tasks beyond chat."),
    ("Multimodality", "Seamless integration of text, image, video, and audio understanding across all modalities."),
    ("Efficient Architectures", "Mixture-of-Experts, sparse attention, distillation, and quantization for smaller, faster models."),
    ("Open-Source", "LLaMA, Mistral, DeepSeek democratize access. The gap between open and closed models is narrowing."),
]
for i, (title, desc) in enumerate(futures):
    cx = 2.5 + (i % 2) * 15
    cy = 4 + (i // 2) * 6
    oc("add", FILE, "/slide[9]", "--type", "shape",
       "--prop", f"name=#s9-future-card-{i+1}", "--prop", "preset=roundRect",
       "--prop", f"fill={CARD}", "--prop", "opacity=0.25", "--prop", "line=none",
       "--prop", f"x={cx}cm", "--prop", f"y={cy}cm", "--prop", "width=13.5cm", "--prop", "height=5cm")
    oc("add", FILE, "/slide[9]", "--type", "shape",
       "--prop", f"name=#s9-future-title-{i+1}", "--prop", f"text={title}",
       "--prop", "font=Segoe UI", "--prop", "size=20", "--prop", "bold=true",
       "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+1}cm", "--prop", f"y={cy+0.5}cm", "--prop", "width=11.5cm", "--prop", "height=1.5cm", "--prop", "align=left")
    oc("add", FILE, "/slide[9]", "--type", "shape",
       "--prop", f"name=#s9-future-desc-{i+1}", "--prop", f"text={desc}",
       "--prop", "font=Segoe UI", "--prop", "size=13", "--prop", f"color={STEEL}",
       "--prop", "fill=none", "--prop", "line=none",
       "--prop", f"x={cx+1}cm", "--prop", f"y={cy+2.2}cm", "--prop", "width=11.5cm", "--prop", "height=2.5cm", "--prop", "align=left")

ghost(9, "#s8-title")
for i in range(1, 5):
    for suffix in ["ch-card", "ch-icon", "ch-title", "ch-desc"]:
        ghost(9, f"#s8-{suffix}-{i}")

notes(9, "FUTURE: AI AGENTS — from chatbots to autonomous tool-using agents. MULTIMODALITY — seeing, hearing, understanding. EFFICIENT ARCHITECTURES — running on laptops. OPEN-SOURCE — democratizing access.")

# ============================================================
# SLIDE 10 — CLOSING (morph from S9)
# ============================================================
print("S10: Closing (morph)")
add_slide(10, morph=True)

for a in [
    ("!!scene-bar-gold", "rect", "x=4cm,y=10cm,width=20cm,height=0.06cm", GOLD, "1"),
    ("!!scene-bar-navy", "rect", "x=2cm,y=3cm,width=0.06cm,height=14cm", MID_NAVY, "1"),
    ("!!scene-frame-gold", "roundRect", "x=7cm,y=3cm,width=8cm,height=6cm", GOLD, "0.12"),
    ("!!scene-frame-navy", "roundRect", "x=20cm,y=12cm,width=10cm,height=5cm", MID_NAVY, "0.25"),
    ("!!scene-accent-gold", "ellipse", "x=28cm,y=3cm,width=3cm,height=3cm", GOLD, "0.20"),
    ("!!scene-accent-steel", "ellipse", "x=2cm,y=14cm,width=4cm,height=4cm", STEEL, "0.12"),
    ("!!scene-dot-gold", "ellipse", "x=18cm,y=16cm,width=1.2cm,height=1.2cm", GOLD, "0.55"),
    ("!!scene-dot-white", "ellipse", "x=25cm,y=4cm,width=0.8cm,height=0.8cm", WHITE, "0.25"),
]:
    oc("add", FILE, "/slide[10]", "--type", "shape",
       "--prop", f"name={a[0]}", "--prop", f"preset={a[1]}",
       "--prop", f"fill={a[3]}", "--prop", f"opacity={a[4]}",
       "--prop", "line=none", "--prop", a[2])

oc("add", FILE, "/slide[10]", "--type", "shape",
   "--prop", f'name=#s10-title', "--prop", "text=The LLM Revolution is Just Beginning",
   "--prop", "font=Segoe UI", "--prop", "size=44", "--prop", "bold=true",
   "--prop", f"color={GOLD}", "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=5cm", "--prop", "width=28cm", "--prop", "height=3.5cm", "--prop", "align=center")
oc("add", FILE, "/slide[10]", "--type", "shape",
   "--prop", f'name=#s10-subtitle', "--prop", "text=Thank You — Questions & Discussion",
   "--prop", "font=Segoe UI", "--prop", "size=24", "--prop", f"color={WHITE}",
   "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=11.5cm", "--prop", "width=28cm", "--prop", "height=2.5cm", "--prop", "align=center")
oc("add", FILE, "/slide[10]", "--type", "shape",
   "--prop", f'name=#s10-footer',
   "--prop", "text=References available upon request  ·  @llm_research  ·  llm-architecture.dev",
   "--prop", "font=Segoe UI", "--prop", "size=12", "--prop", f"color={STEEL}",
   "--prop", "fill=none", "--prop", "line=none",
   "--prop", "x=3cm", "--prop", "y=15.5cm", "--prop", "width=28cm", "--prop", "height=1.5cm", "--prop", "align=center")

ghost(10, "#s9-title")
for i in range(1, 5):
    for suffix in ["future-card", "future-title", "future-desc"]:
        ghost(10, f"#s9-{suffix}-{i}")

notes(10, "CLOSING: The LLM revolution is just beginning. From the 2017 Transformer to today's multimodal models. The next five years bring AI agents, ubiquitous multimodality, and democratized access. Thank you.")

# ============================================================
print("Closing and validating...")
oc("close", FILE)
print(oc("validate", FILE))
print("\n=== BUILD COMPLETE ===")
print(f"File: {FILE}")
