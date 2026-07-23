"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Stagger-fade children on mount — never leaves nodes unclickable. */
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

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = el.children;
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger,
          delay,
          ease: "fracture.out",
          clearProps: "transform,opacity",
          onComplete: () => {
            gsap.set(items, { clearProps: "all" });
          },
        }
      );
    },
    { scope: ref, dependencies: [y, stagger, delay] }
  );

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

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "fracture.out",
          clearProps: "transform,opacity",
          onComplete: () => {
            gsap.set(el, { clearProps: "all" });
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
