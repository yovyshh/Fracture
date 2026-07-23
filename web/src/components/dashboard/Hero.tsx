"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Centered SpotiFLAC-style home hero — brand lives here, not in the sidebar. */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-hero]"),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative mx-auto flex max-w-2xl flex-col items-center pt-6 text-center"
    >
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
            placeholder="Path to video (.mp4 / .mkv / .mov)…"
            className="h-12 w-full rounded-2xl border border-line bg-elevated/60 px-4 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <Button asChild size="lg" className="shrink-0 px-6">
          <Link href="/upload">
            <Upload className="h-4 w-4" />
            Import
          </Link>
        </Button>
      </div>

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
