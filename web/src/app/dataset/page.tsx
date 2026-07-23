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
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const FOLDERS = [
  { name: "interviews", videos: 42, size: "18.2 GB" },
  { name: "product", videos: 27, size: "9.4 GB" },
  { name: "broll", videos: 61, size: "24.1 GB" },
  { name: "unlabeled", videos: 15, size: "5.8 GB" },
];

const DIST = [
  { name: "Interview", value: 34, color: "#A78BFA" },
  { name: "B-roll", value: 28, color: "#22C55E" },
  { name: "Product", value: 22, color: "#38BDF8" },
  { name: "Titles", value: 10, color: "#F472B6" },
  { name: "Other", value: 6, color: "#71717A" },
];

export default function DatasetPage() {
  return (
    <PageEnter className="space-y-8">
      <header className="space-y-2">
        <Badge tone="accent">Corpus</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Dataset</h1>
        <p className="max-w-xl text-sm text-ink-soft">
          Explore folders, previews, and class balance before training.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Explorer</CardTitle>
            <CardDescription>Local dataset roots</CardDescription>
          </CardHeader>
          <CardContent>
            <StaggerIn className="space-y-2">
              {FOLDERS.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between rounded-2xl border border-line bg-elevated/30 px-4 py-3 transition hover:border-accent/25"
                >
                  <div>
                    <div className="font-medium">/{f.name}</div>
                    <div className="text-xs text-ink-mute">
                      {f.videos} videos · {f.size}
                    </div>
                  </div>
                  <Badge tone="mute">Open</Badge>
                </div>
              ))}
            </StaggerIn>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class distribution</CardTitle>
            <CardDescription>Share of labeled samples</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DIST}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {DIST.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111113",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview strip</CardTitle>
          <CardDescription>Random frames from the active folder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl border border-line"
                style={{
                  background: `linear-gradient(145deg, hsla(${230 + i * 25},65%,40%,0.9), #09090B)`,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </PageEnter>
  );
}
