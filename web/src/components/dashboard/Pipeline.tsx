"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STAGES = [
  "Upload",
  "Extract Frames",
  "Preprocessing",
  "Feature Extraction",
  "Classification",
  "Prediction",
  "Report",
];

export function Pipeline({
  activeIndex = 0,
  className,
}: {
  activeIndex?: number;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Processing pipeline</CardTitle>
            <CardDescription>Live stage graph for the active job</CardDescription>
          </div>
          <Badge tone="accent">Realtime</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {STAGES.map((stage, i) => {
            const done = i < activeIndex;
            const current = i === activeIndex;
            return (
              <div key={stage} className="flex min-w-0 items-center">
                <div className="flex w-[110px] flex-col items-center gap-2 px-1">
                  <div
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-2xl border text-xs font-semibold transition-all duration-300",
                      done && "border-success/40 bg-success/15 text-success",
                      current &&
                        "border-accent/50 bg-accent-soft text-accent-hi shadow-glow scale-105",
                      !done &&
                        !current &&
                        "border-line bg-elevated/40 text-ink-mute"
                    )}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-center text-[11px] font-medium leading-tight",
                      current ? "text-ink" : "text-ink-mute"
                    )}
                  >
                    {stage}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={cn(
                      "mb-6 h-px w-6 shrink-0 rounded-full transition-colors",
                      i < activeIndex ? "bg-success/50" : "bg-line-strong"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const SAMPLE_LOGS = [
  "> loading clip-ViT-B-32 … ready",
  "> probing container · H.264 / aac",
  "> keyframe index · 128 I-frames",
  "> extract mid-frames @ 224px",
  "> encode batch 0..31 · device=cpu",
  "> dbscan cosine · eps=0.35 min=2",
  "> clusters formed · 7 (+noise)",
  "> confidence mean · 0.91",
];

export function LiveInferencePanel({
  progress = 62,
  fps = 38,
  gpu = 71,
  mem = 4.2,
  frames = 128,
  confidence = 0.91,
  model = "clip-ViT-B-32",
  latency = 24,
}: {
  progress?: number;
  fps?: number;
  gpu?: number;
  mem?: number;
  frames?: number;
  confidence?: number;
  model?: string;
  latency?: number;
}) {
  const [lines, setLines] = useState<string[]>(SAMPLE_LOGS.slice(0, 3));

  useEffect(() => {
    let i = 3;
    const id = setInterval(() => {
      setLines((prev) => {
        if (i >= SAMPLE_LOGS.length) return prev;
        const next = [...prev, SAMPLE_LOGS[i]];
        i += 1;
        return next.slice(-8);
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { label: "Inference FPS", value: `${fps}` },
    { label: "GPU util", value: `${gpu}%` },
    { label: "Memory", value: `${mem} GB` },
    { label: "Frames", value: `${frames}` },
    { label: "Confidence", value: `${(confidence * 100).toFixed(0)}%` },
    { label: "Latency", value: `${latency} ms` },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live inference</CardTitle>
            <CardDescription>Terminal stream · {model}</CardDescription>
          </div>
          <Badge tone="success" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Streaming
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-line bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-success/90 shadow-inner">
          {lines.map((l, idx) => (
            <div key={idx} className="opacity-90">
              {l}
            </div>
          ))}
          <span className="inline-block h-3 w-1.5 animate-pulse bg-success/80 align-middle" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-ink-soft">
            <span>Job progress</span>
            <span className="tabular-nums text-ink">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-elevated/40 px-3 py-3"
            >
              <div className="text-[11px] text-ink-mute">{s.label}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
