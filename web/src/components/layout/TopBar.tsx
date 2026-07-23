"use client";

import { Bell, Search, Moon, Cpu, Zap, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  upload: "Upload",
  classification: "Classification",
  results: "Results",
  dataset: "Dataset",
  analytics: "Analytics",
  models: "Models",
  training: "Training",
  settings: "Settings",
};

export function TopBar({
  gpuOk = true,
  fps = 42,
}: {
  gpuOk?: boolean;
  fps?: number;
}) {
  const pathname = usePathname();
  const seg = pathname.split("/").filter(Boolean)[0] || "";
  const crumb = LABELS[seg] || "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-canvas/70 px-6 backdrop-blur-2xl">
      {/* Breadcrumb */}
      <div className="hidden items-center gap-1.5 text-sm md:flex">
        <span className="text-ink-mute">Fracture</span>
        <ChevronRight className="h-3.5 w-3.5 text-ink-mute/60" />
        <span className="font-medium text-ink">{crumb}</span>
      </div>

      {/* Search */}
      <div className="relative ml-auto w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
        <input
          placeholder="Search videos, classes, models…"
          className={cn(
            "h-10 w-full rounded-2xl border border-line bg-elevated/50 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-mute",
            "transition focus:border-accent/40 focus:bg-elevated focus:ring-2 focus:ring-accent/20"
          )}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-ink-mute sm:inline">
          ⌘K
        </kbd>
      </div>

      {/* Status chips */}
      <div className="hidden items-center gap-2 lg:flex">
        <Badge tone={gpuOk ? "success" : "danger"} className="gap-1.5">
          <Cpu className="h-3 w-3" />
          {gpuOk ? "GPU Ready" : "CPU"}
        </Badge>
        <Badge tone="accent" className="gap-1.5">
          <Zap className="h-3 w-3" />
          {fps} FPS
        </Badge>
      </div>

      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-elevated/40 text-ink-soft transition hover:border-line-strong hover:text-ink"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </button>

      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-elevated/40 text-ink-soft transition hover:border-line-strong hover:text-ink"
        aria-label="Theme"
      >
        <Moon className="h-4 w-4" />
      </button>

      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-hi text-xs font-bold text-white shadow-glow">
        Y
      </div>
    </header>
  );
}
