import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.backends.backend_pdf import PdfPages
from PIL import Image

W, H = 13.333, 8.0
DPI = 120
Y_TOP = H - 1.7
Y_BOTTOM = 0.6
LINE = 0.42
SECTION = 0.55

ACCENT = '#2563EB'
DARK = '#1E293B'
GRAY = '#64748B'
GREEN = '#059669'
PURPLE = '#9333EA'
ORANGE = '#D97706'

def new_fig():
    fig = plt.figure(figsize=(W, H), dpi=DPI)
    fig.patch.set_facecolor('white')
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis('off')
    return fig, ax

def header_bar(ax, title, subtitle=None, color=ACCENT):
    ax.add_patch(mpatches.FancyBboxPatch(
        (0, H - 1.0), W, 1.0, boxstyle="round,pad=0",
        facecolor=color, edgecolor='none', zorder=2))
    ax.text(0.5, H - 0.5, title, fontsize=20, fontweight='bold',
            color='white', ha='center', va='center', zorder=3)
    if subtitle:
        ax.text(0.5, H - 1.25, subtitle, fontsize=10, color=GRAY,
                ha='center', va='center', style='italic', zorder=3)

def footer(ax, page_num, total):
    ax.text(W - 0.3, 0.15, f"{page_num}/{total}", fontsize=9,
            color=GRAY, ha='right', va='bottom')

def bullet(ax, x, y, text, size=10, color=DARK, bold_prefix=None):
    if bold_prefix:
        ax.text(x, y, "\u25b8  ", fontsize=size, color=ACCENT, va='top', ha='left')
        ax.text(x + 0.35, y, bold_prefix, fontsize=size, color=color,
                va='top', ha='left', fontweight='bold')
        ax.text(x + 0.35 + 0.02, y, text, fontsize=size, color=color,
                va='top', ha='left')
    else:
        ax.text(x, y, f"\u25b8  {text}", fontsize=size, color=color,
                va='top', ha='left')

total_slides = 9

