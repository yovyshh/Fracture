"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-0 bg-ambient" />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-workspace px-6 py-10 pb-20 md:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
