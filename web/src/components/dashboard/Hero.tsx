"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { Upload, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, pollJob } from "@/lib/api";

/** Centered SpotiFLAC-style home hero — brand lives here, not in the sidebar. */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el) return;
      gsap.fromTo(
        el.querySelectorAll("[data-hero]"),
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: "fracture.out",
          clearProps: "transform,opacity",
        }
      );
    },
    { scope: rootRef }
  );

  async function importPath(p: string) {
    const clean = p.trim().replace(/^["']|["']$/g, "");
    if (!clean) return;
    setBusy(true);
    setError(null);
    setStatus("Starting…");
    try {
      const { job_id } = await api.importVideo(clean);
      const job = await pollJob(job_id, (j) => setStatus(j.message || "Working…"));
      if (job.status === "error") throw new Error(job.error || job.message || "Failed");
      setStatus("Done");
      router.push("/classification");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("Failed to fetch")
          ? `API offline (${api.base}). Run: python -m uvicorn server:app --port 8765`
          : msg
      );
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPath(file.name);
    setStatus(`Uploading ${file.name}…`);
    try {
      const up = await api.uploadFile(file);
      setPath(up.path);
      setStatus("Analyzing…");
      const { job_id } = await api.importVideo(up.path);
      const job = await pollJob(job_id, (j) => setStatus(j.message || "Working…"));
      if (job.status === "error") throw new Error(job.error || job.message || "Failed");
      router.push("/classification");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("Failed to fetch")
          ? `API offline (${api.base}). Start the backend first.`
          : msg
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      ref={rootRef}
      className="relative z-10 mx-auto flex max-w-2xl flex-col items-center pt-6 text-center"
    >
      <input
        ref={fileRef}
        type="file"
        accept=".mp4,.mkv,.avi,.mov,.webm,.m4v,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void onFile(f);
        }}
      />

      <div data-hero className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-hi text-lg font-bold text-white shadow-glow">
          F
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Fracture
        </h1>
        <Badge tone="accent" className="mt-1">
          v2.0
        </Badge>
      </div>

      <p data-hero className="max-w-lg text-sm leading-relaxed text-ink-soft md:text-[15px]">
        Local AI scene split · cluster · lossless export — no account required.
      </p>

      <div data-hero className="mt-8 flex w-full max-w-xl items-center gap-2">
        <div className="relative flex-1">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            disabled={busy}
            placeholder="Path to video or click Import to browse…"
            className="h-12 w-full rounded-2xl border border-line bg-elevated/60 px-4 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-accent/40 focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter") void importPath(path);
            }}
          />
        </div>
        <Button
          type="button"
          size="lg"
          className="shrink-0 px-6"
          disabled={busy}
          onClick={() => {
            if (path.trim() && !path.includes("/") && !path.includes("\\") && path === path.split(/[/\\]/).pop()) {
              // looks like bare filename — open picker instead
              fileRef.current?.click();
              return;
            }
            if (path.trim()) void importPath(path);
            else fileRef.current?.click();
          }}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Working
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import
            </>
          )}
        </Button>
      </div>

      {status && (
        <p data-hero className="mt-3 text-xs text-ink-soft">
          {status}
        </p>
      )}
      {error && (
        <p data-hero className="mt-3 max-w-lg text-xs text-danger">
          {error}
        </p>
      )}

      <div data-hero className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href="/classification">
            <Play className="h-3.5 w-3.5" />
            Classify
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/results">Results</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
    </section>
  );
}
