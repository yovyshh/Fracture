<# PowerShell build script for LLM Architecture Deck #>
$FILE = "LLM-Architecture-Deck.pptx"
$NAVY = "0C1B33"
$GOLD = "C9A84C"
$WHITE = "FFFFFF"
$MID_NAVY = "1E3A5F"
$STEEL = "8EACC1"
$CARD = "2C4F7C"

function Add-Slide($num, $bg = $NAVY, $morph = $false) {
    $r = officecli add $FILE / --type slide --prop layout=blank --prop background=$bg 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "  WARN slide ${num}: $r" }
    if ($morph) {
        officecli set $FILE "/slide[$num]" --prop transition=morph 2>$null
    }
}

function Add-Shape($slide, $name, $preset, $fill, $opacity, $line, $x, $y, $width, $height, [switch]$noPos) {
    if ($noPos) {
        officecli add $FILE "/slide[$slide]" --type shape --prop "name=$name" --prop "preset=$preset" --prop "fill=$fill" --prop "opacity=$opacity" --prop "line=$line" $posArgs 2>$null
        return
    }
    officecli add $FILE "/slide[$slide]" --type shape --prop "name=$name" --prop "preset=$preset" --prop "fill=$fill" --prop "opacity=$opacity" --prop "line=$line" --prop "x=$x" --prop "y=$y" --prop "width=$width" --prop "height=$height" 2>$null
}

function Add-Text($slide, $name, $text, $x, $y, $w, $h, $font="Segoe UI", $size, $color=$WHITE, $align="left", [switch]$bold, $fill="none", $line="none") {
    $b = if ($bold) { "--prop bold=true" } else { "" }
    officecli add $FILE "/slide[$slide]" --type shape --prop "name=$name" --prop "text=$text" --prop "font=$font" --prop "size=$size" --prop "color=$color" --prop "align=$align" --prop "x=$x" --prop "y=$y" --prop "width=$w" --prop "height=$h" --prop "fill=$fill" --prop "line=$line" $b 2>$null
}

function Ghost($slide, $name) {
    officecli set $FILE "/slide[$slide]/shape[@name=$name]" --prop x=36cm 2>$null
}

function Add-Notes($slide, $text) {
    officecli add $FILE "/slide[$slide]" --type notes --prop "text=$text" 2>$null
}

function Add-Chart($slide, $type, $x, $y, $w, $h, $colors, $categories, $data) {
    officecli add $FILE "/slide[$slide]" --type chart --prop "chartType=$type" --prop "x=$x" --prop "y=$y" --prop "width=$w" --prop "height=$h" --prop "colors=$colors" --prop "categories=$categories" --prop "data=$data" --prop "chartFill=none" --prop "plotFill=none" --prop "gridlines=false" --prop "legend=none" --prop "dataLabels=value" --prop "labelfont=10:$GOLD:Segoe UI" --prop "axisfont=9:$STEEL:Segoe UI" --prop "axisline=none" --prop "autotitledeleted=true" 2>$null
}

# ==================== BUILD ====================
Write-Host "Creating deck..."
officecli create $FILE
officecli open $FILE

# ============================================================
# SLIDE 1 -" HERO
# ============================================================
Write-Host "S1: Hero"
Add-Slide 1