with PdfPages(r'C:\Users\Windows 11 Pro\Videos\Projects\VideoClassifier\output\FFmpeg_Architecture_Presentation.pdf') as pdf:
    # ---- Slide 1: Title ----
    fig, ax = new_fig()
    ax.add_patch(plt.Rectangle((0, 0), W, H, facecolor=DARK, edgecolor='none'))
    ax.text(W/2, H*0.58, 'FFmpeg Architecture & Internals', fontsize=30,
            fontweight='bold', color='white', ha='center', va='center')
    ax.text(W/2, H*0.48, 'Understanding the Media Swiss Army Knife', fontsize=15,
            color='#94A3B8', ha='center', va='center', style='italic')
    ax.text(W/2, H*0.40, 'With Fracture Project Integration', fontsize=12,
            color=ACCENT, ha='center', va='center')
    ax.text(W/2, 0.8, 'VideoClassifier \u2022 July 2026', fontsize=11,
            color=GRAY, ha='center', va='center')
    footer(ax, 1, total_slides)
    pdf.savefig(fig)

    # ---- Slide 2: What is FFmpeg? ----
    fig, ax = new_fig()
    header_bar(ax, 'What is FFmpeg?', 'The complete, cross-platform multimedia framework')
    y = Y_TOP
    items = [
        'FFmpeg stands for "Fast Forward MPEG"',
        'Founded by Fabrice Bellard in 2000; now the industry-standard media framework',
        'Supports virtually all codecs (H.264/AVC, H.265/HEVC, AV1, VP9, AAC, MP3, FLAC...)',
        'Supports all major containers (MP4, MKV, AVI, MOV, TS, WebM, FLV...)',
        'Cross-platform: Windows, macOS, Linux, BSD, Android, iOS',
        'Licensed under LGPL/GPL; the most widely used multimedia library in the world',
        'Used by every major media player, browser, streaming platform, and video editor',
    ]
    for i, item in enumerate(items):
        bullet(ax, 0.8, y - i * LINE, item, size=10, color=DARK)
    box_y = y - len(items) * LINE - 0.25
    ax.add_patch(mpatches.FancyBboxPatch(
        (0.6, box_y - 0.35), 12.0, 0.50, boxstyle="round,pad=0.05",
        facecolor='#EFF6FF', edgecolor=ACCENT, linewidth=1.5, zorder=1))
    ax.text(1.0, box_y - 0.10, '\u25b8', fontsize=11, va='center', ha='left',
            fontweight='bold', color=ACCENT)
    ax.text(1.5, box_y - 0.10,
            'FFmpeg is the backbone of Fracture \u2014 ffprobe extracts metadata, ffmpeg handles all transcoding',
            fontsize=9, color=DARK, va='center', ha='left')
    footer(ax, 2, total_slides)
    pdf.savefig(fig)

    # ---- Slide 3: Architecture Pipeline Diagram ----
    fig, ax = new_fig()
    header_bar(ax, 'FFmpeg Pipeline Architecture', 'Media flows through a linear chain of processing stages')
    img = Image.open(r'C:\Users\Windows 11 Pro\Videos\Projects\VideoClassifier\output\ffmpeg_arch.png')
    img_w, img_h = img.size
    scale = min((W - 2.8) / img_w, (H - 2.4) / img_h)
    disp_w = img_w * scale
    disp_h = img_h * scale
    x0 = (W - disp_w) / 2
    y0 = (H - 2.0 - disp_h) / 2 + 0.15
    ax.imshow(img, extent=[x0, x0 + disp_w, y0, y0 + disp_h], aspect='auto', zorder=1)
    footer(ax, 3, total_slides)
    pdf.savefig(fig)

    # ---- Slide 4: Component Details -- I/O & Codec ----
    fig, ax = new_fig()
    header_bar(ax, 'Component Details: I/O & Codec Layers', 'libavformat + libavcodec')
    y = Y_TOP
    ax.text(0.8, y, 'libavformat -- Demuxer & Muxer', fontsize=13, fontweight='bold', color=ACCENT)
    y -= (LINE + 0.05)
    for item in [
        'Handles container I/O: reads/writes MP4, MKV, AVI, MOV, TS, FLV, etc.',
        'AVFormatContext is the top-level I/O context; manages streams, packets, metadata',
        'Demuxer: splits container into elementary streams (video, audio, subtitles)',
        'Muxer: interleaves encoded packets into output container',
        'Key structs: AVFormatContext, AVStream, AVPacket, AVIOContext',
    ]:
        bullet(ax, 1.0, y, item, size=9)
        y -= LINE
    y -= SECTION
    ax.text(0.8, y, 'libavcodec -- Encoder & Decoder', fontsize=13, fontweight='bold', color=GREEN)
    y -= (LINE + 0.05)
    for item in [
        'The largest and most complex FFmpeg library: ~500k+ lines of C',
        'Supports H.264, H.265/HEVC, AV1, VP9, MPEG-4, AAC, MP3, FLAC, Opus...',
        'AVCodecContext controls codec parameters; AVCodec defines the codec implementation',
        'Hardware acceleration: NVENC (NVIDIA), AMF (AMD), QSV (Intel), VAAPI, Vulkan',
        'Encoding flow: raw frame \u2192 packetized bitstream \u2192 access units',
        'Decoding flow: AVPacket (compressed) \u2192 AVFrame (raw YUV/RGB/PCM)',
    ]:
        bullet(ax, 1.0, y, item, size=9)
        y -= LINE
    footer(ax, 4, total_slides)
    pdf.savefig(fig)

    # ---- Slide 5: Component Details -- Filters & Processing ----
    fig, ax = new_fig()
    header_bar(ax, 'Component Details: Filters & Processing',
               'libavfilter, libswscale, libswresample, libavutil')
    y = Y_TOP
    ax.text(0.8, y, 'libavfilter -- Filter Graph', fontsize=13, fontweight='bold', color=ORANGE)
    y -= (LINE + 0.05)
    for item in [
        'Graph-based filter processing: buffersink and buffersrc form the filter chain',
        'Scale, crop, rotate, overlay, fade, drawtext, volume, equalizer, trim, concat...',
        'Complex graphs: video and audio filters can be chained in arbitrary topologies',
        'AVFilterGraph manages the complete filter chain; filters linked via AVFilterLink',
    ]:
        bullet(ax, 1.0, y, item, size=9)
        y -= LINE
    y -= SECTION
    ax.text(0.8, y, 'libswscale, libswresample, libavutil', fontsize=13, fontweight='bold', color=PURPLE)
    y -= (LINE + 0.05)
    for item in [
        'libswscale: pixel format conversion (YUV\u2194RGB), image scaling and resizing',
        'libswresample: audio format conversion, sample rate conversion, channel remapping',
        'libavutil: memory management (AVBuffer), math, CRC, hashing, logging, timestamps (AVRational)',
        'libpostproc: older post-processing filters (deblocking, deringing); largely superseded by libavfilter',
    ]:
        bullet(ax, 1.0, y, item, size=9)
        y -= LINE
    footer(ax, 5, total_slides)
    pdf.savefig(fig)

    # ---- Slide 6: Data Flow ----
    fig, ax = new_fig()
    header_bar(ax, 'Data Flow Through FFmpeg Pipeline', 'Step-by-step from input file to output file')
    steps = [
        (1, 'Open Input', 'avformat_open_input() reads the file header and populates AVFormatContext'),
        (2, 'Find Streams', 'avformat_find_stream_info() probes all streams for codec parameters'),
        (3, 'Open Decoder', 'avcodec_open2() initializes the decoder with AVCodecContext'),
        (4, 'Read Packet', 'av_read_frame() reads one AVPacket (compressed data) from the demuxer'),
        (5, 'Decode', 'avcodec_send_packet() + avcodec_receive_frame() decodes packet into raw AVFrame'),
        (6, 'Filter', 'av_buffersrc_add_frame() pushes into filter graph; av_buffersink_get_frame() pulls result'),
        (7, 'Encode', 'avcodec_send_frame() + avcodec_receive_packet() encodes filtered frame to AVPacket'),
        (8, 'Write', 'av_write_frame() writes the encoded packet to the output container via the muxer'),
        (9, 'Cleanup', 'av_write_trailer() finalizes output; all contexts freed with avformat_close_input()'),
    ]
    y = Y_TOP
    for num, title, desc in steps:
        color = ACCENT if num % 2 == 1 else GREEN
        ax.add_patch(mpatches.FancyBboxPatch(
            (0.6, y - 0.48), W - 1.2, 0.50, boxstyle="round,pad=0.05",
            facecolor='white', edgecolor=color, linewidth=1.2, zorder=1))
        ax.text(0.9, y - 0.12, f'{num}.', fontsize=10, fontweight='bold',
                color=color, va='center', ha='left')
        ax.text(1.3, y - 0.12, title, fontsize=10, fontweight='bold',
                color=DARK, va='center', ha='left')
        ax.text(3.2, y - 0.12, desc, fontsize=9, color=GRAY,
                va='center', ha='left')
        y -= 0.58
    footer(ax, 6, total_slides)
    pdf.savefig(fig)

    # ---- Slide 7: Fracture + FFmpeg ----
    fig, ax = new_fig()
    header_bar(ax, 'Fracture Project: FFmpeg Integration',
               'How VideoClassifier leverages FFmpeg for video understanding')
    mid = W / 2
    col_w = mid - 1.0
    # Left column: ffprobe
    ax.add_patch(mpatches.FancyBboxPatch(
        (0.6, Y_BOTTOM + 0.1), col_w, Y_TOP - Y_BOTTOM + 0.1,
        boxstyle="round,pad=0.1", facecolor='#F0F9FF', edgecolor=ACCENT, linewidth=1.5, zorder=1))
    ax.text(0.8, Y_TOP - 0.15, 'ffprobe Usage', fontsize=12, fontweight='bold', color=ACCENT)
    y = Y_TOP - 0.55
    for item in [
        'Fracture calls ffprobe via subprocess for every input video',
        'Extracts: duration, codec, resolution, bitrate, FPS, pixel format',
        'Parses JSON output into a structured metadata dictionary',
        'Fields: width, height, codec_name, r_frame_rate, duration, bit_rate',
        'Probes both video and audio streams independently',
        'Metadata used for filtering, logging, and downstream CLIP analysis',
    ]:
        bullet(ax, 1.0, y, item, size=9)
        y -= LINE
    # Right column: CLIP
    ax.add_patch(mpatches.FancyBboxPatch(
        (mid + 0.3, Y_BOTTOM + 0.1), col_w, Y_TOP - Y_BOTTOM + 0.1,
        boxstyle="round,pad=0.1", facecolor='#F0FDF4', edgecolor=GREEN, linewidth=1.5, zorder=1))
    ax.text(mid + 0.5, Y_TOP - 0.15, 'CLIP Embedding Pipeline', fontsize=12, fontweight='bold', color=GREEN)
    y = Y_TOP - 0.55
    for item in [
        'Extracts frames from video using OpenCV VideoCapture',
        'Resizes to 224x224 and normalizes using ImageNet statistics',
        'Feeds frames through CLIP ViT-B/32 vision encoder',
        'Generates 512-dimensional embedding vectors per frame',
        'Full frame extraction runs ffmpeg subprocess (quality, fps control)',
        'Embeddings stored as .npy files per video for similarity search',
    ]:
        bullet(ax, mid + 0.7, y, item, size=9)
        y -= LINE
    footer(ax, 7, total_slides)
    pdf.savefig(fig)

    # ---- Slide 8: CLI Tools ----
    fig, ax = new_fig()
    header_bar(ax, 'FFmpeg Command-Line Tools',
               'ffmpeg, ffprobe, ffplay -- the three pillars of the FFmpeg ecosystem')
    tools = [
        ('ffmpeg', ACCENT, 'The main transcoding CLI. Convert, filter, trim, concat, stream.',
         ['ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4',
          'ffmpeg -i input.mp4 -vf "scale=1280:720,drawtext=text=\'Hello\':fontsize=24" output.mp4',
          'ffmpeg -i input.mp4 -ss 00:01:00 -t 30 -c copy clip.mp4']),
        ('ffprobe', GREEN, 'Multimedia stream analyzer. Probes containers, streams, packets.',
         ['ffprobe -v quiet -print_format json -show_format -show_streams input.mp4',
          'ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate input.mp4',
          'ffprobe -v error -count_frames -show_entries stream=nb_read_frames input.mp4']),
        ('ffplay', PURPLE, 'Portable media player built on FFmpeg + SDL.',
         ['ffplay input.mp4',
          'ffplay -vf "eq=brightness=0.1:saturation=1.5" input.mkv',
          'ffplay -f lavfi -i "rgbtestsrc=size=1920x1080:rate=30"']),
    ]
    y = Y_TOP
    for name, color, desc, examples in tools:
        box_h = 1.55
        ax.add_patch(mpatches.FancyBboxPatch(
            (0.6, y - box_h + 0.15), W - 1.2, box_h,
            boxstyle="round,pad=0.08", facecolor='white', edgecolor=color, linewidth=1.5, zorder=1))
        ax.text(1.0, y - 0.15, name, fontsize=13, fontweight='bold', color=color, va='center')
        ax.text(2.8, y - 0.15, desc, fontsize=9, color=GRAY, va='center')
        for i, ex in enumerate(examples):
            bx_x = 1.2
            bx_y = y - 0.65 - i * 0.35
            ax.text(bx_x, bx_y, f'$ {ex}', fontsize=7.5, color=DARK, va='top',
                    family='monospace',
                    bbox=dict(boxstyle='round,pad=0.15', facecolor='#F1F5F9', edgecolor='none'))
        y -= 1.85
    footer(ax, 8, total_slides)
    pdf.savefig(fig)

    # ---- Slide 9: Summary ----
    fig, ax = new_fig()
    ax.add_patch(plt.Rectangle((0, 0), W, H, facecolor=DARK, edgecolor='none'))
    ax.text(W/2, H*0.72, 'Key Takeaways', fontsize=22, fontweight='bold',
            color='white', ha='center', va='center')
    ax.text(W/2, H*0.62, 'FFmpeg is the industry-standard multimedia framework powering Fracture',
            fontsize=11, color='#94A3B8', ha='center', va='center')
    y = H * 0.52
    for point in [
        'Pipeline: Input \u2192 Demux \u2192 Decode \u2192 Filter \u2192 Encode \u2192 Mux \u2192 Output',
        'Core libraries: libavformat, libavcodec, libavfilter, libswscale, libswresample',
        'Fracture uses ffprobe for video metadata extraction',
        'Fracture uses ffmpeg and OpenCV for frame extraction and CLIP embedding pipeline',
        'Cross-platform, open-source, and infinitely extensible',
    ]:
        ax.text(W/2, y, f'\u2726  {point}', fontsize=10, color='white',
                ha='center', va='center')
        y -= 0.40
    ax.text(W/2, 0.65, 'Built by the Fracture Team  \u2022  July 2026', fontsize=10,
            color=GRAY, ha='center', va='center')
    ax.text(W/2, 0.35, 'Thank you', fontsize=18, fontweight='bold',
            color=ACCENT, ha='center', va='center')
    footer(ax, 9, total_slides)
    pdf.savefig(fig)

print("Presentation PDF generated successfully!")
print(f"Total slides: {total_slides}")
