"use client";

import { useState } from "react";
import { PageEnter, StaggerIn } from "@/components/motion/Reveal";
import { Pipeline, LiveInferencePanel } from "@/components/dashboard/Pipeline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const CLUSTERS = [
  { id: 0, label: "Interview", count: 18, conf: 0.96, color: "#A78BFA" },
  { id: 1, label: "B-roll city", count: 12, conf: 0.91, color: "#22C55E" },
  { id: 2, label: "Product close", count: 9, conf: 0.88, color: "#38BDF8" },
  { id: 3, label: "Titles", count: 4, conf: 0.84, color: "#F472B6" },
  { id: -1, label: "Noise", count: 7, conf: 0.42, color: "#71717A" },
];

export default function ClassificationPage() {
  const [active, setActive] = useState(0);

  return (
    <PageEnter className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="accent">Inference</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Classification</h1>
          <p className="max-w-xl text-sm text-ink-soft">
            Watch the pipeline light up as frames become embeddings and
            clusters.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Recluster</Button>
          <Button>Run analysis</Button>
        </div>
      </header>

      <Pipeline activeIndex={4} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <LiveInferencePanel progress={78} />

        <Card>
          <CardHeader>
            <CardTitle>Detected classes</CardTitle>
            <CardDescription>Shift-select to add a full cluster</CardDescription>
          </CardHeader>
          <CardContent>
            <StaggerIn className="space-y-2">
              {CLUSTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition",
                    active === c.id
                      ? "border-accent/40 bg-accent-soft"
                      : "border-line bg-elevated/30 hover:border-line-strong"
                  )}
                >
                  <span
                    className="h-9 w-1.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-xs tabular-nums text-ink-mute">
                        {c.count} scenes
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress value={c.conf * 100} />
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-ink-soft">
                    {(c.conf * 100).toFixed(0)}%
                  </div>
                </button>
              ))}
            </StaggerIn>
          </CardContent>
        </Card>
      </div>
    </PageEnter>
  );
}
