"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import {
  Home,
  Upload,
  Clapperboard,
  Layers3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Minimal SpotiFLAC-style rail — icons only. */
const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/classification", label: "Classify", icon: Layers3 },
  { href: "/results", label: "Results", icon: Clapperboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-nav-item]"),
        { autoAlpha: 0, y: 10, scale: 0.9 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "back.out(1.6)",
          delay: 0.08,
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <aside
      ref={railRef}
      className="relative z-40 flex h-screen w-[64px] shrink-0 flex-col items-center border-r border-white/[0.06] bg-[#0c0c0e] py-5"
    >
      {/* Icon rail only — no brand wordmark */}
      <nav className="flex flex-1 flex-col items-center gap-2 pt-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              data-nav-item
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative grid h-11 w-11 place-items-center rounded-2xl transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                active
                  ? "bg-accent text-white shadow-[0_0_24px_rgba(124,58,237,0.35)]"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100"
              )}
              onMouseEnter={(e) => {
                const icon = e.currentTarget.querySelector("[data-icon]");
                const tip = e.currentTarget.querySelector("[data-tip]");
                if (icon) {
                  gsap.fromTo(
                    icon,
                    { scale: 1, rotate: 0 },
                    {
                      scale: 1.18,
                      rotate: active ? 0 : -8,
                      duration: 0.28,
                      ease: "back.out(2.5)",
                      yoyo: true,
                      repeat: 1,
                      yoyoEase: "power2.inOut",
                    }
                  );
                }
                if (tip) {
                  gsap.fromTo(
                    tip,
                    { autoAlpha: 0, x: -6, scale: 0.92 },
                    {
                      autoAlpha: 1,
                      x: 0,
                      scale: 1,
                      duration: 0.22,
                      ease: "power3.out",
                    }
                  );
                }
              }}
              onMouseLeave={(e) => {
                const icon = e.currentTarget.querySelector("[data-icon]");
                const tip = e.currentTarget.querySelector("[data-tip]");
                if (icon) gsap.to(icon, { scale: 1, rotate: 0, duration: 0.2 });
                if (tip) {
                  gsap.to(tip, {
                    autoAlpha: 0,
                    x: -4,
                    duration: 0.15,
                    ease: "power2.in",
                  });
                }
              }}
            >
              <span data-icon className="inline-flex">
                <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.25 : 1.85} />
              </span>

              {/* Hover label chip (SpotiFLAC-style flyout) */}
              <span
                data-tip
                className="pointer-events-none absolute left-[calc(100%+10px)] z-50 whitespace-nowrap rounded-lg border border-white/10 bg-[#16161a] px-2.5 py-1 text-[11px] font-medium text-zinc-100 opacity-0 shadow-lg"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Tiny mark at bottom — icon only */}
      <div
        data-nav-item
        className="mb-1 grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-[12px] font-bold text-accent-hi ring-1 ring-accent/25"
        aria-hidden
      >
        F
      </div>
    </aside>
  );
}
