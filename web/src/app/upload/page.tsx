"use client";

import { DropZone } from "@/components/upload/DropZone";
import { PageEnter } from "@/components/motion/Reveal";
import { Pipeline } from "@/components/dashboard/Pipeline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UploadPage() {
  return (
    <PageEnter className="space-y-8">
      <header className="space-y-2">
        <Badge tone="accent">Import</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Upload</h1>
        <p className="max-w-2xl text-sm text-ink-soft">
          Bring footage into Fracture. We never upload your media — analysis
          stays on this machine.
        </p>
      </header>

      <DropZone
        onPath={(p) => {
          console.log("import path", p);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Pipeline activeIndex={0} />
        <Card>
          <CardHeader>
            <CardTitle>Guidelines</CardTitle>
            <CardDescription>Best results with these inputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-ink-soft">
            <p>• Prefer progressive MP4/H.264 for fastest lossless export.</p>
            <p>• Long films are auto-capped to ~120 keyframe samples.</p>
            <p>• Paste absolute paths when using the desktop shell.</p>
            <p>• FFmpeg + ffprobe must be on PATH.</p>
          </CardContent>
        </Card>
      </div>
    </PageEnter>
  );
}
