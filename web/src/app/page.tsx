"use client";

import { Hero } from "@/components/dashboard/Hero";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import {
  LiveInferencePanel,
  Pipeline,
} from "@/components/dashboard/Pipeline";
import { PageEnter } from "@/components/motion/Reveal";

export default function DashboardPage() {
  return (
    <PageEnter className="space-y-10">
      <Hero />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <StatsGrid />
          <Pipeline activeIndex={3} />
        </div>
        <LiveInferencePanel />
      </div>
    </PageEnter>
  );
}
