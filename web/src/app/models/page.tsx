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
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const LOSS = Array.from({ length: 20 }).map((_, i) => ({
  epoch: i + 1,
  train: Math.max(0.08, 1.2 * Math.exp(-i / 6) + Math.random() * 0.04),
  val: Math.max(0.1, 1.25 * Math.exp(-i / 6.5) + Math.random() * 0.05),
}));

export default function ModelsPage() {
  return (
    <PageEnter className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="accent">Registry</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Models</h1>
          <p className="max-w-xl text-sm text-ink-soft">
            Active checkpoint, metrics, and training curves.
          </p>
        </div>
        <Button variant="secondary">Load checkpoint</Button>
      </header>

      <StaggerIn className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Accuracy", "94.8%"],
          ["Precision", "93.1%"],
          ["Recall", "92.4%"],
          ["F1", "92.7%"],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-ink-mute">
                {k}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{v}</div>
            </CardContent>
          </Card>
        ))}
      </StaggerIn>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current model</CardTitle>
            <CardDescription>Production endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row k="Architecture" v="clip-ViT-B-32 + head" />
            <Row k="Dataset" v="fracture-v2 (14.2k clips)" />
            <Row k="Checkpoint" v="epoch_42.pt" />
            <Row k="Epoch" v="42 / 60" />
            <Row k="Learning rate" v="2.5e-5" />
            <div>
              <div className="mb-2 flex justify-between text-xs text-ink-mute">
                <span>Training progress</span>
                <span>70%</span>
              </div>
              <Progress value={70} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loss curve</CardTitle>
            <CardDescription>Train vs validation</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LOSS}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="train" stroke="#A78BFA" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="val" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </PageEnter>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0">
      <span className="text-ink-mute">{k}</span>
      <span className="font-medium text-ink">{v}</span>
    </div>
  );
}
