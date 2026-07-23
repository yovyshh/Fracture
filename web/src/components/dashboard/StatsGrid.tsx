"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StaggerIn } from "@/components/motion/Reveal";
import { Activity, Clapperboard, Gauge, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = [
  {
    label: "Videos processed",
    value: "1,284",
    delta: "+12.4%",
    icon: Clapperboard,
    tone: "text-accent-hi",
  },
  {
    label: "Mean confidence",
    value: "94.2%",
    delta: "+1.8%",
    icon: Gauge,
    tone: "text-success",
  },
  {
    label: "Active classes",
    value: "37",
    delta: "+3",
    icon: Layers3,
    tone: "text-accent-hi",
  },
  {
    label: "Avg latency",
    value: "24 ms",
    delta: "-6 ms",
    icon: Activity,
    tone: "text-success",
  },
];

export function StatsGrid() {
  return (
    <StaggerIn className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.label}
            className="group transition duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-glow"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-ink-mute">
                {s.label}
              </CardTitle>
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-elevated/60">
                <Icon className={cn("h-4 w-4", s.tone)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight tabular-nums">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-success">{s.delta} vs last week</div>
            </CardContent>
          </Card>
        );
      })}
    </StaggerIn>
  );
}
