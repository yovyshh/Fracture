"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  LayoutDashboard,
  Upload,
  Layers3,
  Clapperboard,
  Database,
  ChartLine,
  Cpu,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/classification", label: "Classification", icon: Layers3 },
  { href: "/results", label: "Results", icon: Clapperboard },
  { href: "/dataset", label: "Dataset", icon: Database },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/training", label: "Training", icon: GraduationCap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { x: -20, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  return (
    <aside
      ref={railRef}
      className={cn(
        "relative z-30 flex h-screen flex-col border-r border-line bg-surface/70 backdrop-blur-2xl transition-[width] duration-300 ease-out",
        expanded ? "w-[248px]" : "w-[76px]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-6">
        <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-accent-soft ring-1 ring-accent/30 shadow-glow">
          <span className="text-sm font-bold tracking-tight text-accent-hi">F</span>
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-accent/20 blur-md" />
        </div>
        {expanded && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-ink">
              Fracture
            </div>
            <div className="truncate text-[11px] text-ink-mute">Video Classifier</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-accent-soft text-ink shadow-[inset_0_0_0_1px_rgba(124,58,237,0.25)]"
                  : "text-ink-soft hover:bg-white/[0.03] hover:text-ink"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                  active ? "text-accent-hi" : "text-ink-mute group-hover:text-ink"
                )}
              />
              {expanded && <span className="truncate font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse */}
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-elevated/60 px-3 py-2 text-xs text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          {expanded ? (
            <>
              <ChevronLeft className="h-4 w-4" /> Collapse
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
