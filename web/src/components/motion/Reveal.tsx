"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/** Stagger-fade children on mount (GSAP) — never leaves nodes unclickable. */
export function StaggerIn({
  children,
  className,
  y = 14,
  stagger = 0.05,
  delay = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.children;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger,
          delay,
          ease: "power3.out",
          clearProps: "transform,opacity",
          onComplete: () => {
            gsap.set(items, { clearProps: "all" });
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [y, stagger, delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

/** Soft page enter — opacity only (no visibility:hidden). */
export function PageEnter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power3.out",
          clearProps: "transform,opacity",
          onComplete: () => {
            gsap.set(el, { clearProps: "all" });
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
