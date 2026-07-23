"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { motion } from "framer-motion";
import { Sparkles, Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  const orbRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { autoAlpha: 0, y: 24, filter: "blur(8px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
        }
      );
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          y: -12,
          duration: 3.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-line bg-surface/60 p-8 shadow-card backdrop-blur-xl md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="accent" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-hi animate-pulse" />
              Systems online
            </Badge>
            <Badge tone="mute">Local · Offline capable</Badge>
          </div>

          <h1
            ref={titleRef}
            className="max-w-xl text-4xl font-semibold tracking-tight text-ink md:text-5xl md:leading-[1.08]"
          >
            AI Video Classification{" "}
            <span className="bg-gradient-to-r from-accent-hi via-white to-accent bg-clip-text text-transparent">
              Platform
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Split scenes, cluster with CLIP, and export lossless cuts — designed
            with the calm precision of Linear, the craft of Apple, and the
            motion language of modern AI products.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/upload">
                <Upload className="h-4 w-4" />
                Upload video
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/classification">
                <Play className="h-4 w-4" />
                Quick analyze
              </Link>
            </Button>
            <div className="flex items-center gap-2 pl-1 text-xs text-ink-mute">
              <Sparkles className="h-3.5 w-3.5 text-accent-hi" />
              CLIP + DBSCAN · FFmpeg lossless
            </div>
          </div>
        </div>

        {/* Glowing orb visual */}
        <div className="relative mx-auto grid h-[240px] w-full max-w-[320px] place-items-center">
          <div
            ref={orbRef}
            className="relative h-40 w-40 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #C4B5FD, #7C3AED 45%, rgba(9,9,11,0.2) 70%)",
              boxShadow:
                "0 0 80px rgba(124,58,237,0.55), inset 0 0 40px rgba(255,255,255,0.15)",
            }}
          >
            <motion.div
              className="absolute inset-3 rounded-full border border-white/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-8 rounded-full border border-accent-hi/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="absolute bottom-4 rounded-full border border-line bg-canvas/70 px-3 py-1 text-[11px] text-ink-soft backdrop-blur">
            inference orb · live
          </div>
        </div>
      </div>
    </section>
  );
}
