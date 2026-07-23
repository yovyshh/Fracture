"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  ChartColumn,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Exactly five destinations — no trees, no clutter. */
const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/inference", label: "Inference", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const railRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        railRef.current,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.45, ease: "power3.out", clearProps: "transform,opacity" }
      );
    },
    { scope: railRef }
  );

  return (
    <aside
      ref={railRef}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "relative z-40 flex h-screen shrink-0 flex-col border-r border-line bg-surface/80 backdrop-blur-xl transition-[width] duration-300 ease-out",
        expanded ? "w-[200px]" : "w-[68px]"
      )}
    >
      {/* Mark only — no product essay */}
      <div className="flex h-14 items-center gap-3 px-4 pt-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-accent text-sm font-semibold text-white shadow-glow">
          F
        </div>
        <span
          className={cn(
            "truncate text-[13px] font-semibold tracking-tight text-ink transition-opacity duration-200",
            expanded ? "opacity-100" : "opacity-0"
          )}
        >
          Fracture
        </span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-2.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-[14px] px-2.5 text-[13px] font-medium transition-colors duration-200",
                active
                  ? "bg-accent-soft text-ink"
                  : "text-ink-mute hover:bg-white/[0.04] hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-transform duration-200 group-hover:scale-105",
                  active ? "bg-accent text-white" : "text-ink-soft"
                )}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span
                className={cn(
                  "truncate transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
