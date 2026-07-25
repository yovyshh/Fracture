import { useState, useRef, useEffect } from 'react';
import { Sidebar, type PageType } from './components/Sidebar';
import { Download, Save, RotateCcw, FolderOpen, Copy, Trash2, CheckCircle, FileVideo, DownloadCloud, Info, Layers, Scissors, Cpu, Network, Sun, Moon, Palette, Monitor, ExternalLink, Github, Heart, Coffee, Minus, Maximize, X, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { SelectVideo, ServeVideo, SelectSavePath, ExportTimeline, SaveExportRecord, GetHistory, GetSceneClusters, GenerateThumbnails, OpenConfigFolder } from "../wailsjs/go/main/App";
import { WindowMinimise, WindowToggleMaximise, Quit, EventsOn } from "../wailsjs/runtime/runtime";

type ClipData = { id: string, timeOffset: number, clusterNum: string | number, thumbUrl?: string, clipUrl?: string };

type ExportRecord = {
  videoName: string;
  outputPath: string;
  clipCount: number;
  timeOffsets: number[];
  date: string;
  status: string;
  duration: string;
};

type SettingsTab = "general" | "clustering" | "hardware" | "export";
type ThemeId = "moonlight" | "amethyst" | "frost" | "ember";

const THEMES: { id: ThemeId; name: string; icon: typeof Sun; desc: string }[] = [
  { id: "moonlight", name: "Moonlight", icon: Moon, desc: "Deep dark with violet accent" },
  { id: "amethyst", name: "Amethyst", icon: Palette, desc: "Rich purple undertones" },
  { id: "frost", name: "Frost", icon: Monitor, desc: "Cool blue steel" },
  { id: "ember", name: "Ember", icon: Sun, desc: "Warm amber glow" },
];

function applyTheme(theme: ThemeId) {
  document.documentElement.classList.remove("theme-moonlight", "theme-amethyst", "theme-frost", "theme-ember");
  document.documentElement.classList.add(`theme-${theme}`);
}

function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "moonlight";
  return (localStorage.getItem("fracture-theme") as ThemeId) || "moonlight";
}

function getStoredFont(): string {
  if (typeof window === "undefined") return "JetBrains Mono";
  return localStorage.getItem("fracture-font") || "JetBrains Mono";
}

function getStoredSettings(): Record<string, any> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("fracture-settings") || "{}"); } catch { return {}; }
}

