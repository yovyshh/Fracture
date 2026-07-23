"use client";

import { Bell, Cpu, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Minimal chrome — search, model, GPU, notify, avatar. Nothing else. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/75 px-5 backdrop-blur-xl">
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-mute" />
        <input
          placeholder="Search projects…"
          className={cn(
            "h-9 w-full rounded-[12px] border border-line bg-elevated/40 pl-9 pr-3 text-[13px] text-ink outline-none",
            "placeholder:text-ink-mute focus:border-accent/35 focus:ring-2 focus:ring-accent/15"
          )}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge tone="mute" className="hidden sm:inline-flex">
          clip-ViT-B-32
        </Badge>
        <Badge tone="success" className="hidden gap-1.5 md:inline-flex">
          <Cpu className="h-3 w-3" />
          GPU
        </Badge>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-[12px] border border-line bg-elevated/40 text-ink-soft transition hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-accent to-accent-hi text-[11px] font-semibold text-white">
          Y
        </div>
      </div>
    </header>
  );
}
