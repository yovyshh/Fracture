"use client";

import Link from "next/link";
import { PageEnter, StaggerIn } from "@/components/motion/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const PROJECTS = [
  {
    name: "Campaign cutdowns",
    videos: 12,
    updated: "Today",
    tone: "success" as const,
  },
  {
    name: "Interview series",
    videos: 8,
    updated: "Yesterday",
    tone: "accent" as const,
  },
  {
    name: "Product launches",
    videos: 5,
    updated: "Mon",
    tone: "mute" as const,
  },
  {
    name: "Archive restore",
    videos: 21,
    updated: "Last week",
    tone: "mute" as const,
  },
];

export default function ProjectsPage() {
  return (
    <PageEnter className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-[14px] text-ink-soft">
            Collections of videos and classification runs.
          </p>
        </div>
        <Button asChild>
          <Link href="/inference">
            <Plus className="h-4 w-4" />
            New run
          </Link>
        </Button>
      </header>

      <StaggerIn className="grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <Link key={p.name} href="/results" className="group block">
            <Card className="h-full transition duration-300 group-hover:-translate-y-0.5 group-hover:border-accent/25">
              <CardContent className="flex h-full flex-col justify-between gap-8 p-6">
                <div>
                  <Badge tone={p.tone} className="mb-4">
                    {p.videos} videos
                  </Badge>
                  <h2 className="text-[18px] font-semibold tracking-tight">
                    {p.name}
                  </h2>
                </div>
                <div className="text-[12px] text-ink-mute">Updated {p.updated}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </StaggerIn>
    </PageEnter>
  );
}
