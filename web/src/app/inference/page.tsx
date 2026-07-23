"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageEnter } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api, pollJob } from "@/lib/api";
import { Film, FolderOpen, Loader2 } from "lucide-react";

const ACCEPT = ".mp4,.mkv,.avi,.mov,.webm,.m4v,video/*";

type QueueItem = {
  id: string;
  name: string;
  progress: number;
  status: string;
};

/**
 * Inference = upload + process only.
 * No charts, no confidence, no permanent results panel.
 */
export default function InferencePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const processPath = useCallback(
    async (path: string, name: string) => {
      const id = crypto.randomUUID();
      setQueue((q) => [
        { id, name, progress: 0, status: "Queued" },
        ...q,
      ]);
      setBusy(true);
      setError(null);
      setPreviewName(name);
      setProgress(0);
      setMessage("Starting…");
      try {
        const { job_id } = await api.importVideo(path);
        const job = await pollJob(job_id, (j) => {
          setProgress(j.progress || 0);
          setMessage(j.message || "Processing…");
          setQueue((q) =>
            q.map((item) =>
              item.id === id
                ? {
                    ...item,
                    progress: j.progress || 0,
                    status: j.message || "Running",
                  }
                : item
            )
          );
        });
        if (job.status === "error") {
          throw new Error(job.error || job.message || "Failed");
        }
        setQueue((q) =>
          q.map((item) =>
            item.id === id
              ? { ...item, progress: 100, status: "Complete" }
              : item
          )
        );
        setMessage("Complete");
        setProgress(100);
        // Results open after processing — not permanently on this page
        router.push("/results");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          msg.includes("Failed to fetch")
            ? `API offline at ${api.base}. Start: python -m uvicorn server:app --port 8765`
            : msg
        );
        setQueue((q) =>
          q.map((item) =>
            item.id === id ? { ...item, status: "Error" } : item
          )
        );
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  const onFile = useCallback(
    async (file?: File | null) => {
      if (!file || busy) return;
      setBusy(true);
      setError(null);
      setPreviewName(file.name);
      setMessage(`Uploading ${file.name}…`);
      try {
        const up = await api.uploadFile(file);
        setMessage("Uploaded — analyzing…");
        await processPath(up.path, up.name);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          msg.includes("Failed to fetch")
            ? `API offline at ${api.base}`
            : msg
        );
        setBusy(false);
      }
    },
    [busy, processPath]
  );

  return (
    <PageEnter className="space-y-12">
      <header className="max-w-xl">
        <Badge tone="accent" className="mb-4">
          Inference
        </Badge>
        <h1 className="text-[32px] font-semibold tracking-tight">
          Process a video
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Drop a file. We extract frames, embed with CLIP, and cluster scenes.
          Results open when the run finishes.
        </p>
      </header>

      {/* Large centered upload */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void onFile(f);
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
          void onFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !busy && fileRef.current?.click()}
        className={cn(
          "relative mx-auto flex min-h-[320px] max-w-2xl cursor-pointer flex-col items-center justify-center rounded-panel border border-dashed px-8 py-16 text-center transition-all duration-300",
          hover
            ? "border-accent bg-accent-soft/30 shadow-glow"
            : "border-line-strong bg-surface/50 hover:border-accent/40",
          busy && "pointer-events-none"
        )}
      >
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-[18px] border border-line bg-elevated">
          {busy ? (
            <Loader2 className="h-7 w-7 animate-spin text-accent-hi" />
          ) : (
            <Film className="h-7 w-7 text-accent-hi" />
          )}
        </div>
        <h2 className="text-[18px] font-semibold tracking-tight">
          {busy ? "Processing…" : "Drop video here"}
        </h2>
        <p className="mt-2 max-w-sm text-[13px] text-ink-mute">
          MP4, MOV, MKV, AVI · click to browse
        </p>

        {(busy || progress > 0) && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <ProgressRing value={progress} size={80} />
            <p className="text-[12px] text-ink-soft">{message}</p>
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-2xl justify-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <FolderOpen className="h-4 w-4" />
          Browse files
        </Button>
      </div>

      {error && (
        <div className="mx-auto max-w-2xl rounded-panel border border-danger/30 bg-danger/10 px-5 py-4 text-[13px] text-danger">
          {error}
        </div>
      )}

      {/* Live preview placeholder — name only while running */}
      {previewName && (
        <section className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-panel border border-line bg-surface">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-elevated to-canvas">
              <div className="text-center">
                <div className="text-[13px] text-ink-mute">Preview</div>
                <div className="mt-1 text-[15px] font-medium">{previewName}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Queue — only when something exists */}
      {queue.length > 0 && (
        <section className="mx-auto max-w-2xl space-y-3">
          <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-mute">
            Queue
          </h3>
          <div className="space-y-2">
            {queue.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-[16px] border border-line bg-surface/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{q.name}</div>
                  <div className="text-[12px] text-ink-mute">{q.status}</div>
                </div>
                <div className="text-[12px] tabular-nums text-ink-soft">
                  {Math.round(q.progress)}%
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageEnter>
  );
}