# Scene actors
$actors1 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","4cm","9.5cm","18cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","2cm","3cm","0.06cm","14cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.12","none","7cm","3cm","8cm","6cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.25","none","20cm","10cm","10cm","6cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.15","none","28cm","2cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","2cm","14cm","4cm","4cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","18cm","16cm","1.2cm","1.2cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","25cm","3cm","0.8cm","0.8cm")
)
foreach ($a in $actors1) {
    Add-Shape 1 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 1 "#s1-title" "Large Language Models" "3cm" "5cm" "28cm" "4cm" -size 60 -bold -align "center"
Add-Text 1 "#s1-subtitle" "Architecture, Capabilities, and Future Directions" "3cm" "11cm" "28cm" "2.5cm" -size 24 -color $GOLD -align "center"
Add-Notes 1 "OPENING: Welcome everyone. Today we explore Large Language Models - the technology behind GPT-4, Claude, Gemini, and LLaMA. We will cover what makes them work, what they can do, and where the field is heading."

# ============================================================
# SLIDE 2  STATEMENT  morph
# ============================================================
Write-Host "S2: Statement  morph"
Add-Slide 2 -morph $true

$actors2 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","22cm","0.5cm","8cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","25cm","3cm","0.06cm","14cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.12","none","16cm","8cm","6cm","4cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.25","none","4cm","12cm","10cm","4cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.25","none","30cm","16cm","2.5cm","2.5cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.15","none","2cm","2cm","3cm","3cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","10cm","2cm","1cm","1cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","14cm","16cm","0.8cm","0.8cm")
)
foreach ($a in $actors2) {
    Add-Shape 2 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 2 "#s2-title" "The Age of Foundation Models" "3cm" "4cm" "24cm" "3cm" -size 44 -bold
Add-Text 2 "#s2-body" "Large Language Models represent a paradigm shift in artificial intelligence. Built on the Transformer architecture, these models learn from vast text corpora and exhibit emergent abilities that were unthinkable just five years ago." "3cm" "8cm" "22cm" "5cm" -size 20 -color $STEEL
Ghost 2 "#s1-title"
Ghost 2 "#s1-subtitle"
Add-Notes 2 "KEY STATEMENT: GPT-3 showed that scaling up Transformers produced abilities no one explicitly programmed. Foundation models now underpin everything from chatbots to scientific discovery."

# ============================================================
# SLIDE 3 -" PILLARS
# ============================================================
Write-Host "S3: Pillars"
Add-Slide 3

$actors3 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","1.5cm","3.5cm","12cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","24cm","2cm","0.06cm","14cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.10","none","10cm","5cm","12cm","10cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","1.5cm","5cm","30cm","0.8cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.20","none","29cm","14cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","3cm","14cm","3.5cm","3.5cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","20cm","15cm","1cm","1cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","28cm","3cm","0.6cm","0.6cm")
)
foreach ($a in $actors3) {
    Add-Shape 3 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 3 "#s3-heading" "Three Pillars of LLM Success" "1.5cm" "1.5cm" "30cm" "3cm" -size 36 -bold

$col_w = 8.5; $gap = 0.76; $total = 3 * $col_w + 2 * $gap; $start_x = (33.87 - $total) / 2
$pillars = @(
    @("01","Scale","Models with billions of parameters learn rich, hierarchical representations. GPT-3's 175B parameters demonstrated that scale unlocks emergent capabilities."),
    @("02","Data","Training on trillions of tokens from diverse sources gives LLMs broad knowledge. Data quality and curation are as critical as quantity."),
    @("03","Architecture","The Transformer's self-attention enables parallel processing of long-range dependencies. Innovations like RoPE, GQA, and MoE continue to advance the design.")
)
for ($i = 0; $i -lt 3; $i++) {
    $cx = $start_x + $i * ($col_w + $gap)
    officecli add $FILE "/slide[3]" --type shape --prop "name=#s3-card-$($i+1)" --prop preset=roundRect --prop "fill=$CARD" --prop opacity=0.35 --prop line=none --prop "x=${cx}cm" --prop y=5.5cm --prop "width=${col_w}cm" --prop height=10cm 2>$null
    officecli add $FILE "/slide[3]" --type shape --prop "name=#s3-num-$($i+1)" --prop "text=$($pillars[$i][0])" --prop "font=Segoe UI" --prop size=48 --prop bold=true --prop "color=$GOLD" --prop fill=none --prop line=none --prop "x=${cx}cm" --prop y=6cm --prop "width=${col_w}cm" --prop height=2.5cm --prop align=center 2>$null
    officecli add $FILE "/slide[3]" --type shape --prop "name=#s3-card-title-$($i+1)" --prop "text=$($pillars[$i][1])" --prop "font=Segoe UI" --prop size=22 --prop bold=true --prop "color=$WHITE" --prop fill=none --prop line=none --prop "x=$($cx+0.5)cm" --prop y=8.5cm --prop "width=$($col_w-1)cm" --prop height=1.5cm --prop align=center 2>$null
    officecli add $FILE "/slide[3]" --type shape --prop "name=#s3-card-desc-$($i+1)" --prop "text=$($pillars[$i][2])" --prop "font=Segoe UI" --prop size=14 --prop "color=$STEEL" --prop fill=none --prop line=none --prop "x=$($cx+0.5)cm" --prop "y=10cm" --prop "width=$($col_w-1)cm" --prop height=5cm --prop align=center 2>$null
}

Ghost 3 "#s2-title"; Ghost 3 "#s2-body"
Add-Notes 3 "PILLARS: Three factors drive LLM success. SCALE - from 117M to 1.8T parameters. DATA - training data grew from 1B to 13T+ tokens. ARCHITECTURE - the Transformer remains the foundation."

# ============================================================
# SLIDE 4  EVIDENCE  morph
# ============================================================
Write-Host "S4: Evidence  morph"
Add-Slide 4 -morph $true

$actors4 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","1.5cm","2cm","30cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","20cm","4cm","0.06cm","12cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.08","none","1.5cm","4cm","16cm","11cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","20cm","4cm","12cm","11cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.35","none","29cm","16cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.15","none","2cm","2cm","2.5cm","2.5cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.55","none","12cm","2.5cm","0.8cm","0.8cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","8cm","16cm","0.6cm","0.6cm")
)
foreach ($a in $actors4) {
    Add-Shape 4 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 4 "#s4-title" "Scaling Laws" "1.5cm" "0.5cm" "20cm" "2.5cm" -size 36 -bold

Add-Chart 4 "column" "2.5cm" "4.5cm" "14cm" "9cm" "C9A84C,1E3A5F,8EACC1" "GPT1,GPT2,GPT3,GPT4,LLaMA,DeepSeek" "Parameters:0.117,1.5,175,1800,65,671"

Add-Text 4 "#s4-kpi-label-1" "Training Compute" "21.5cm" "5cm" "9cm" "1.2cm" -size 14 -color $STEEL
Add-Text 4 "#s4-kpi-value-1" "10^25 FLOPs" "21.5cm" "6.2cm" "9cm" "2cm" -size 32 -bold -color $GOLD
Add-Text 4 "#s4-kpi-label-2" "Training Data" "21.5cm" "8.5cm" "9cm" "1.2cm" -size 14 -color $STEEL
Add-Text 4 "#s4-kpi-value-2" "13T+ tokens" "21.5cm" "9.7cm" "9cm" "2cm" -size 32 -bold -color $GOLD
Add-Text 4 "#s4-kpi-label-3" "Model Size" "21.5cm" "12cm" "9cm" "1.2cm" -size 14 -color $STEEL
Add-Text 4 "#s4-kpi-value-3" "1.8T params" "21.5cm" "13.2cm" "9cm" "2cm" -size 32 -bold -color $GOLD

for ($i = 1; $i -le 3; $i++) {
    Ghost 4 "#s3-card-$i"; Ghost 4 "#s3-num-$i"; Ghost 4 "#s3-card-title-$i"; Ghost 4 "#s3-card-desc-$i"
}
Ghost 4 "#s3-heading"
Add-Notes 4 "EVIDENCE: Scaling laws show predictable improvement with compute. Kaplan et al. (2020) demonstrated power-law scaling with compute, data, and parameters."

# ============================================================
# SLIDE 5 -" TIMELINE
# ============================================================
Write-Host "S5: Timeline"
Add-Slide 5

$actors5 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","1.5cm","12cm","30cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","2cm","2cm","0.06cm","10cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.10","none","20cm","14cm","10cm","3cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","6cm","2cm","25cm","8cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.20","none","5cm","2cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","28cm","16cm","4cm","4cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","15cm","15cm","1cm","1cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","27cm","3cm","0.6cm","0.6cm")
)
foreach ($a in $actors5) {
    Add-Shape 5 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 5 "#s5-title" "Evolution of Large Language Models" "1.5cm" "0.5cm" "30cm" "2.5cm" -size 36 -bold

$timeline = @(
    @("2017","Transformer","Attention Is All You Need"),
    @("2018","GPT-1 | 117M","First large generative model"),
    @("2019","GPT-2 | 1.5B","Zero-shot transfer at scale"),
    @("2020","GPT-3 | 175B","Emergent in-context learning"),
    @("2022","ChatGPT | RLHF","Conversational AI boom"),
    @("2023","GPT-4 | ~1.8T","Multimodal expert reasoning")
)
$tl_item_w = 4.6; $tl_gap = 0.6
$tl_total = $timeline.Count * $tl_item_w + ($timeline.Count - 1) * $tl_gap
$tl_off = (33.87 - $tl_total) / 2

for ($i = 0; $i -lt $timeline.Count; $i++) {
    $cx = $tl_off + $i * ($tl_item_w + $tl_gap)
    $diam = 0.8
    officecli add $FILE "/slide[5]" --type shape --prop "name=#s5-tl-dot-$($i+1)" --prop preset=ellipse --prop "fill=$GOLD" --prop opacity=0.7 --prop line=none --prop "x=$($cx+($tl_item_w-$diam)/2)cm" --prop y=6.2cm --prop width=${diam}cm --prop height=${diam}cm 2>$null
    officecli add $FILE "/slide[5]" --type shape --prop "name=#s5-tl-year-$($i+1)" --prop "text=$($timeline[$i][0])" --prop "font=Segoe UI" --prop size=14 --prop bold=true --prop "color=$GOLD" --prop fill=none --prop line=none --prop "x=${cx}cm" --prop y=4cm --prop "width=${tl_item_w}cm" --prop height=1.2cm --prop align=center 2>$null
    officecli add $FILE "/slide[5]" --type shape --prop "name=#s5-tl-name-$($i+1)" --prop "text=$($timeline[$i][1])" --prop "font=Segoe UI" --prop size=13 --prop "color=$WHITE" --prop fill=none --prop line=none --prop "x=${cx}cm" --prop y=7.2cm --prop "width=${tl_item_w}cm" --prop height=1.8cm --prop align=center 2>$null
    officecli add $FILE "/slide[5]" --type shape --prop "name=#s5-tl-desc-$($i+1)" --prop "text=$($timeline[$i][2])" --prop "font=Segoe UI" --prop size=10 --prop "color=$STEEL" --prop fill=none --prop line=none --prop "x=${cx}cm" --prop y=9.2cm --prop "width=${tl_item_w}cm" --prop height=1.5cm --prop align=center 2>$null
}

Ghost 5 "#s4-title"
for ($i = 1; $i -le 3; $i++) {
    Ghost 5 "#s4-kpi-label-$i"; Ghost 5 "#s4-kpi-value-$i"
}
Add-Notes 5 "TIMELINE: From the 2017 Transformer paper to GPT-4. The GPT-2 to GPT-3 jump in 2020 was the key inflection point."

# ============================================================
# SLIDE 6 -" TRAINING PIPELINE  morph
# ============================================================
Write-Host "S6: Training Pipeline  morph"
Add-Slide 6 -morph $true

$actors6 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","1.5cm","2cm","30cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","16cm","3cm","0.06cm","14cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.10","none","1.5cm","3.5cm","13cm","12.5cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","18cm","3.5cm","14cm","12.5cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.35","none","3cm","14cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","28cm","16cm","3.5cm","3.5cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","8cm","16cm","0.8cm","0.8cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","20cm","16cm","0.6cm","0.6cm")
)
foreach ($a in $actors6) {
    Add-Shape 6 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 6 "#s6-title" "Training Pipeline" "1.5cm" "0.5cm" "30cm" "2.5cm" -size 36 -bold

$stages = @(
    @("Pre-training","Next-token prediction on massive unlabeled corpora. Models learn syntax, facts, and reasoning patterns.","01"),
    @("Fine-tuning","Supervised learning on curated instruction data. Teaches task-following and specific skills.","02"),
    @("RLHF","Reinforcement Learning from Human Feedback. Aligns model outputs with human preferences.","03")
)
for ($i = 0; $i -lt 3; $i++) {
    $sy = 4 + $i * 4.3
    officecli add $FILE "/slide[6]" --type shape --prop "name=#s6-stage-card-$($i+1)" --prop preset=roundRect --prop "fill=$CARD" --prop opacity=0.25 --prop line=none --prop x=2.5cm --prop "y=${sy}cm" --prop width=11cm --prop height=3.5cm 2>$null
    officecli add $FILE "/slide[6]" --type shape --prop "name=#s6-stage-num-$($i+1)" --prop "text=$($stages[$i][2])" --prop "font=Segoe UI" --prop size=24 --prop bold=true --prop "color=$GOLD" --prop fill=none --prop line=none --prop x=2.5cm --prop "y=${sy}cm" --prop width=2cm --prop height=2cm --prop align=center 2>$null
    officecli add $FILE "/slide[6]" --type shape --prop "name=#s6-stage-title-$($i+1)" --prop "text=$($stages[$i][0])" --prop "font=Segoe UI" --prop size=18 --prop bold=true --prop "color=$WHITE" --prop fill=none --prop line=none --prop x=5cm --prop "y=$($sy+0.2)cm" --prop width=8cm --prop height=1.2cm --prop align=left 2>$null
    officecli add $FILE "/slide[6]" --type shape --prop "name=#s6-stage-desc-$($i+1)" --prop "text=$($stages[$i][1])" --prop "font=Segoe UI" --prop size=11 --prop "color=$STEEL" --prop fill=none --prop line=none --prop x=5cm --prop "y=$($sy+1.4)cm" --prop width=8cm --prop height=2cm --prop align=left 2>$null
}

Add-Text 6 "#s6-insight-title" "Why Three Stages?" "19.5cm" "4.5cm" "11cm" "1.5cm" -size 20 -bold -color $GOLD
Add-Text 6 "#s6-insight-body" "Each stage serves a distinct purpose. Pre-training builds knowledge. Fine-tuning shapes behavior. RLHF ensures alignment. Omitting any stage produces a model that is either unsafe, unhelpful, or brittle." "19.5cm" "6.5cm" "11cm" "8cm" -size 14 -color $STEEL

Ghost 6 "#s5-title"
for ($i = 1; $i -le $timeline.Count; $i++) {
    Ghost 6 "#s5-tl-dot-$i"; Ghost 6 "#s5-tl-year-$i"; Ghost 6 "#s5-tl-name-$i"; Ghost 6 "#s5-tl-desc-$i"
}
Add-Notes 6 "PIPELINE: Three-stage training. Pre-training: next-token prediction on trillions of words. Fine-tuning: instruction-response pairs. RLHF: human preference alignment."

# ============================================================
# SLIDE 7 -" CAPABILITIES
# ============================================================
Write-Host "S7: Capabilities"
Add-Slide 7

$actors7 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","1.5cm","16cm","10cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","1.5cm","3cm","0.06cm","13cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.10","none","24cm","3cm","8cm","12cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","2.5cm","3cm","19cm","12cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.25","none","2cm","2cm","2.5cm","2.5cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","28cm","16cm","3.5cm","3.5cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","20cm","2.5cm","0.8cm","0.8cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","15cm","16cm","0.6cm","0.6cm")
)
foreach ($a in $actors7) {
    Add-Shape 7 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 7 "#s7-title" "Capabilities & Benchmarks" "1.5cm" "0.5cm" "30cm" "2.5cm" -size 36 -bold

Add-Chart 7 "bar" "3.5cm" "4cm" "16cm" "10cm" "C9A84C,1E3A5F,8EACC1" "MMLU,HumanEval,GSM8K,HellaSwag,BIG-Bench" "Score:86.4,70.2,92.0,95.3,83.5"

$kpis7 = @(
    @("MMLU","86.4%","Massive Multitask Language Understanding",4.5),
    @("HumanEval","70.2%","Code generation correctness",8.0),
    @("GSM8K","92.0%","Grade-school math reasoning",11.5)
)
foreach ($k in $kpis7) {
    Add-Text 7 "#s7-kpi-name-$($k[0].ToLower())" $k[0] "25.5cm" "$($k[3])cm" "5cm" "1cm" -size 12 -color $STEEL
    Add-Text 7 "#s7-kpi-score-$($k[0].ToLower())" $k[1] "25.5cm" "$($k[3]+1)cm" "5cm" "1.5cm" -size 28 -bold -color $GOLD
    Add-Text 7 "#s7-kpi-desc-$($k[0].ToLower())" $k[2] "25.5cm" "$($k[3]+2.2)cm" "5cm" "1cm" -size 9 -color $STEEL
}

Ghost 7 "#s6-title"; Ghost 7 "#s6-insight-title"; Ghost 7 "#s6-insight-body"
for ($i = 1; $i -le 3; $i++) {
    Ghost 7 "#s6-stage-card-$i"; Ghost 7 "#s6-stage-num-$i"; Ghost 7 "#s6-stage-title-$i"; Ghost 7 "#s6-stage-desc-$i"
}
Add-Notes 7 "CAPABILITIES: LLMs demonstrate expert-level performance. MMLU: 86.4% across 57 subjects. HumanEval: 70.2% code generation. GSM8K: 92% math reasoning."

# ============================================================
# SLIDE 8 -" CHALLENGES  morph
# ============================================================
Write-Host "S8: Challenges  morph"
Add-Slide 8 -morph $true

$actors8 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","22cm","0.5cm","8cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","20cm","3cm","0.06cm","14cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.10","none","1.5cm","3cm","15cm","13cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","19cm","3cm","13cm","13cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.35","none","30cm","16cm","2.5cm","2.5cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.15","none","2cm","2cm","3cm","3cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","10cm","2cm","1cm","1cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","14cm","16cm","0.8cm","0.8cm")
)
foreach ($a in $actors8) {
    Add-Shape 8 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 8 "#s8-title" "Challenges & Limitations" "1.5cm" "0.5cm" "30cm" "2.5cm" -size 36 -bold

$challenges = @(
    @("Hallucination","Models generate plausible but factually incorrect information with high confidence."),
    @("Alignment","Ensuring model behavior matches human values. RLHF helps but values are subjective."),
    @("Cost","Training costs `$10M-`$100M+ per run. Inference at scale requires thousands of GPUs."),
    @("Environmental","A single training run emits ~300 tons CO2. Compute demand doubles every 6-10 months.")
)
for ($i = 0; $i -lt 4; $i++) {
    $cx = 2.5 + ($i % 2) * 14.5
    $cy = 4 + [Math]::Floor($i / 2) * 6.5
    officecli add $FILE "/slide[8]" --type shape --prop "name=#s8-ch-card-$($i+1)" --prop preset=roundRect --prop "fill=$CARD" --prop opacity=0.25 --prop line=none --prop "x=${cx}cm" --prop "y=${cy}cm" --prop width=13cm --prop height=5.5cm 2>$null
    officecli add $FILE "/slide[8]" --type shape --prop "name=#s8-ch-icon-$($i+1)" --prop text=! --prop "font=Segoe UI" --prop size=24 --prop bold=true --prop "color=$GOLD" --prop fill=none --prop line=none --prop "x=$($cx+0.5)cm" --prop "y=$($cy+0.5)cm" --prop width=1.5cm --prop height=1.5cm --prop align=center 2>$null
    officecli add $FILE "/slide[8]" --type shape --prop "name=#s8-ch-title-$($i+1)" --prop "text=$($challenges[$i][0])" --prop "font=Segoe UI" --prop size=20 --prop bold=true --prop "color=$WHITE" --prop fill=none --prop line=none --prop "x=$($cx+2.5)cm" --prop "y=$($cy+0.5)cm" --prop width=9.5cm --prop height=1.5cm --prop align=left 2>$null
    officecli add $FILE "/slide[8]" --type shape --prop "name=#s8-ch-desc-$($i+1)" --prop "text=$($challenges[$i][1])" --prop "font=Segoe UI" --prop size=12 --prop "color=$STEEL" --prop fill=none --prop line=none --prop "x=$($cx+2.5)cm" --prop "y=$($cy+2.2)cm" --prop width=9.5cm --prop height=3cm --prop align=left 2>$null
}

Ghost 8 "#s7-title"
foreach ($k in $kpis7) {
    $n = $k[0].ToLower()
    Ghost 8 "#s7-kpi-name-$n"; Ghost 8 "#s7-kpi-score-$n"; Ghost 8 "#s7-kpi-desc-$n"
}
Add-Notes 8 "CHALLENGES: Hallucination, alignment, cost, and environmental impact. We must discuss limitations honestly to build trustworthy AI."

# ============================================================
# SLIDE 9 -" FUTURE DIRECTIONS
# ============================================================
Write-Host "S9: Future Directions"
Add-Slide 9

$actors9 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","4cm","9.5cm","18cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","1.5cm","2cm","0.06cm","15cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.08","none","10cm","3cm","12cm","10cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.20","none","1.5cm","3cm","30cm","0.6cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.20","none","29cm","2cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","3cm","16cm","3.5cm","3.5cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.5","none","28cm","15cm","1cm","1cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","20cm","2.5cm","0.6cm","0.6cm")
)
foreach ($a in $actors9) {
    Add-Shape 9 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 9 "#s9-title" "Future Directions" "1.5cm" "0.5cm" "30cm" "2.5cm" -size 36 -bold

$futures = @(
    @("AI Agents","LLMs as autonomous agents that plan, use tools, browse the web, and execute multi-step tasks."),
    @("Multimodality","Seamless integration of text, image, video, and audio understanding across all modalities."),
    @("Efficient Architectures","Mixture-of-Experts, sparse attention, distillation, and quantization for smaller, faster models."),
    @("Open-Source Democratization","LLaMA, Mistral, DeepSeek make frontier AI accessible. The gap between open and closed models is narrowing.")
)
for ($i = 0; $i -lt 4; $i++) {
    $cx = 2.5 + ($i % 2) * 15
    $cy = 4 + [Math]::Floor($i / 2) * 6
    officecli add $FILE "/slide[9]" --type shape --prop "name=#s9-future-card-$($i+1)" --prop preset=roundRect --prop "fill=$CARD" --prop opacity=0.25 --prop line=none --prop "x=${cx}cm" --prop "y=${cy}cm" --prop width=13.5cm --prop height=5cm 2>$null
    officecli add $FILE "/slide[9]" --type shape --prop "name=#s9-future-title-$($i+1)" --prop "text=$($futures[$i][0])" --prop "font=Segoe UI" --prop size=20 --prop bold=true --prop "color=$GOLD" --prop fill=none --prop line=none --prop "x=$($cx+1)cm" --prop "y=$($cy+0.5)cm" --prop width=11.5cm --prop height=1.5cm --prop align=left 2>$null
    officecli add $FILE "/slide[9]" --type shape --prop "name=#s9-future-desc-$($i+1)" --prop "text=$($futures[$i][1])" --prop "font=Segoe UI" --prop size=13 --prop "color=$STEEL" --prop fill=none --prop line=none --prop "x=$($cx+1)cm" --prop "y=$($cy+2.2)cm" --prop width=11.5cm --prop height=2.5cm --prop align=left 2>$null
}

Ghost 9 "#s8-title"
for ($i = 1; $i -le 4; $i++) {
    Ghost 9 "#s8-ch-card-$i"; Ghost 9 "#s8-ch-icon-$i"; Ghost 9 "#s8-ch-title-$i"; Ghost 9 "#s8-ch-desc-$i"
}
Add-Notes 9 "FUTURE: AI agents, multimodality, efficient architectures, and open-source democratization. The field is accelerating."

# ============================================================
# SLIDE 10 -" CLOSING  morph
# ============================================================
Write-Host "S10: Closing  morph"
Add-Slide 10 -morph $true

$actors10 = @(
    @("!!scene-bar-gold","rect",$GOLD,"1","none","4cm","10cm","20cm","0.06cm"),
    @("!!scene-bar-navy","rect",$MID_NAVY,"1","none","2cm","3cm","0.06cm","14cm"),
    @("!!scene-frame-gold","roundRect",$GOLD,"0.12","none","7cm","3cm","8cm","6cm"),
    @("!!scene-frame-navy","roundRect",$MID_NAVY,"0.25","none","20cm","12cm","10cm","5cm"),
    @("!!scene-accent-gold","ellipse",$GOLD,"0.20","none","28cm","3cm","3cm","3cm"),
    @("!!scene-accent-steel","ellipse",$STEEL,"0.12","none","2cm","14cm","4cm","4cm"),
    @("!!scene-dot-gold","ellipse",$GOLD,"0.55","none","18cm","16cm","1.2cm","1.2cm"),
    @("!!scene-dot-white","ellipse",$WHITE,"0.25","none","25cm","4cm","0.8cm","0.8cm")
)
foreach ($a in $actors10) {
    Add-Shape 10 $a[0] $a[1] $a[2] $a[3] $a[4] $a[5] $a[6] $a[7] $a[8]
}

Add-Text 10 "#s10-title" "The LLM Revolution is Just Beginning" "3cm" "5cm" "28cm" "3.5cm" -size 44 -bold -color $GOLD -align "center"
Add-Text 10 "#s10-subtitle" "Thank You - Questions and Discussion" "3cm" "11.5cm" "28cm" "2.5cm" -size 24 -align "center"
Add-Text 10 "#s10-footer" "References available upon request - @llm_research - llm-architecture.dev" "3cm" "15.5cm" "28cm" "1.5cm" -size 12 -color $STEEL -align "center"

Ghost 10 "#s9-title"
for ($i = 1; $i -le 4; $i++) {
    Ghost 10 "#s9-future-card-$i"; Ghost 10 "#s9-future-title-$i"; Ghost 10 "#s9-future-desc-$i"
}
Add-Notes 10 'CLOSING: The LLM revolution is just beginning. From the 2017 Transformer to today multimodal models. Thank you and happy to take questions.'

# ============================================================
Write-Host "Closing and validating..."
officecli close $FILE
officecli validate $FILE

Write-Host "=== BUILD COMPLETE ==="
Write-Host "File: $FILE"

