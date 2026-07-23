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
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LATENCY = Array.from({ length: 12 }).map((_, i) => ({
  t: `${i + 1}h`,
  ms: 18 + Math.round(Math.sin(i / 2) * 6 + Math.random() * 4),
  fps: 36 + Math.round(Math.cos(i / 2) * 5),
}));

const MATRIX = [
  [48, 2, 1, 0],
  [3, 41, 2, 1],
  [1, 2, 39, 3],
  [0, 1, 2, 44],
];
const LABELS = ["Int.", "B-roll", "Prod.", "Title"];

export default function AnalyticsPage() {
  return (
    <PageEnter className="space-y-8">
      <header className="space-y-2">
        <Badge tone="accent">Insights</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="max-w-xl text-sm text-ink-soft">
          Latency, throughput, and model quality at a glance.
        </p>
      </header>

      <StaggerIn className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Accuracy", v: "94.8%" },
          { k: "Precision", v: "93.1%" },
          { k: "Recall", v: "92.4%" },
          { k: "F1", v: "92.7%" },
        ].map((m) => (
          <Card key={m.k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-ink-mute">
                {m.k}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{m.v}</div>
            </CardContent>
          </Card>
        ))}
      </StaggerIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency</CardTitle>
            <CardDescription>p50 inference time (ms)</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LATENCY}>
                <defs>
                  <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="ms" stroke="#A78BFA" fill="url(#lat)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Throughput</CardTitle>
            <CardDescription>Frames / second</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LATENCY}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="fps" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confusion matrix</CardTitle>
          <CardDescription>Normalized counts · last eval split</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-grid grid-cols-[auto_repeat(4,minmax(56px,1fr))] gap-1">
            <div />
            {LABELS.map((l) => (
              <div key={l} className="pb-2 text-center text-[11px] text-ink-mute">
                {l}
              </div>
            ))}
            {MATRIX.map((row, ri) => (
              <div key={`row-${ri}`} className="contents">
                <div className="self-center pr-3 text-right text-[11px] text-ink-mute">
                  {LABELS[ri]}
                </div>
                {row.map((v, ci) => (
                  <div
                    key={`${ri}-${ci}`}
                    className="grid h-14 place-items-center rounded-xl text-sm font-semibold tabular-nums"
                    style={{
                      background: `rgba(124,58,237,${0.12 + v / 80})`,
                      boxShadow:
                        ri === ci
                          ? "inset 0 0 0 1px rgba(167,139,250,0.35)"
                          : undefined,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageEnter>
  );
}
