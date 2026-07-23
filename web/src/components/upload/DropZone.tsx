"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Film, FileVideo2, FolderOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api, pollJob } from "@/lib/api";

const FORMATS = ["MP4", "AVI", "MOV", "MKV"];
const ACCEPT = ".mp4,.mkv,.avi,.mov,.webm,.m4v,video/*";

export function DropZone({
  onComplete,
}: {
  onComplete?: (info: { path: string; name: string }) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [path, setPath] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runImport = useCallback(
    async (videoPath: string, displayName?: string) => {
      setBusy(true);
      setError(null);
      setProgress(2);
      setStatus("Starting analysis…");
      try {
        const { job_id } = await api.importVideo(videoPath);
        const job = await pollJob(job_id, (j) => {
          setProgress(j.progress || 0);
          setStatus(j.message || "Working…");
        });
        if (job.status === "error") {
          throw new Error(job.error || job.message || "Import failed");
        }
        if (job.status === "cancelled") {
          setStatus("Cancelled");
          return;
        }
        setProgress(100);
        setStatus("Done — opening classification…");
        onComplete?.({
          path: videoPath,
          name: displayName || videoPath.split(/[/\\]/).pop() || "video",
        });
        router.push("/classification");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          msg.includes("Failed to fetch")
            ? `Cannot reach API at ${api.base}. Start it with: python -m uvicorn server:app --port 8765`
            : msg
        );
        setStatus("");
      } finally {
        setBusy(false);
      }
    },
    [onComplete, router]
  );

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || busy) return;
      setBusy(true);
      setError(null);
      setProgress(1);
      setStatus(`Uploading ${file.name}…`);
      setPath(file.name);
      try {
        const up = await api.uploadFile(file);
        setPath(up.path);
        setStatus("Uploaded — analyzing…");
        await runImport(up.path, up.name);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          msg.includes("Failed to fetch")
            ? `Cannot reach API at ${api.base}. Start backend first.`
            : msg
        );
        setBusy(false);
        setStatus("");
      }
    },
    [busy, runImport]
  );

  const handlePathImport = useCallback(async () => {
    const p = path.trim().replace(/^["']|["']$/g, "");
    if (!p || busy) return;
    await runImport(p);
  }, [path, busy, runImport]);

  return (
    <Card className="relative z-10 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void handleFile(f);
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setHover(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => {
            if (!busy) fileRef.current?.click();
          }}
          className={cn(
            "relative z-10 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-12 text-center transition-all duration-300",
            hover
              ? "border-accent bg-accent-soft/40 shadow-glow"
              : "border-line-strong bg-elevated/30 hover:border-accent/40 hover:bg-accent-soft/20",
            busy && "pointer-events-none opacity-80"
          )}
        >
          <motion.div
            animate={hover ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="mb-5 grid h-20 w-20 place-items-center rounded-[22px] border border-line bg-surface shadow-soft"
          >
            {busy ? (
              <Loader2 className="h-8 w-8 animate-spin text-accent-hi" />
            ) : (
              <Film className="h-8 w-8 text-accent-hi" />
            )}
          </motion.div>

          <h3 className="text-xl font-semibold tracking-tight">
            {busy ? "Working…" : "Drop video or click to browse"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Choose a local file — it is uploaded to the Fracture engine on this
            machine, then analyzed with CLIP + FFmpeg.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {FORMATS.map((f) => (
              <Badge key={f} tone="mute">
                {f}
              </Badge>
            ))}
          </div>

          {(busy || progress > 0) && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <ProgressRing value={progress} />
              {status && (
                <p className="max-w-sm text-xs text-ink-soft">{status}</p>
              )}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FileVideo2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder='Or paste path: C:\Videos\sample.mp4'
              disabled={busy}
              className="h-11 w-full rounded-2xl border border-line bg-elevated/50 pl-10 pr-4 text-sm outline-none placeholder:text-ink-mute focus:border-accent/40 focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handlePathImport();
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <FolderOpen className="h-4 w-4" />
            Browse
          </Button>
          <Button
            type="button"
            disabled={busy || !path.trim()}
            onClick={() => void handlePathImport()}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Working
              </>
            ) : (
              "Start import"
            )}
          </Button>
        </div>

        {error && (
          <div className="relative z-10 mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