// ── helpers ──
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/** Scene tile: JPEG thumb + hover triggers main-player preview */
function MediaClip({ thumbUrl, timeOffset, clusterNum, onClick, onPreview }: {
  thumbUrl?: string;
  timeOffset: number;
  clusterNum: string | number;
  onClick: () => void;
  onPreview?: (t: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onPreview?.(timeOffset);
        onClick();
      }}
      onMouseEnter={() => { setIsHovered(true); onPreview?.(timeOffset); }}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative aspect-video bg-card border border-border rounded-lg overflow-hidden hover:border-primary cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.03]"
    >
      <div className="absolute inset-0 bg-black">
        {thumbUrl ? (
          <img src={thumbUrl} alt={`Scene ${formatTime(timeOffset)}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all z-10 ${isHovered ? 'opacity-20 scale-105' : 'opacity-90'}`}
            loading="lazy" draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-muted/40 animate-pulse z-10" />
        )}
        {isHovered && (
          <div className="absolute inset-0 z-20 flex items-center justify-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/90 flex items-center justify-center animate-pulse">
              <span className="text-white text-[10px] font-bold">▶</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">preview</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-30" />
      </div>
      <div className="absolute top-1 right-1 z-10 pointer-events-none">
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-md ${clusterNum === 'Noise' ? 'bg-destructive/80 text-white' : 'bg-black/60 text-white'}`}>
          {clusterNum === 'Noise' ? 'N' : `C${clusterNum}`}
        </span>
      </div>
      <div className="absolute bottom-1 right-1 z-10 pointer-events-none">
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-md bg-black/60 text-white shadow-sm border border-white/10">
          {formatTime(timeOffset)}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════ APP ═══════════════════════

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("main");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string>("All");
  const [curatedClips, setCuratedClips] = useState<ClipData[]>([]);
  const [scenes, setScenes] = useState<ClipData[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ExportRecord[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const previewClipRef = useRef<HTMLVideoElement>(null);

  // Import progress
  const [importProgress, setImportProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    return EventsOn("import-progress", (d: any) => {
      const p = typeof d === "string" ? JSON.parse(d) : d;
      const pct = p.pct ?? 0;
      setImportProgress(p);
      setShowProgress(pct < 100);
      if (pct >= 100) {
        setTimeout(() => { setShowProgress(false); setImportProgress(null); }, 600);
      }
    });
  }, []);

  // Theme state
  const [savedTheme, setSavedTheme] = useState<ThemeId>(getStoredTheme);
  const [savedFontFamily, setSavedFontFamily] = useState<string>(getStoredFont);
  const [savedSettings, setSavedSettings] = useState<Record<string, any>>(getStoredSettings);
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [fontFamily, setFontFamily] = useState<string>(getStoredFont);

  // Settings state (persisted)
  const [settings, setSettings] = useState<Record<string, any>>(getStoredSettings);
  const set = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));
  const s = (key: string, fallback: any) => settings[key] ?? fallback;
  const unsavedChanges = theme !== savedTheme || fontFamily !== savedFontFamily || JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // Applies theme + font on mount + toggle
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    const stack: Record<string, string> = {
      "JetBrains Mono": '"JetBrains Mono", monospace',
      "Fira Code": '"Fira Code", "Cascadia Code", monospace',
      "Inter": '"Inter", "SF Pro", system-ui, sans-serif',
      "SF Mono": '"SF Mono", "SF Pro", "Menlo", monospace',
    };
    const css = stack[fontFamily] || stack["JetBrains Mono"];
    document.documentElement.style.setProperty("--font-sans", css);
    document.documentElement.style.setProperty("--font-mono", css);
  }, [fontFamily]);

  // ── History ──
  const loadHistory = async () => {
    try {
      const json = await GetHistory();
      setHistoryRecords(json ? JSON.parse(json) : []);
    } catch { setHistoryRecords([]); }
  };

  // ── Import ──
  const importVideo = async () => {
    if (isProcessing) return;
    try {
      const path = await SelectVideo();
      if (!path) return;
      setIsProcessing(true);
      setShowProgress(true);
      setImportProgress({ pct: 0, stage: "Loading video..." });

      // 1) Start video stream — instant
      const streamUrl = await ServeVideo(path);
      setVideoUrl(streamUrl);
      setVideoPath(path);
      setScenes([]);
      setCuratedClips([]);
      setActiveCluster("All");
      setImportProgress({ pct: 5, stage: "Video loaded" });

      // 2) Fast keyframe scene detect
      setImportProgress({ pct: 10, stage: "Detecting scenes..." });
      let detectedScenes: ClipData[] = [];
      try {
        const scenesJson = await GetSceneClusters(path);
        detectedScenes = JSON.parse(scenesJson).map((s: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          timeOffset: s.timeOffset,
          clusterNum: s.clusterNum,
          clipUrl: s.clipUrl,
        }));
      } catch {
        detectedScenes = [];
      }
      if (detectedScenes.length === 0) {
        detectedScenes = Array.from({length:24},(_,i)=>({id:Math.random().toString(36).substring(2,9),timeOffset:i*5,clusterNum:String(i%3)}));
      }
      setScenes(detectedScenes);
      setImportProgress({ pct: 35, stage: `${detectedScenes.length} scenes detected` });

      // 3) Generate thumbnails — backend emits 40%→100% events
      setImportProgress({ pct: 38, stage: "Generating thumbnails..." });
      const offsets = detectedScenes.map(s => s.timeOffset);
      try {
        const thumbsJson = await GenerateThumbnails(path, offsets);
        const thumbs: { timeOffset: number; url: string }[] = JSON.parse(thumbsJson);
        const byOffset = new Map(thumbs.map(t => [t.timeOffset, t.url]));
        setScenes(prev => prev.map(s => ({ ...s, thumbUrl: byOffset.get(s.timeOffset) || s.thumbUrl })));
      } catch { /* thumbs optional */ }

      setIsProcessing(false);
      toast.success(`Import complete — ${detectedScenes.length} scenes`);
    } catch (err: any) {
      setIsProcessing(false);
      setShowProgress(false);
      setImportProgress(null);
      toast.error(`Import failed: ${err.message || err}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // For drag & drop the Go backend needs the path — we use the import flow
    await importVideo();
  };

  const seekMainPreview = (t: number) => {
    const v = previewClipRef.current;
    if (!v) return;
    const go = () => {
      try { v.currentTime = Math.max(0, t); v.muted = true; v.play().catch(() => {}); } catch { /* ignore */ }
    };
    if (v.readyState >= 1) go();
    else v.addEventListener('loadedmetadata', go as EventListener, { once: true });
  };

  const handleClipSelect = (clip: ClipData) => {
    setSelectedClip(clip);
    // make sure preview is visible
    setShowPreviewPanel(true);
    // after render, seek preview to this clip
    setTimeout(() => {
      const v = previewClipRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, clip.timeOffset);
      v.play().catch(() => {});
    }, 50);
  };

  const handleAddToTimeline = (timeOffset: number, clusterNum: string | number, thumbUrl?: string) => {
    setCuratedClips(prev => [...prev, { id: crypto.randomUUID(), timeOffset, clusterNum, thumbUrl }]);
    toast.success(`Added at ${formatTime(timeOffset)}`);
  };

  const handleRemoveFromTimeline = (id: string) => {
    setCuratedClips(prev => prev.filter(c => c.id !== id));
  };

  const handleClearTimeline = () => { setCuratedClips([]); };

  const handleDiscardSettings = () => {
    setTheme(savedTheme);
    setFontFamily(savedFontFamily);
    setSettings(savedSettings);
    toast.error("You did not save changes");
  };

  const handleMinimize = () => WindowMinimise();
  const handleMaximize = () => WindowToggleMaximise();
  const handleClose = () => Quit();

  const handlePageChange = (page: PageType) => {
    if (currentPage === "settings" && page !== "settings" && unsavedChanges) {
      handleDiscardSettings();
    }
    setCurrentPage(page);
    if (page === "history") loadHistory();
  };

  // ── Settings save/reset ──
  const handleSaveSettings = () => {
    const all = { ...settings, fontFamily, theme };
    localStorage.setItem("fracture-settings", JSON.stringify(all));
    localStorage.setItem("fracture-theme", theme);
    localStorage.setItem("fracture-font", fontFamily);
    setSavedTheme(theme);
    setSavedFontFamily(fontFamily);
    setSavedSettings(settings);
    toast.success("Settings saved");
  };
  const handleResetSettings = () => {
    setTheme("moonlight");
    setFontFamily("JetBrains Mono");
    setSettings({});
    toast.success("Defaults loaded — click Save Changes to keep them");
  };
  const handleOpenConfig = async () => {
    try {
      const path = await OpenConfigFolder();
      toast.success(`Opened config: ${path}`);
    } catch (err: any) {
      toast.error(`Couldn't open config: ${err?.message || err}`);
    }
  };

  // ── Export ──
  const handleExport = async () => {
    if (curatedClips.length === 0) { toast.error("Timeline is empty!"); return; }
    if (!videoPath) { toast.error("No video imported."); return; }
    try {
      const base = videoPath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'export';
      const savePath = await SelectSavePath(`${base}_export.mp4`);
      if (!savePath) return;
      const toastId = toast.loading(`Exporting MP4 (${curatedClips.length} clips)…`);
      const offsets = curatedClips.map(c => c.timeOffset);
      const outputPath = await ExportTimeline(videoPath, offsets, savePath);
      try { await SaveExportRecord(videoPath, outputPath, offsets, `${curatedClips.length} clips`); loadHistory(); } catch {}
      toast.success(`Export complete!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || err}`);
    }
  };

  const pipelineSteps = [
    { name: "Import", icon: DownloadCloud, active: true },
    { name: "Detect", icon: Scissors, active: videoPath !== null },
    { name: "Cluster", icon: Network, active: videoPath !== null && !isProcessing },
    { name: "Curate", icon: Layers, active: videoPath !== null && !isProcessing },
    { name: "Export", icon: Save, active: false },
  ];

  // ════════════ PAGES ════════════

  const renderHome = () => (
    <div className="w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Pipeline */}
      <div className="flex flex-col items-center gap-6 mb-8 mt-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Fracture</h1>
          <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold font-mono border border-primary/20">v1.0.0</span>
        </div>
        <div className="flex items-center justify-center gap-2 max-w-4xl w-full px-4">
          {pipelineSteps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div className={`flex flex-col items-center gap-2 ${step.active ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${step.active ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'border-border bg-card'}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-center">{step.name}</span>
              </div>
              {index < pipelineSteps.length - 1 && (<div className={`w-12 h-0.5 mx-2 rounded-full transition-colors duration-500 ${step.active ? 'bg-primary/50' : 'bg-border'}`} />)}
            </div>
          ))}
        </div>
      </div>

      {!videoPath ? (
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            <div onClick={importVideo} onDragOver={handleDragOver} onDrop={handleDrop}
              className="w-full aspect-video border-2 border-dashed border-border rounded-2xl bg-card hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 flex items-center justify-center cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden"
            >
              <div className="flex flex-col items-center gap-4 text-muted-foreground group-hover:text-primary transition-colors duration-300 z-10">
                <div className="p-4 bg-background border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors duration-300 rounded-full">
                  <DownloadCloud className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-lg">Import Video</p>
                  <p className="text-sm opacity-70">Click to select from your computer</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Controls */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3 shadow-sm shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono font-bold uppercase tracking-wider mr-2">Clusters:</span>
              {(() => {
                const uniqueClusters = [...new Set(scenes.map(s => String(s.clusterNum)))];
                return ["All", ...uniqueClusters.sort()].map(cluster => (
                  <button key={cluster} onClick={() => setActiveCluster(cluster)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${activeCluster === cluster ? 'bg-primary text-white shadow-md shadow-primary/20' : cluster === 'Noise' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'}`}
                  >{cluster}</button>
                ));
              })()}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button onClick={importVideo} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded border border-border transition-colors flex items-center gap-1.5">
                <DownloadCloud className="w-3 h-3" /> New Video
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-muted-foreground font-mono text-xs">
                <span>eps: 0.35</span>
                <div className="w-px h-3 bg-border" />
                <span>min: 2</span>
              </div>
            </div>
          </div>

          {/* Preview panel (toggleable) */}
          {videoUrl && showPreviewPanel && (
            <div className="shrink-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm relative group">
              <video ref={previewClipRef} key={selectedClip?.clipUrl || videoUrl} src={selectedClip?.clipUrl || videoUrl}
                className="w-full max-h-40 bg-black object-contain"
                muted autoPlay preload="auto"
                onLoadedMetadata={() => {
                  if (selectedClip && previewClipRef.current) {
                    previewClipRef.current.currentTime = selectedClip.timeOffset;
                  }
                }}
              />
              <button onClick={() => setShowPreviewPanel(false)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded flex items-center justify-center text-white text-[10px] hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 z-10"
              >✕</button>
              {selectedClip && (
                <div className="absolute bottom-1 left-1 z-10">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                    Clip {formatTime(selectedClip.timeOffset)}
                  </span>
                </div>
              )}
            </div>
          )}
          {videoUrl && !showPreviewPanel && (
            <button onClick={() => setShowPreviewPanel(true)}
              className="shrink-0 w-full py-2 bg-card border border-border rounded-xl flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ▶ Show Preview
            </button>
          )}

          {/* Scene grid */}
          <div className="flex-1 bg-background border border-border rounded-xl overflow-y-auto p-4 shadow-inner relative">
            {showProgress && importProgress ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background/90 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-4 max-w-sm w-full px-8">
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress.pct}%` }}
                    />
                  </div>
                  {/* Percentage */}
                  <span className="text-3xl font-bold font-mono tabular-nums text-primary">{importProgress.pct}%</span>
                  {/* Stage text */}
                  <p className="font-mono text-sm text-muted-foreground animate-pulse">{importProgress.stage}</p>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="font-mono text-sm text-primary animate-pulse">Detecting keyframes…</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {scenes.map(scene => {
                  if (activeCluster !== "All" && activeCluster !== String(scene.clusterNum)) return null;
                  return (
                    <MediaClip key={scene.id} thumbUrl={scene.thumbUrl} timeOffset={scene.timeOffset}
                      clusterNum={scene.clusterNum}
                      onPreview={seekMainPreview}
                      onClick={() => {
                        handleClipSelect(scene);
                        handleAddToTimeline(scene.timeOffset, scene.clusterNum, scene.thumbUrl);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="h-32 bg-card border border-border rounded-xl p-3 flex flex-col shrink-0 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground font-mono font-bold uppercase tracking-wider">Curated Timeline</span>
              <div className="flex gap-2">
                <button onClick={handleClearTimeline} className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded border border-border transition-colors">Clear</button>
                <button onClick={handleExport} className="px-4 py-1 bg-primary text-white text-xs font-bold rounded shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <Download className="w-3 h-3" /> Lossless MP4 Export
                </button>
              </div>
            </div>
            <div className="flex-1 bg-background border border-border rounded-lg flex items-center px-2 gap-2 overflow-x-auto">
              {!isProcessing && curatedClips.map(clip => (
                <div key={clip.id} className="h-16 w-24 shrink-0 bg-black border border-border rounded flex items-center justify-center hover:border-primary transition-colors relative group overflow-hidden">
                  {clip.thumbUrl ? <img src={clip.thumbUrl} alt="" className="w-full h-full object-cover opacity-70" draggable={false} /> : <div className="w-full h-full bg-muted/30" />}
                  <div className="absolute bottom-1 right-1 text-[8px] font-mono font-bold px-1 py-0.5 rounded backdrop-blur-md bg-black/60 text-white z-10">{formatTime(clip.timeOffset)}</div>
                  <button onClick={() => handleRemoveFromTimeline(clip.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] hover:scale-110 transition-all z-20"
                  >✕</button>
                </div>
              ))}
              <div className="h-16 flex-1 min-w-[200px] border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground/50 text-xs font-mono">
                {curatedClips.length === 0 ? "Click scenes above to add" : "Add more scenes"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── HISTORY ──
  const renderHistory = () => (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Export History</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{historyRecords.length} export{historyRecords.length !== 1 ? 's' : ''}</span>
          <button onClick={loadHistory} className="h-9 px-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        {historyRecords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <FileVideo className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No exports yet</p>
              <p className="text-xs opacity-70">Completed exports will appear here</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Video</th>
                  <th className="px-4 py-3 font-medium">Clips</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyRecords.map((rec, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <FileVideo className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                      {rec.videoName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{rec.clipCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rec.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-green-500/10 text-green-500">{rec.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={async () => { try { await navigator.clipboard.writeText(rec.outputPath); toast.success("Path copied"); } catch {} }}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      ><FolderOpen className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── THEME PREVIEW TILE ──
  const ThemeCard = ({ id, name, icon: Icon, desc, current }: { id: ThemeId; name: string; icon: typeof Sun; desc: string; current: boolean }) => (
    <button onClick={() => setTheme(id)}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${current ? 'border-primary bg-primary/5 shadow-md shadow-primary/20' : 'border-border bg-card hover:border-muted-foreground/50'}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${current ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-bold">{name}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{desc}</span>
      {current && <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
    </button>
  );

  // ── SETTINGS ──
  const renderSettings = () => {
    const tabs: { id: SettingsTab; label: string }[] = [
      { id: "general", label: "General" },
      { id: "clustering", label: "Clustering" },
      { id: "hardware", label: "Hardware" },
      { id: "export", label: "Export" },
    ];

    return (
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <div className="flex items-center gap-3">
            <button onClick={handleOpenConfig} className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
              <FolderOpen className="w-4 h-4" /> Open Config
            </button>
            <button onClick={handleResetSettings} className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive hover:border-destructive/30">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSaveSettings} className="h-9 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>

        <div className="flex items-start gap-12 flex-1 min-h-0 overflow-hidden">
          <div className="w-48 flex flex-col gap-1 shrink-0">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setSettingsTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${settingsTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >{t.label}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-4 pb-12 space-y-8">
            {/* ── GENERAL ── */}
            {settingsTab === "general" && (
              <>
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">Appearance</h3>
                  <div className="space-y-4">
                    <label className="text-sm font-medium block">Theme</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {THEMES.map(t => <ThemeCard key={t.id} {...t} current={theme === t.id} />)}
                    </div>
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">Application Preferences</h3>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Default Export Path</label>
                      <div className="flex items-center gap-2">
                        <input type="text" value={s("exportPath", "~Videos/Fracture/Output")} onChange={e => set("exportPath", e.target.value)} className="h-10 flex-1 bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                        <button className="h-10 px-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors"><FolderOpen className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Font Family</label>
                      <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary">
                        <option>JetBrains Mono</option>
                        <option>Fira Code</option>
                        <option>Inter</option>
                        <option>SF Mono</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Language</label>
                      <select value={s("language", "English")} onChange={e => set("language", e.target.value)} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary">
                        <option>English</option>
                        <option>日本語</option>
                        <option>中文</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Auto Save History</label>
                      <div className="flex items-center gap-3 h-10">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={s("autoSave", true)} onChange={e => set("autoSave", e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                        </label>
                        <span className="text-sm text-muted-foreground">Save exports to history automatically</span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ── CLUSTERING ── */}
            {settingsTab === "clustering" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">DBSCAN Parameters</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">EPS (Epsilon)</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0.05" max="1.0" step="0.05" value={s("eps", 0.35)} onChange={e => set("eps", parseFloat(e.target.value))} className="flex-1 accent-primary" />
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{s("eps", 0.35)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Lower = tighter clusters. Higher = broader groups.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Min Samples</label>
                    <input type="number" min={1} max={20} value={s("minSamples", 2)} onChange={e => set("minSamples", parseInt(e.target.value) || 2)} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                    <p className="text-xs text-muted-foreground">Minimum scenes to form a cluster.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Scene Threshold</label>
                    <input type="number" step="0.05" defaultValue={0.30} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                    <p className="text-xs text-muted-foreground">Sensitivity for scene change detection.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Max Gap Between Clips (s)</label>
                    <input type="number" defaultValue={3} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                    <p className="text-xs text-muted-foreground">Merge clips if gap is below this.</p>
                  </div>
                </div>
              </section>
            )}

            {/* ── HARDWARE ── */}
            {settingsTab === "hardware" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">Hardware Acceleration</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">GPU Acceleration</label>
                    <div className="flex items-center gap-3 h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={s("gpuAccel", false)} onChange={e => set("gpuAccel", e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                      </label>
                      <span className="text-sm text-muted-foreground">CUDA / NVENC</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Requires NVIDIA GPU with CUDA drivers.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">FFmpeg Path</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={s("ffmpegPath", "C:\\ffmpeg\\bin\\ffmpeg.exe")} onChange={e => set("ffmpegPath", e.target.value)} className="h-10 flex-1 bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                      <button className="h-10 px-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors"><FolderOpen className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground">Custom FFmpeg binary location.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Max Threads</label>
                    <input type="number" min={1} max={64} defaultValue={8} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                    <p className="text-xs text-muted-foreground">Parallel decode threads (0 = auto).</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Cache Thumbnails</label>
                    <div className="flex items-center gap-3 h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={s("cacheThumbs", true)} onChange={e => set("cacheThumbs", e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                      </label>
                      <span className="text-sm text-muted-foreground">Reuse cached thumbnails on reimport</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Saves space but speeds up repeat imports.</p>
                  </div>
                </div>
              </section>
            )}

            {/* ── EXPORT ── */}
            {settingsTab === "export" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">Export Preferences</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Output Format</label>
                    <div className="flex gap-2">
                      {["MP4 (H.264)", "MP4 (H.265/HEVC)", "MKV", "WebM"].map(f => (
                        <button key={f} className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${f === "MP4 (H.264)" ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-muted-foreground'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Quality Preset</label>
                    <select className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary">
                      <option>Lossless (copy)</option>
                      <option>High (CRF 18)</option>
                      <option>Medium (CRF 23)</option>
                      <option>Low (CRF 28)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Crossfade Duration</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0" max="1000" step="50" value={s("crossfade", 300)} onChange={e => set("crossfade", parseInt(e.target.value))} className="flex-1 accent-primary" />
                      <span className="text-xs font-mono text-muted-foreground w-14 text-right">{s("crossfade", 300)}ms</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Transition length between clips (0 = cuts only).</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Auto-Clean Frames</label>
                    <div className="flex items-center gap-3 h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={s("autoClean", true)} onChange={e => set("autoClean", e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                      </label>
                      <span className="text-sm text-muted-foreground">Remove black/white frames</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Analyzes and strips solid color frames during export.</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── LOGS ──
  const renderLogs = () => {
    const logLines = [
      { time: "20:01:37", level: "info", msg: "Fracture UI initialized. v1.0.0", color: "text-blue-400", icon: Info },
      { time: "20:01:37", level: "info", msg: "WebView2 environment created successfully.", color: "text-blue-400", icon: Info },
      { time: "20:01:37", level: "info", msg: "Media server starting on localhost:34115", color: "text-blue-400", icon: Info },
      { time: "20:01:37", level: "success", msg: "Ready to import media. FFmpeg detected at C:\\ffmpeg\\bin", color: "text-green-400", icon: CheckCircle },
      { time: "20:01:39", level: "info", msg: "ServeVideo: streaming range requests active", color: "text-blue-400", icon: Info },
      { time: "20:01:40", level: "success", msg: "Keyframe scene detection via ffprobe (fast path)", color: "text-green-400", icon: CheckCircle },
      { time: "20:01:40", level: "info", msg: "Thumbnail generation offloaded to background", color: "text-muted-foreground", icon: Info },
      { time: "20:01:41", level: "warn", msg: "Export engineered for stream-copy concat (no re-encode)", color: "text-yellow-400", icon: Info },
    ];

    return (
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Debug Logs</h2>
          <div className="flex items-center gap-3">
            <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Auto-Refresh
            </button>
            <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
              <Copy className="w-4 h-4" /> Copy All
            </button>
            <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="h-9 px-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-2 text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl flex-1 p-5 overflow-y-auto font-mono text-sm leading-relaxed shadow-inner">
          {logLines.map((line, i) => (
            <div key={i} className="flex items-start gap-3 text-muted-foreground mb-2 group">
              <span className="shrink-0 opacity-50 text-xs mt-0.5">{line.time}</span>
              <line.icon className={`w-4 h-4 shrink-0 mt-0.5 ${line.color}`} />
              <span className="break-all">{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── DOWNLOADS ──
  const renderDownloads = () => (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Downloads</h2>
        <span className="text-sm text-muted-foreground">3 completed, 0 active</span>
      </div>
      <div className="bg-card border border-border rounded-xl flex-1 p-6 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <DownloadCloud className="w-12 h-12 opacity-30" />
        <p className="text-sm font-medium">No download queue</p>
        <p className="text-xs opacity-70">Exported files can be managed here in future releases</p>
      </div>
    </div>
  );

  // ── ABOUT ──
  const renderAbout = () => (
    <div className="w-full h-full flex flex-col gap-8 animate-in fade-in duration-200 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Scissors className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fracture</h2>
          <p className="text-sm text-muted-foreground">Video Scene Splitter &middot; v1.0.0</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Overview</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Fracture is a desktop application for quickly splitting videos into scenes, 
            clustering them visually, and exporting curated timelines — all without re-encoding.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> Tech Stack</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Wails v2 / Go backend</li>
            <li>• React / Vite / TypeScript</li>
            <li>• FFmpeg / ffprobe</li>
            <li>• Tailwind CSS v4</li>
          </ul>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Github className="w-4 h-4 text-primary" /> Repository</h3>
          <p className="text-sm text-muted-foreground">github.com/yovyshh/Fracture</p>
          <button onClick={() => { try { navigator.clipboard.writeText("https://github.com/yovyshh/Fracture"); toast.success("URL copied"); } catch {} }}
            className="text-xs text-primary hover:underline mt-1"
          >Copy URL</button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary" /> Links</h3>
          <div className="flex flex-col gap-2 text-sm">
            <button onClick={() => setCurrentPage("donate")} className="text-left text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5" /> Support the project
            </button>
            <button onClick={() => setCurrentPage("settings")} className="text-left text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Customize Fracture
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <h3 className="font-semibold flex items-center gap-2"><Heart className="w-4 h-4 text-destructive" /> License</h3>
        <p className="text-sm text-muted-foreground">MIT License &mdash; free to use, modify, and distribute.</p>
      </div>
    </div>
  );

  // ── DONATE ──
  const renderDonate = () => (
    <div className="w-full h-full flex flex-col gap-8 animate-in fade-in duration-200 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <Coffee className="w-7 h-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Support Fracture</h2>
          <p className="text-sm text-muted-foreground">If this tool saves you time, consider buying a coffee</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4 text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Coffee className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Buy Me a Coffee</h3>
            <p className="text-xs text-muted-foreground mt-1">One-time support via Ko-fi</p>
          </div>
          <button className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">Support</button>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4 text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Github className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Sponsor on GitHub</h3>
            <p className="text-xs text-muted-foreground mt-1">Recurring sponsorship</p>
          </div>
          <button className="mt-2 px-4 py-2 bg-card border border-border text-sm rounded-lg hover:bg-muted transition-colors">Sponsor</button>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4 text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Contribute</h3>
            <p className="text-xs text-muted-foreground mt-1">Open issues, PRs welcome</p>
          </div>
          <button className="mt-2 px-4 py-2 bg-card border border-border text-sm rounded-lg hover:bg-muted transition-colors">View on GitHub</button>
        </div>
      </div>
    </div>
  );

  const renderWindowControls = () => (
    <div
      className="absolute top-3 right-3 z-20 flex items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity duration-300"
      style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
    >
      <button
        onClick={() => setCurrentPage("settings")}
        className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Open settings"
      >
        <SlidersHorizontal className="w-3 h-3" />
      </button>
      <button
        onClick={handleMinimize}
        className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Minimize"
      >
        <Minus className="w-3 h-3" />
      </button>
      <button
        onClick={handleMaximize}
        className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Maximize"
      >
        <Maximize className="w-3 h-3" />
      </button>
      <button
        onClick={handleClose}
        className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:bg-destructive/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  // ════════════ ROOT ════════════
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="flex-1 min-w-0 relative overflow-hidden bg-background">
        {/* Invisible draggable strip for frameless window */}
        <div className="absolute top-0 left-0 right-0 h-8 z-10" style={{ "--wails-draggable": "drag" } as React.CSSProperties} onDoubleClick={handleMaximize} />
        {renderWindowControls()}
        <div className="h-full overflow-y-auto px-10 py-6 flex flex-col max-w-[1400px] mx-auto">
          {currentPage === "main" && renderHome()}
          {currentPage === "history" && renderHistory()}
          {currentPage === "settings" && renderSettings()}
          {currentPage === "logs" && renderLogs()}
          {currentPage === "downloads" && renderDownloads()}
          {currentPage === "about" && renderAbout()}
          {currentPage === "donate" && renderDonate()}
        </div>
      </main>
    </div>
  );
}