"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [tab, setTab] = useState<"general" | "clustering" | "export" | "status">(
    "general"
  );
  const [eps, setEps] = useState(0.35);
  const [minSamples, setMinSamples] = useState(2);
  const [accurate, setAccurate] = useState(false);
  const [accent, setAccent] = useState("violet");

  const tabs = [
    { id: "general", label: "General" },
    { id: "clustering", label: "Clustering" },
    { id: "export", label: "Export" },
    { id: "status", label: "Status" },
  ] as const;

  return (
    <PageEnter className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="mute">Preferences</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-ink-soft">
            Tune clustering, export fidelity, and appearance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Reset</Button>
          <Button>Save changes</Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-medium transition",
              tab === t.id
                ? "bg-accent text-white shadow-glow"
                : "border border-line bg-elevated/40 text-ink-soft hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Theme and accent</CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-xl gap-5">
            <Field label="Accent">
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-11 w-full rounded-2xl border border-line bg-elevated/50 px-3 text-sm outline-none focus:border-accent/40"
              >
                <option value="violet">Violet</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
              </select>
            </Field>
            <Field label="Motion">
              <label className="flex items-center justify-between rounded-2xl border border-line bg-elevated/40 px-4 py-3 text-sm">
                Enable GSAP transitions
                <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
              </label>
            </Field>
          </CardContent>
        </Card>
      )}

      {tab === "clustering" && (
        <Card>
          <CardHeader>
            <CardTitle>Clustering</CardTitle>
            <CardDescription>DBSCAN on L2-normalized CLIP embeddings</CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-xl gap-6">
            <Field label={`Epsilon · ${eps.toFixed(2)}`}>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.05}
                value={eps}
                onChange={(e) => setEps(Number(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
            </Field>
            <Field label={`Min samples · ${minSamples}`}>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={minSamples}
                onChange={(e) => setMinSamples(Number(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
            </Field>
            <Button variant="secondary">Recluster with cached embeddings</Button>
          </CardContent>
        </Card>
      )}

      {tab === "export" && (
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>Lossless mux vs accurate cuts</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-elevated/40 px-4 py-4">
              <div>
                <div className="text-sm font-medium">Accurate export</div>
                <div className="text-xs text-ink-mute">
                  Re-encode boundaries for frame-perfect cuts (slower)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccurate((v) => !v)}
                className={cn(
                  "relative h-7 w-12 rounded-full transition",
                  accurate ? "bg-accent" : "bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white transition",
                    accurate ? "left-5" : "left-0.5"
                  )}
                />
              </button>
            </label>
          </CardContent>
        </Card>
      )}

      {tab === "status" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["FFmpeg", "OK"],
            ["AI model", "Ready"],
            ["API", "http://127.0.0.1:8765"],
            ["UI", "Next.js 15"],
          ].map(([k, v]) => (
            <Card key={k}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-ink-mute">
                  {k}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{v}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageEnter>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
