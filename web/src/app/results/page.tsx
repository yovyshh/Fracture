"use client";

import { PageEnter, StaggerIn } from "@/components/motion/Reveal";
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const THUMBS = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  label: `Scene ${i + 1}`,
  conf: 0.72 + (i % 5) * 0.05,
  cluster: i % 4,
}));

const PROBS = [
  { name: "Interview", p: 92 },
  { name: "B-roll", p: 78 },
  { name: "Product", p: 64 },
  { name: "Titles", p: 41 },
  { name: "Noise", p: 18 },
];

export default function ResultsPage() {
  return (
    <PageEnter className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="success">Results</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Results</h1>
          <p className="max-w-xl text-sm text-ink-soft">
            Preview cuts, confidence, and frame-level evidence.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export JSON</Button>
          <Button>Export timeline</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-elevated via-surface to-canvas">
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-full border border-line bg-canvas/60 px-4 py-2 text-sm text-ink-soft backdrop-blur">
                Video preview · night_drive.mp4
              </div>
            </div>
            {/* Timeline scrub */}
            <div className="absolute inset-x-4 bottom-4">
              <div className="h-2 overflow-hidden rounded-full bg-black/50">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-accent to-accent-hi" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-ink-mute">
                <span>00:42</span>
                <span>01:58</span>
              </div>
            </div>
          </div>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle>Timeline</CardTitle>
              <Badge tone="accent">12 clips · 1:58</Badge>
            </div>
            <div className="flex gap-1 overflow-hidden rounded-xl">
              {[22, 14, 30, 18, 10, 16].map((w, i) => (
                <div
                  key={i}
                  className="h-8 rounded-md"
                  style={{
                    width: `${w}%`,
                    background: `hsla(${260 + i * 20}, 80%, 62%, 0.85)`,
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class probabilities</CardTitle>
            <CardDescription>Softmax over cluster prototypes</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROBS} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fill: "#A1A1AA", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111113",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="p" fill="#7C3AED" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frame thumbnails</CardTitle>
          <CardDescription>Evidence strip for the active prediction</CardDescription>
        </CardHeader>
        <CardContent>
          <StaggerIn className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {THUMBS.map((t) => (
              <div
                key={t.id}
                className="group overflow-hidden rounded-2xl border border-line bg-elevated/40 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-glow"
              >
                <div
                  className="aspect-[16/10]"
                  style={{
                    background: `linear-gradient(135deg, hsla(${250 + t.id * 18},70%,45%,0.9), #111113)`,
                  }}
                />
                <div className="p-2.5">
                  <div className="text-[11px] font-medium">{t.label}</div>
                  <Progress value={t.conf * 100} className="mt-2" />
                </div>
              </div>
            ))}
          </StaggerIn>
        </CardContent>
      </Card>
    </PageEnter>
  );
}
