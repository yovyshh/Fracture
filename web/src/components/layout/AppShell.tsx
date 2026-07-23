"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Lenis smooth scroll on main column only (body overflow handled by shell)
    const wrapper = document.getElementById("main-scroll");
    if (!wrapper) return;

    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative flex min-h-screen bg-canvas text-ink">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-hero-glow" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 20%, black 20%, transparent 75%)",
        }}
      />
      {/* Floating particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="absolute left-[12%] top-[20%] h-1 w-1 rounded-full bg-accent-hi/40 animate-float" />
        <span className="absolute left-[70%] top-[35%] h-1.5 w-1.5 rounded-full bg-accent/30 animate-float [animation-delay:1s]" />
        <span className="absolute left-[40%] top-[70%] h-1 w-1 rounded-full bg-white/20 animate-float [animation-delay:2s]" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main-scroll" className="relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-8 pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
