"use client";

import { useEffect, useState } from "react";
import { PageEnter } from "@/components/motion/Reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  useTheme,
  type AccentId,
  type ThemeMode,
} from "@/components/providers/ThemeProvider";

export default function SettingsPage() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [eps, setEps] = useState(0.35);
  const [accurate, setAccurate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState("…");

  useEffect(() => {
    api
      .health()
      .then((h) =>
        setApiStatus(
          h.ok
            ? `OK · FFmpeg ${h.ffmpeg ? "yes" : "no"} · model ${h.model_ready ? "ready" : "loading"}`
            : "Down"
        )
      )
      .catch(() => setApiStatus(`Offline (${api.base})`));
  }, []);

  async function save() {
    try {
      await api.setSettings({
        eps,
        min_samples: 2,
        accurate_export: accurate,
        theme: mode,
        accent,
      });
      setMsg("Saved");
    } catch {
      setMsg("Theme saved in browser · API offline");
    }
  }

  return (
    <PageEnter className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="text-[32px] font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Appearance and inference preferences.
        </p>
      </header>

      {msg && (
        <div className="rounded-[16px] border border-success/25 bg-success/10 px-4 py-3 text-[13px] text-success">
          {msg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2">
            {(["dark", "light"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setMsg(null);
                }}
                className={cn(
                  "h-11 flex-1 rounded-[14px] border text-[13px] font-medium capitalize transition",
                  mode === m
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-elevated/40 text-ink-soft hover:border-line-strong"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["violet", "#7C3AED"],
                ["blue", "#3B82F6"],
                ["green", "#22C55E"],
                ["amber", "#F59E0B"],
              ] as [AccentId, string][]
            ).map(([id, color]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAccent(id);
                  setMsg(null);
                }}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-[14px] border text-[12px] font-medium capitalize",
                  accent === id
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-elevated/40"
                )}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: color }}
                />
                {id}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="block space-y-2">
            <span className="text-[13px] text-ink-soft">
              Cluster epsilon · {eps.toFixed(2)}
            </span>
            <input
              type="range"
              min={0.05}
              max={1.5}
              step={0.05}
              value={eps}
              onChange={(e) => setEps(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--accent)" }}
            />
          </label>
          <button
            type="button"
            onClick={() => setAccurate((v) => !v)}
            className="flex w-full items-center justify-between rounded-[16px] border border-line bg-elevated/30 px-4 py-3 text-left"
          >
            <div>
              <div className="text-[13px] font-medium">Accurate export</div>
              <div className="text-[12px] text-ink-mute">Frame-perfect cuts</div>
            </div>
            <span
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
            </span>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System</CardTitle>
        </CardHeader>
        <CardContent className="text-[13px] text-ink-soft">
          <div className="flex justify-between gap-4 border-b border-line py-3">
            <span className="text-ink-mute">Model</span>
            <span>clip-ViT-B-32</span>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <span className="text-ink-mute">API</span>
            <span className="text-right">{apiStatus}</span>
          </div>
        </CardContent>
      </Card>

      <Button type="button" className="w-full" onClick={() => void save()}>
        Save preferences
      </Button>
    </PageEnter>
  );
}
