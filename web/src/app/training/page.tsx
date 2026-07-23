"use client";

import { useEffect, useState } from "react";
import { PageEnter } from "@/components/motion/Reveal";
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
import { LiveInferencePanel } from "@/components/dashboard/Pipeline";

export default function TrainingPage() {
  const [epoch, setEpoch] = useState(42);
  const [loss, setLoss] = useState(0.18);

  useEffect(() => {
    const id = setInterval(() => {
      setEpoch((e) => (e >= 60 ? 42 : e + 1));
      setLoss((l) => Math.max(0.08, l * 0.985 + Math.random() * 0.002));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <PageEnter className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="success" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Training
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Training</h1>
          <p className="max-w-xl text-sm text-ink-soft">
            Live loop for fine-tuning the classification head.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Pause</Button>
          <Button variant="danger">Stop</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Run status</CardTitle>
            <CardDescription>epoch {epoch} / 60</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs text-ink-mute">
                <span>Epoch progress</span>
                <span>{Math.round((epoch / 60) * 100)}%</span>
              </div>
              <Progress value={(epoch / 60) * 100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Train loss" value={loss.toFixed(3)} />
              <Metric label="Val loss" value={(loss * 1.08).toFixed(3)} />
              <Metric label="LR" value="2.5e-5" />
              <Metric label="Batch" value="32" />
            </div>
          </CardContent>
        </Card>
        <LiveInferencePanel
          progress={Math.round((epoch / 60) * 100)}
          model="clip-ViT-B-32 · finetune"
          fps={28}
          gpu={88}
        />
      </div>
    </PageEnter>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-elevated/40 px-3 py-3">
      <div className="text-[11px] text-ink-mute">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
