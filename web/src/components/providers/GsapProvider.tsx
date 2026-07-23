"use client";

/**
 * Side-effect client boundary: ensures GSAP plugins register in the browser
 * as soon as the app shell mounts.
 */
import "@/lib/gsap";

export function GsapProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
