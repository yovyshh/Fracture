"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "dark" | "light";
export type AccentId = "violet" | "blue" | "green" | "amber";

type ThemeState = {
  mode: ThemeMode;
  accent: AccentId;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentId) => void;
  toggleMode: () => void;
};

const ThemeCtx = createContext<ThemeState | null>(null);

const ACCENT_HEX: Record<AccentId, { main: string; hi: string; soft: string }> = {
  violet: {
    main: "#7C3AED",
    hi: "#A78BFA",
    soft: "rgba(124,58,237,0.15)",
  },
  blue: {
    main: "#3B82F6",
    hi: "#60A5FA",
    soft: "rgba(59,130,246,0.15)",
  },
  green: {
    main: "#22C55E",
    hi: "#4ADE80",
    soft: "rgba(34,197,94,0.15)",
  },
  amber: {
    main: "#F59E0B",
    hi: "#FBBF24",
    soft: "rgba(245,158,11,0.18)",
  },
};

function applyDom(mode: ThemeMode, accent: AccentId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.accent = accent;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");

  const a = ACCENT_HEX[accent];
  root.style.setProperty("--accent", a.main);
  root.style.setProperty("--accent-hi", a.hi);
  root.style.setProperty("--accent-soft", a.soft);
  root.style.setProperty("--accent-glow", a.main + "73"); // ~45% alpha hex approx fallback

  if (mode === "light") {
    root.style.setProperty("--canvas", "#F4F4F5");
    root.style.setProperty("--surface", "#FFFFFF");
    root.style.setProperty("--elevated", "#F4F4F5");
    root.style.setProperty("--ink", "#18181B");
    root.style.setProperty("--ink-soft", "#52525B");
    root.style.setProperty("--ink-mute", "#71717A");
    root.style.setProperty("--line", "rgba(0,0,0,0.08)");
    root.style.setProperty("--line-strong", "rgba(0,0,0,0.12)");
  } else {
    root.style.setProperty("--canvas", "#09090B");
    root.style.setProperty("--surface", "#111113");
    root.style.setProperty("--elevated", "#16161A");
    root.style.setProperty("--ink", "#FAFAFA");
    root.style.setProperty("--ink-soft", "#A1A1AA");
    root.style.setProperty("--ink-mute", "#71717A");
    root.style.setProperty("--line", "rgba(255,255,255,0.06)");
    root.style.setProperty("--line-strong", "rgba(255,255,255,0.10)");
  }
}

const STORAGE_KEY = "fracture.theme.v1";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [accent, setAccentState] = useState<AccentId>("violet");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { mode?: ThemeMode; accent?: AccentId };
        if (parsed.mode === "dark" || parsed.mode === "light") setModeState(parsed.mode);
        if (parsed.accent && parsed.accent in ACCENT_HEX) setAccentState(parsed.accent);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyDom(mode, accent);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent }));
    } catch {
      /* ignore */
    }
  }, [mode, accent, ready]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const setAccent = useCallback((a: AccentId) => setAccentState(a), []);
  const toggleMode = useCallback(
    () => setModeState((m) => (m === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo(
    () => ({ mode, accent, setMode, setAccent, toggleMode }),
    [mode, accent, setMode, setAccent, toggleMode]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
