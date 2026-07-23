"use client";

import { Sidebar } from "./Sidebar";

/**
 * SpotiFLAC-like shell:
 * - icon-only left rail
 * - no top chrome / breadcrumb bar
 * - native scroll only (smooth-scroll libs can steal clicks)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-canvas text-ink">
      {/* Soft ambient — pointer-events none so clicks pass through */}
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-70" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 15%, black 15%, transparent 70%)",
        }}
      />

      <Sidebar />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1100px] px-6 py-10 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
