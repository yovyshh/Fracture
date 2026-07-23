"use client";

import { useCallback, useState } from "react";
import { Film, FileVideo2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const FORMATS = ["MP4", "AVI", "MOV", "MKV"];

export function DropZone({
  onPath,
}: {
  onPath?: (path: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const [path, setPath] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const simulate = useCallback(() => {
    setUploading(true);
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setUploading(false);
      }
      setProgress(p);
    }, 180);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setHover(false);
            const f = e.dataTransfer.files?.[0];
            if (f) {
              // browsers hide full paths; accept name + user can paste path
              setPath((f as File & { path?: string }).path || f.name);
              simulate();
            }
          }}
          className={cn(
            "relative flex min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-12 text-center transition-all duration-300",
            hover
              ? "border-accent bg-accent-soft/40 shadow-glow"
              : "border-line-strong bg-elevated/30 hover:border-accent/40 hover:bg-accent-soft/20"
          )}
        >
          <motion.div
            animate={hover ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="mb-5 grid h-20 w-20 place-items-center rounded-[22px] border border-line bg-surface shadow-soft"
          >
            <Film className="h-8 w-8 text-accent-hi" />
          </motion.div>

          <h3 className="text-xl font-semibold tracking-tight">
            Drop video to classify
          </h3>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Drag a file here, or paste an absolute path below. Fracture extracts
            keyframes, embeds with CLIP, and clusters scenes locally.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {FORMATS.map((f) => (
              <Badge key={f} tone="mute">
                {f}
              </Badge>
            ))}
          </div>

          {(uploading || progress > 0) && (
            <div className="mt-8">
              <ProgressRing value={progress} />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FileVideo2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="C:\\Videos\\sample.mp4"
              className="h-11 w-full rounded-2xl border border-line bg-elevated/50 pl-10 pr-4 text-sm outline-none placeholder:text-ink-mute focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Button
            onClick={() => {
              if (path) onPath?.(path);
              simulate();
            }}
            disabled={!path.trim()}
          >
            Start import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
