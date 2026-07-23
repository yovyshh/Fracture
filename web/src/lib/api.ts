/**
 * Fracture API client — talks to the Python FastAPI backend.
 * Default: http://127.0.0.1:8765 (override with NEXT_PUBLIC_API_URL)
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8765";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail || j.message || detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

export type Health = {
  ok: boolean;
  ffmpeg: boolean;
  model_ready: boolean;
  model_error: string | null;
};

export type Session = {
  video_path: string | null;
  video_name: string | null;
  scenes: Scene[];
  timeline: Scene[];
  eps: number;
  min_samples: number;
  accurate_export: boolean;
  theme: string;
  accent: string;
  recent: { path: string; name: string; ts: number }[];
  model_ready: boolean;
  ffmpeg: boolean;
};

export type Scene = {
  id: number;
  start_time: number;
  end_time: number;
  duration: number;
  cluster: number;
  frame_url: string;
};

export type Job = {
  id: string;
  kind: string;
  status: "running" | "done" | "error" | "cancelled";
  progress: number;
  message: string;
  error?: string | null;
  result?: Record<string, unknown> | null;
};

export const api = {
  base: API_BASE,
  health: () => request<Health>("/api/health"),
  session: () => request<Session>("/api/session"),
  /** Save browser File to server temp dir, returns absolute path. */
  uploadFile: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ path: string; name: string }>("/api/upload", {
      method: "POST",
      body: fd,
    });
  },
  importVideo: (path: string) =>
    request<{ job_id: string }>("/api/import", {
      method: "POST",
      body: JSON.stringify({ path }),
    }),
  exportVideo: (output_path: string, scenes?: Scene[]) =>
    request<{ job_id: string }>("/api/export", {
      method: "POST",
      body: JSON.stringify({ output_path, scenes }),
    }),
  recluster: (eps?: number, min_samples?: number) =>
    request<{ job_id: string }>("/api/recluster", {
      method: "POST",
      body: JSON.stringify({ eps, min_samples }),
    }),
  setSettings: (body: {
    eps?: number;
    min_samples?: number;
    accurate_export?: boolean;
    theme?: string;
    accent?: string;
  }) =>
    request<{ ok: boolean }>("/api/settings", {
      method: "POST",
      body: JSON.stringify({
        eps: body.eps ?? 0.35,
        min_samples: body.min_samples ?? 2,
        accurate_export: body.accurate_export ?? false,
        theme: body.theme ?? "dark",
        accent: body.accent ?? "violet",
      }),
    }),
  setTimeline: (scenes: Scene[]) =>
    request<{ ok: boolean; count: number; duration: number }>("/api/timeline", {
      method: "POST",
      body: JSON.stringify({ scenes }),
    }),
  job: (id: string) => request<Job>(`/api/jobs/${id}`),
  cancelJob: (id: string) =>
    request<{ ok: boolean }>(`/api/jobs/${id}/cancel`, { method: "POST" }),
  frameUrl: (sceneId: number) => `${API_BASE}/api/frame/${sceneId}`,
};

/** Poll a job until terminal state. */
export async function pollJob(
  jobId: string,
  onProgress?: (job: Job) => void,
  intervalMs = 400
): Promise<Job> {
  for (;;) {
    const job = await api.job(jobId);
    onProgress?.(job);
    if (job.status !== "running") return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
