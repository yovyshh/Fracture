"use client";

import Link from "next/link";
import { PageEnter, StaggerIn } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Cpu, FolderOpen, Sparkles, Clock } from "lucide-react";

const RECENT = [
  { name: "night_drive.mp4", when: "2h ago", status: "Ready" },
  { name: "product_reel.mov", when: "Yesterday", status: "Ready" },
  { name: "interview_a.mkv", when: "3d ago", status: "Draft" },
];

/**
 * Home = calm AI workspace.
 * One question: what do you want to do next?
 */
export default function HomePage() {
  return (
    <PageEnter className="space-y-14">
      {/* Welcome */}
      <section className="max-w-2xl pt-4">
        <Badge tone="accent" className="mb-5">
          Local workspace
        </Badge>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight text-ink md:text-[48px]">
          Classify video
          <br />
          <span className="text-ink-soft">with quiet precision.</span>
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          Fracture splits scenes, clusters with CLIP, and exports lossless cuts
          — entirely on your machine.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/inference">
              Start inference
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/projects">Open projects</Link>
          </Button>
        </div>
      </section>

      {/* Quick actions — three only */}
      <StaggerIn className="grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/inference",
            icon: Sparkles,
            title: "New run",
            desc: "Upload and process a video",
          },
          {
            href: "/projects",
            icon: FolderOpen,
            title: "Projects",
            desc: "Browse recent work",
          },
          {
            href: "/analytics",
            icon: Cpu,
            title: "Health",
            desc: "Model and hardware status",
          },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="group block">
            <Card className="h-full transition duration-300 group-hover:-translate-y-0.5 group-hover:border-accent/30 group-hover:shadow-glow">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-accent-soft text-accent-hi">
                  <a.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight">
                    {a.title}
                  </div>
                  <div className="mt-1 text-[13px] text-ink-mute">{a.desc}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </StaggerIn>

      {/* Recent — quiet list */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink-mute">
            Recent
          </h2>
          <Link
            href="/projects"
            className="text-[13px] text-ink-soft transition hover:text-ink"
          >
            View all
          </Link>
        </div>
        <StaggerIn className="space-y-2">
          {RECENT.map((r) => (
            <Link
              key={r.name}
              href="/results"
              className="flex items-center justify-between rounded-panel border border-line bg-surface/60 px-5 py-4 transition hover:border-line-strong hover:bg-elevated/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="h-4 w-4 shrink-0 text-ink-mute" />
                <span className="truncate text-[14px] font-medium">{r.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[12px] text-ink-mute">{r.when}</span>
                <Badge tone={r.status === "Ready" ? "success" : "mute"}>
                  {r.status}
                </Badge>
              </div>
            </Link>
          ))}
        </StaggerIn>
      </section>
    </PageEnter>
  );
}
