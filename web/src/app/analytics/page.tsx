"use client";

import { PageEnter, StaggerIn } from "@/components/motion/Reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LATENCY = Array.from({ length: 10 }).map((_, i) => ({
  t: `${i + 1}`,
  ms: 18 + Math.round(Math.sin(i / 2) * 5 + i * 0.4),
}));

const MATRIX = [
  [48, 2, 1, 0],
  [3, 41, 2, 1],
  [1, 2, 39, 3],
  [0, 1, 2, 44],
];
const LABELS = ["Int", "B-roll", "Prod", "Title"];

/** All technical metrics live here — not on Inference. */
export default function AnalyticsPage() {
  return (
    <PageEnter className="space-y-10">
      <header>
        <h1 className="text-[32px] font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Quality, speed, and hardware — separated from the run workspace.
        </p>
      </header>

      <StaggerIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Accuracy", "94.8%"],
          ["Precision", "93.1%"],
          ["Recall", "92.4%"],
          ["F1", "92.7%"],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardContent className="p-6">
              <div className="text-[12px] uppercase tracking-wider text-ink-mute">
                {k}
              </div>
              <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">
                {v}
              </div>
            </CardContent>
          </Card>
        ))}
      </StaggerIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LATENCY}>
                <defs>
                  <linearGradient id="a" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "var(--ink-mute)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--ink-mute)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ms"
                  stroke="#A78BFA"
                  fill="url(#a)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confusion matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="inline-grid grid-cols-[auto_repeat(4,minmax(52px,1fr))] gap-1">
              <div />
              {LABELS.map((l) => (
                <div
                  key={l}
                  className="pb-2 text-center text-[11px] text-ink-mute"
                >
                  {l}
                </div>
              ))}
              {MATRIX.map((row, ri) => (
                <div key={ri} className="contents">
                  <div className="self-center pr-2 text-right text-[11px] text-ink-mute">
                    {LABELS[ri]}
                  </div>
                  {row.map((v, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      className="grid h-12 place-items-center rounded-[12px] text-[13px] font-semibold tabular-nums"
                      style={{
                        background: `color-mix(in srgb, var(--accent) ${12 + v}%, transparent)`,
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
      </div>

      <StaggerIn className="grid gap-4 sm:grid-cols-3">
        {[
          ["Avg FPS", "38"],
          ["p50 latency", "24 ms"],
          ["GPU util", "71%"],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardContent className="p-6">
              <div className="text-[12px] text-ink-mute">{k}</div>
              <div className="mt-2 text-[24px] font-semibold tabular-nums">
                {v}
              </div>
            </CardContent>
          </Card>
        ))}
      </StaggerIn>
    </PageEnter>
  );
}
