"use client";

import { Hero } from "@/components/dashboard/Hero";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import {
  LiveInferencePanel,
  Pipeline,
} from "@/components/dashboard/Pipeline";
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
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const RECENT = [
  { name: "night_drive.mp4", classes: 6, conf: 0.94, status: "Ready" },
  { name: "product_reel.mov", classes: 4, conf: 0.89, status: "Ready" },
  { name: "interview_a.mkv", classes: 3, conf: 0.97, status: "Exporting" },
];

export default function DashboardPage() {
  return (
    <PageEnter className="space-y-8">
      <Hero />
      <StatsGrid />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Pipeline activeIndex={3} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent jobs</CardTitle>
                <CardDescription>Latest classification runs</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/results">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <StaggerIn className="space-y-2">
                {RECENT.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-2xl border border-line bg-elevated/30 px-4 py-3 transition hover:border-accent/25 hover:bg-elevated/50"
                  >
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-ink-mute">
                        {r.classes} clusters · conf {(r.conf * 100).toFixed(0)}%
                      </div>
                    </div>
                    <Badge
                      tone={r.status === "Ready" ? "success" : "accent"}
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </StaggerIn>
            </CardContent>
          </Card>
        </div>

        <LiveInferencePanel />
      </div>
    </PageEnter>
  );
}
