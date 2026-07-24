import { useState, useRef, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, type PageType } from './components/Sidebar';
import { Download, Save, RotateCcw, FolderOpen, Copy, Trash2, CheckCircle, FileVideo, DownloadCloud, Info, Layers, Scissors, Cpu, Network } from 'lucide-react';
import { toast } from 'sonner';
import { SelectVideo, ServeVideo, SelectSavePath, ExportTimeline, SaveExportRecord, GetHistory, GetSceneClusters, GenerateThumbnails } from "../wailsjs/go/main/App";

type ClipData = { id: string, timeOffset: number, clusterNum: string | number, thumbUrl?: string };

type ExportRecord = {
  videoName: string;
  outputPath: string;
  clipCount: number;
  timeOffsets: number[];
  date: string;
  status: string;
  duration: string;
};

/** Scene tile: JPEG thumb + seeks the main player for preview (reliable for big files). */
function MediaClip({
  thumbUrl,
  timeOffset,
  clusterNum,
  videoUrl,
  onClick,
  onPreview,
}: {
  thumbUrl?: string;
  timeOffset: number;
  clusterNum: string | number;
  videoUrl?: string;
  onClick: () => void;
  onPreview?: (t: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When hovered, seek to timeOffset and play
  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.currentTime = timeOffset;
      videoRef.current.play().catch(() => {});
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isHovered, timeOffset]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
        {isHovered && videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            autoPlay
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = timeOffset;
              }
            }}
            className="absolute inset-0 w-full h-full object-cover z-20"
          />
        )}
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={`Scene ${formatTime(timeOffset)}`}
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-10 transition-opacity z-10"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-muted/40 animate-pulse z-10" />
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
      <div className="absolute bottom-1 left-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/90 text-white">▶ preview</span>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("main");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string>("All");
  const [curatedClips, setCuratedClips] = useState<ClipData[]>([]);
  const [scenes, setScenes] = useState<ClipData[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ExportRecord[]>([]);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  const seekMainPreview = (t: number) => {
    const v = mainVideoRef.current;
    if (!v) return;
    const target = Math.max(0, t);
    const go = () => {
      try {
        v.currentTime = target;
        v.muted = false;
        v.play().catch(() => {});
      } catch { /* ignore */ }
    };
    if (v.readyState >= 1) go();
    else v.addEventListener('loadedmetadata', go, { once: true });
  };

  const loadHistory = async () => {
    try {
      const data = await GetHistory();
      setHistoryRecords(JSON.parse(data));
    } catch { 
      setHistoryRecords([]); 
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const importVideo = async () => {
    if (isProcessing) return;
    // Reset old video state for reimport
    setVideoUrl(null);
    setVideoPath(null);
    setScenes([]);
    setCuratedClips([]);
    try {
      const path = await SelectVideo();
      if (!path) return;
      setVideoPath(path);

      // 1) Instant stream URL (AMVerge convertFileSrc equivalent) — no full-file read
      const streamUrl = await ServeVideo(path);
      setVideoUrl(streamUrl);
      toast.success(`Loading: ${path.split(/[/\\]/).pop()}`);

      // 2) Fast keyframe scene detect (ffprobe packets — AMVerge style)
      setIsProcessing(true);
      try {
        const scenesJson = await GetSceneClusters(path);
        let detectedScenes: ClipData[] = JSON.parse(scenesJson).map((s: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          timeOffset: s.timeOffset,
          clusterNum: s.clusterNum,
        }));

        if (detectedScenes.length === 0) {
          detectedScenes = Array.from({ length: 24 }).map((_, i) => ({
            id: Math.random().toString(36).substring(2, 9),
            timeOffset: i * 5,
            clusterNum: String(i % 3),
          }));
        }

        // Show scene cards immediately — don't wait on thumbs
        setScenes(detectedScenes);
        setIsProcessing(false);
        toast.success(`${detectedScenes.length} scenes ready`);

        // Background JPEG thumbs (grid stays interactive)
        const offsets = detectedScenes.map(s => s.timeOffset);
        GenerateThumbnails(path, offsets).then((thumbsJson) => {
          try {
            const thumbs: { timeOffset: number; url: string }[] = JSON.parse(thumbsJson);
            const byOffset = new Map(thumbs.map(t => [t.timeOffset, t.url]));
            setScenes(prev => prev.map(s => ({
              ...s,
              thumbUrl: byOffset.get(s.timeOffset) || s.thumbUrl,
            })));
          } catch { /* ignore */ }
        }).catch(() => { /* thumbs optional */ });
      } catch (err: any) {
        setIsProcessing(false);
        throw err;
      }
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(`Import failed: ${err.message || err}`);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (videoPath) return;
    // Browser drag-drop gives a File object — use native dialog instead to get the real path
    toast.info("Please use the native file dialog to import (click the area)");
  };

  const handleAddToTimeline = (timeOffset: number, clusterNum: string | number, thumbUrl?: string) => {
    setCuratedClips(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), timeOffset, clusterNum, thumbUrl }]);
    toast.success(`Added scene at ${formatTime(timeOffset)} to timeline`);
  };

  const handleRemoveFromTimeline = (id: string) => {
    setCuratedClips(prev => prev.filter(c => c.id !== id));
  };

  const handleClearTimeline = () => {
    setCuratedClips([]);
    toast.success("Timeline cleared");
  };

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    if (page === "history") loadHistory();
  };

  const handleExport = async () => {
    if (curatedClips.length === 0) {
      toast.error("Timeline is empty!");
      return;
    }
    if (!videoPath) {
      toast.error("No video imported. Please import a video first.");
      return;
    }

    try {
      // Always export as MP4
      const base = videoPath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'export';
      const defaultName = `${base}_export.mp4`;
      const savePath = await SelectSavePath(defaultName);
      if (!savePath) return; // User cancelled

      const toastId = toast.loading(`Exporting MP4 (${curatedClips.length} clips)…`);
      const offsets = curatedClips.map(c => c.timeOffset);
      const outputPath = await ExportTimeline(videoPath, offsets, savePath);
      
      // Save to history
      try {
        await SaveExportRecord(videoPath, outputPath, offsets, `${curatedClips.length} clips`);
        loadHistory();
      } catch {}
      
      toast.success(`Export complete! ${outputPath.split(/[/\\]/).pop()}`, { id: toastId });
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || err}`);
    }
  };

  const pipelineSteps = [
    { name: "Import", icon: DownloadCloud, active: true },
    { name: "Detect (I-Frames)", icon: Scissors, active: videoPath !== null },
    { name: "Embed (CLIP)", icon: Cpu, active: videoPath !== null && !isProcessing },
    { name: "Cluster (DBSCAN)", icon: Network, active: videoPath !== null && !isProcessing },
    { name: "Curate", icon: Layers, active: videoPath !== null && !isProcessing },
    { name: "Export", icon: Save, active: false }
  ];

  const renderHome = () => (
    <div className="w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Header & Pipeline */}
      <div className="flex flex-col items-center gap-6 mb-8 mt-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Fracture</h1>
          <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold font-mono border border-primary/20">v1.0.0</span>
        </div>
        
        {/* Pipeline Visualizer */}
        <div className="flex items-center justify-center gap-2 max-w-4xl w-full px-4">
          {pipelineSteps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div className={`flex flex-col items-center gap-2 ${step.active ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${step.active ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'border-border bg-card'}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-center">{step.name}</span>
              </div>
              {index < pipelineSteps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 rounded-full transition-colors duration-500 ${step.active ? 'bg-primary/50' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      {!videoPath ? (
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            <div 
              onClick={importVideo} onDragOver={handleDragOver} onDrop={handleDrop}
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
          
          {/* Controls & Cluster Chips */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3 shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono font-bold uppercase tracking-wider mr-2">Clusters:</span>
              {(() => {
                const uniqueClusters = [...new Set(scenes.map(s => String(s.clusterNum)))];
                const allClusters = ["All", ...uniqueClusters.sort()];
                return allClusters.map(cluster => (
                <button 
                  key={cluster} 
                  onClick={() => setActiveCluster(cluster)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    activeCluster === cluster 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : cluster === 'Noise' 
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                  }`}
                >
                  {cluster}
                </button>
              ))})()}
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <button onClick={importVideo} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded border border-border transition-colors flex items-center gap-1.5">
                <DownloadCloud className="w-3 h-3" />
                New Video
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-muted-foreground font-mono text-xs">
                <span>eps: 0.35</span>
                <div className="w-px h-3 bg-border" />
                <span>min: 2</span>
              </div>
              <button className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-md font-medium transition-colors">
                Recluster
              </button>
            </div>
          </div>

          {/* Single stream preview — one player only (AMVerge pattern) */}
          {videoUrl && (
            <div className="shrink-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <video
                ref={mainVideoRef}
                key={videoUrl}
                src={videoUrl}
                controls
                preload="metadata"
                className="w-full max-h-56 bg-black object-contain"
              />
            </div>
          )}

          {/* Media Pool */}
          <div className="flex-1 bg-background border border-border rounded-xl overflow-y-auto p-4 shadow-inner relative">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="font-mono text-sm text-primary animate-pulse">Detecting keyframes…</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {scenes.map((scene) => {
                  if (activeCluster !== "All" && activeCluster !== String(scene.clusterNum)) return null;
                  
                  return (
                    <MediaClip 
                      key={scene.id} 
                      thumbUrl={scene.thumbUrl} 
                      timeOffset={scene.timeOffset} 
                      clusterNum={scene.clusterNum} 
                      videoUrl={videoUrl || undefined}
                      onPreview={seekMainPreview}
                      onClick={() => handleAddToTimeline(scene.timeOffset, scene.clusterNum, scene.thumbUrl)} 
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
                  <Download className="w-3 h-3" />
                  Lossless MP4 Export
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-background border border-border rounded-lg flex items-center px-2 gap-2 overflow-x-auto">
              {!isProcessing && curatedClips.map((clip) => (
                <div key={clip.id} className="h-16 w-24 shrink-0 bg-black border border-border rounded flex items-center justify-center hover:border-primary transition-colors relative group overflow-hidden">
                  {clip.thumbUrl ? (
                    <img src={clip.thumbUrl} alt="" className="w-full h-full object-cover opacity-70" draggable={false} />
                  ) : (
                    <div className="w-full h-full bg-muted/30" />
                  )}
                  <div className="absolute bottom-1 right-1 text-[8px] font-mono font-bold px-1 py-0.5 rounded backdrop-blur-md bg-black/60 text-white z-10">
                    {formatTime(clip.timeOffset)}
                  </div>
                  <button 
                    onClick={() => handleRemoveFromTimeline(clip.id)}
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

  const renderHistory = () => (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Export History</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{historyRecords.length} export{historyRecords.length !== 1 ? 's' : ''}</span>
          <button onClick={loadHistory} className="h-9 px-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
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
                      <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-green-500/10 text-green-500">
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(rec.outputPath);
                            toast.success("Path copied to clipboard");
                          } catch {}
                        }}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
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

  const renderSettings = () => (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <div className="flex items-center gap-3">
          <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
            <FolderOpen className="w-4 h-4" />
            Open Config
          </button>
          <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive hover:border-destructive/30">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button className="h-9 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex items-start gap-12 flex-1 min-h-0 overflow-hidden">
        <div className="w-48 flex flex-col gap-1">
          {["General", "Clustering (DBSCAN)", "Hardware", "Export"].map((tab, i) => (
            <button key={tab} className={`px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-4 pb-12 space-y-8">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Application Preferences</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Theme</label>
                <div className="h-10 bg-card border border-border rounded-lg flex items-center px-3 text-sm text-muted-foreground cursor-not-allowed opacity-80">
                  Dark Mode (Enforced)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Default Export Path</label>
                <div className="flex items-center gap-2">
                  <input type="text" value="C:\Projects\Fracture\Output" readOnly className="h-10 flex-1 bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none" />
                  <button className="h-10 px-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors"><FolderOpen className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          </section>
          
          <section className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Clustering Defaults (DBSCAN)</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Default EPS (Epsilon)</label>
                <input type="number" step="0.05" defaultValue={0.35} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                <p className="text-xs text-muted-foreground">Lower = tighter clusters. Higher = broader groups.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Min Samples</label>
                <input type="number" defaultValue={2} className="h-10 w-full bg-input border border-border rounded-lg px-3 text-sm font-mono focus:outline-none focus:border-primary" />
                <p className="text-xs text-muted-foreground">Minimum scenes to form a cluster.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Debug Logs</h2>
        <div className="flex items-center gap-3">
          <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
            <Copy className="w-4 h-4" />
            Copy All
          </button>
          <button className="h-9 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="h-9 px-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-2 text-sm font-medium">
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-border rounded-xl flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed shadow-inner">
        <div className="flex items-start gap-3 text-muted-foreground mb-2">
          <span className="shrink-0 opacity-50">19:42:01</span>
          <span className="shrink-0 text-blue-400"><Info className="w-4 h-4" /></span>
          <span className="break-all">Fracture VideoClassifier UI Initialized.</span>
        </div>
        <div className="flex items-start gap-3 text-muted-foreground mb-2">
          <span className="shrink-0 opacity-50">19:42:02</span>
          <span className="shrink-0 text-green-400"><CheckCircle className="w-4 h-4" /></span>
          <span className="break-all text-foreground">Ready to import media. Expected backend at localhost:8000.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <TitleBar />
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-[64px] mt-10 relative overflow-hidden bg-background">
        <div className="h-full overflow-y-auto px-10 py-8 flex flex-col max-w-[1400px] mx-auto">
          {currentPage === "main" && renderHome()}
          {currentPage === "history" && renderHistory()}
          {currentPage === "settings" && renderSettings()}
          {currentPage === "logs" && renderLogs()}
          {["downloads", "about", "donate"].includes(currentPage) && (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-semibold mb-2 capitalize">{currentPage}</h2>
              <p>This page is currently under construction.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}