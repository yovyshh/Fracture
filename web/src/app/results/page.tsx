"use client";

import { PageEnter, StaggerIn } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

const CLASSES = [
  { name: "Interview", conf: 0.96, count: 18 },
  { name: "B-roll", conf: 0.91, count: 12 },
  { name: "Product", conf: 0.88, count: 9 },
  { name: "Titles", conf: 0.84, count: 4 },
];

/**
 * Results appear after a run — not crammed into Inference.
 */
export default function ResultsPage() {
  return (
    <PageEnter className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="success" className="mb-3">
            Complete
          </Badge>
          <h1 className="text-[32px] font-semibold tracking-tight">Results</h1>
          <p className="mt-2 text-[14px] text-ink-soft">
            night_drive.mp4 · 7 clusters · 1:58 timeline
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button type="button" variant="secondary" size="sm">
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </Button>
          <Button type="button" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export report
          </Button>
        </div>
      </header>

      {/* Large preview */}
      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-elevated via-surface to-canvas">
          <div className="text-center">
            <div className="text-[13px] text-ink-mute">Video preview</div>
            <div className="mt-1 text-[16px] font-medium">night_drive.mp4</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Detected classes</CardTitle>
          </CardHeader>
          <CardContent>
            <StaggerIn className="space-y-4">
              {CLASSES.map((c) => (
                <div key={c.name}>
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular-nums text-ink-mute">
                      {c.count} · {(c.conf * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={c.conf * 100} />
                </div>
              ))}
            </StaggerIn>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-[14px] text-ink-soft">
            <p>
              Scene boundaries were taken from keyframes, embedded with CLIP,
              and clustered with cosine DBSCAN.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Scenes", "43"],
                ["Clusters", "7"],
                ["Duration", "1:58"],
                ["Mean conf.", "91%"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-[16px] border border-line bg-elevated/40 px-4 py-3"
                >
                  <div className="text-[11px] uppercase tracking-wider text-ink-mute">
                    {k}
                  </div>
                  <div className="mt-1 text-[20px] font-semibold tabular-nums text-ink">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frame explorer — quiet strip */}
      <section>
        <h2 className="mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-mute">
          Frame explorer
        </h2>
        <StaggerIn className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-[16px] border border-line transition hover:border-accent/30"
              style={{
                background: `linear-gradient(145deg, hsla(${250 + i * 18},55%,38%,0.85), #111113)`,
              }}
            />
          ))}
        </StaggerIn>
      </section>
    </PageEnter>
  );
}
