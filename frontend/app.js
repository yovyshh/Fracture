/* Fracture frontend — SpotiFLAC-inspired SPA */
(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const state = {
    session: null,
    timeline: [],
    clusterFilter: null,
    activeJobId: null,
    ws: null,
  };

  const CLUSTER_COLORS = [
    "#8b5cf6", "#a78bfa", "#22c55e", "#38bdf8", "#f472b6",
    "#f59e0b", "#2dd4bf", "#60a5fa", "#c084fc", "#4ade80",
  ];

  // ── API ─────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = await res.json();
        msg = j.detail || j.message || msg;
        if (Array.isArray(msg)) msg = msg.map((x) => x.msg || x).join("; ");
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  // ── Toasts / Modal ──────────────────────────────────
  function toast(title, message = "", type = "info") {
    const root = $("#toasts");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="t">${esc(title)}</div>${message ? `<div class="m">${esc(message)}</div>` : ""}`;
    root.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "all .25s ease";
      setTimeout(() => el.remove(), 250);
    }, 3800);
  }

  function modal(title, body) {
    $("#modal-title").textContent = title;
    $("#modal-body").textContent = body;
    $("#modal").classList.remove("hidden");
  }
  $("#modal-ok").onclick = () => $("#modal").classList.add("hidden");

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Status / progress ───────────────────────────────
  function setStatus(text, busy = false) {
    $("#status-text").textContent = text;
    $("#pulse").classList.toggle("busy", busy);
  }

  function setProgress(pct, show = true) {
    const wrap = $("#progress-wrap");
    if (!show) {
      wrap.classList.add("hidden");
      return;
    }
    wrap.classList.remove("hidden");
    const p = Math.max(0, Math.min(100, pct | 0));
    $("#progress-fill").style.width = p + "%";
    $("#progress-pct").textContent = p + "%";
  }

  // ── Pages / tabs ────────────────────────────────────
  function showPage(name) {
    $$(".page").forEach((p) => p.classList.remove("active"));
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.page === name));
    $(`#page-${name}`)?.classList.add("active");
  }
  $$(".nav-btn").forEach((b) => b.addEventListener("click", () => showPage(b.dataset.page)));
  $("#crumb-home")?.addEventListener("click", () => showPage("home"));

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      $$(".settings-panel").forEach((p) =>
        p.classList.toggle("active", p.dataset.panel === tab.dataset.tab)
      );
    });
  });

  // ── Theme ───────────────────────────────────────────
  function applyTheme() {
    const theme = $("#set-theme").value;
    const accent = $("#set-accent").value;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
  }

  // ── Render ──────────────────────────────────────────
  function renderSession(s) {
    state.session = s;
    // settings fields
    $("#set-eps").value = s.eps ?? 0.35;
    $("#eps-val").textContent = Number(s.eps ?? 0.35).toFixed(2);
    $("#set-min").value = s.min_samples ?? 2;
    $("#min-val").textContent = s.min_samples ?? 2;
    $("#set-accurate").checked = !!s.accurate_export;
    if (s.theme) $("#set-theme").value = s.theme;
    if (s.accent) $("#set-accent").value = s.accent;
    applyTheme();

    // path
    if (s.video_path) $("#path-input").value = s.video_path;

    // status cards
    $("#stat-ffmpeg").textContent = s.ffmpeg ? "OK" : "Missing";
    $("#stat-ffmpeg").style.color = s.ffmpeg ? "var(--accent)" : "var(--danger)";
    $("#stat-model").textContent = s.model_ready ? "Ready" : "Loading…";
    $("#stat-scenes").textContent = String(s.scenes?.length || 0);
    $("#stat-timeline").textContent = String(state.timeline.length || s.timeline?.length || 0);

    renderRecent(s.recent || []);
    renderScenes(s.scenes || []);
    if (s.timeline?.length && !state.timeline.length) {
      state.timeline = [...s.timeline];
    }
    renderTimeline();
  }

  function renderRecent(items) {
    const root = $("#recent-chips");
    root.innerHTML = "";
    if (!items.length) {
      $("#recent-block").classList.add("hidden");
      return;
    }
    $("#recent-block").classList.remove("hidden");
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.style.animationDelay = `${i * 30}ms`;
      b.textContent = it.name || it.path;
      b.title = it.path;
      b.onclick = () => {
        $("#path-input").value = it.path;
        startImport(it.path);
      };
      root.appendChild(b);
    });
  }

  function renderScenes(scenes) {
    const has = scenes.length > 0;
    $("#cluster-block").classList.toggle("hidden", !has);
    $("#pool-block").classList.toggle("hidden", !has);

    // chips
    const chips = $("#cluster-chips");
    chips.innerHTML = "";
    const all = document.createElement("button");
    all.className = "chip" + (state.clusterFilter == null ? " active" : "");
    all.textContent = "All";
    all.onclick = () => {
      state.clusterFilter = null;
      renderScenes(state.session.scenes || []);
    };
    chips.appendChild(all);

    const clusters = [...new Set(scenes.map((s) => s.cluster))].sort((a, b) => a - b);
    clusters.forEach((c) => {
      const count = scenes.filter((s) => s.cluster === c).length;
      const b = document.createElement("button");
      b.className = "chip" + (state.clusterFilter === c ? " active" : "");
      const color = c < 0 ? "#a1a1aa" : CLUSTER_COLORS[c % CLUSTER_COLORS.length];
      b.style.borderColor = state.clusterFilter === c ? color : "";
      b.style.color = state.clusterFilter === c ? color : "";
      b.textContent = (c < 0 ? "noise" : `C${c}`) + ` · ${count}`;
      b.onclick = (e) => {
        if (e.shiftKey) {
          addCluster(c);
          return;
        }
        state.clusterFilter = c;
        renderScenes(state.session.scenes || []);
      };
      chips.appendChild(b);
    });

    const filtered =
      state.clusterFilter == null
        ? scenes
        : scenes.filter((s) => s.cluster === state.clusterFilter);

    $("#pool-meta").textContent = has
      ? `${filtered.length} / ${scenes.length} scenes`
      : "";

    const grid = $("#scene-grid");
    grid.innerHTML = "";
    filtered.forEach((s, i) => {
      const card = document.createElement("article");
      card.className = "scene-card";
      card.style.animationDelay = `${Math.min(i * 20, 400)}ms`;
      const color = s.cluster < 0 ? "#71717a" : CLUSTER_COLORS[s.cluster % CLUSTER_COLORS.length];
      card.innerHTML = `
        <div class="accent-bar" style="background:${color}"></div>
        <img src="${esc(s.frame_url)}" alt="" loading="lazy" />
        <div class="meta">
          <div class="title">${s.cluster < 0 ? "noise" : "Cluster " + s.cluster}</div>
          <div class="sub">${s.duration.toFixed(2)}s · ${s.start_time.toFixed(1)}s</div>
          <div class="badge ${s.cluster < 0 ? "noise" : ""}">${s.cluster < 0 ? "noise" : "C" + s.cluster}</div>
        </div>`;
      card.onclick = () => addToTimeline(s);
      card.oncontextmenu = (e) => {
        e.preventDefault();
        addCluster(s.cluster);
      };
      grid.appendChild(card);
    });
  }

  function renderTimeline() {
    const root = $("#timeline");
    const empty = $("#timeline-empty");
    // remove items but keep empty node
    [...root.querySelectorAll(".tl-item")].forEach((n) => n.remove());

    const total = state.timeline.reduce((a, s) => a + (s.duration || 0), 0);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    $("#duration-pill").textContent = mins ? `${mins}:${secs.toFixed(2).padStart(5, "0")}` : `${secs.toFixed(2)}s`;
    $("#btn-export").disabled = state.timeline.length === 0;
    $("#stat-timeline").textContent = String(state.timeline.length);

    if (!state.timeline.length) {
      empty?.classList.remove("hidden");
      return;
    }
    empty?.classList.add("hidden");

    state.timeline.forEach((s, idx) => {
      const row = document.createElement("div");
      row.className = "tl-item";
      row.draggable = true;
      row.dataset.idx = String(idx);
      row.style.animationDelay = `${Math.min(idx * 25, 300)}ms`;
      row.innerHTML = `
        <img src="${esc(s.frame_url)}" alt="" />
        <div class="info">
          <div class="t">${s.cluster < 0 ? "noise" : "C" + s.cluster} · ${s.duration.toFixed(2)}s</div>
          <div class="s">${s.start_time.toFixed(2)}s → ${s.end_time.toFixed(2)}s</div>
        </div>
        <button class="tl-del" type="button">DEL</button>`;
      row.querySelector(".tl-del").onclick = (e) => {
        e.stopPropagation();
        state.timeline.splice(idx, 1);
        syncTimeline();
        renderTimeline();
      };
      row.addEventListener("dragstart", (e) => {
        row.classList.add("dragging");
        e.dataTransfer.setData("text/plain", String(idx));
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (e) => e.preventDefault());
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("text/plain"));
        const to = idx;
        if (Number.isNaN(from) || from === to) return;
        const [item] = state.timeline.splice(from, 1);
        state.timeline.splice(to, 0, item);
        syncTimeline();
        renderTimeline();
      });
      root.appendChild(row);
    });
  }

  function addToTimeline(scene) {
    if (state.timeline.some((s) => s.id === scene.id && Math.abs(s.start_time - scene.start_time) < 1e-3)) {
      toast("Already on timeline", `Scene ${scene.id}`, "info");
      return;
    }
    state.timeline.push(scene);
    syncTimeline();
    renderTimeline();
    toast("Added", `${scene.duration.toFixed(2)}s clip`, "success");
  }

  function addCluster(clusterId) {
    const scenes = (state.session?.scenes || []).filter((s) => s.cluster === clusterId);
    let n = 0;
    scenes
      .slice()
      .sort((a, b) => a.start_time - b.start_time)
      .forEach((s) => {
        if (!state.timeline.some((t) => t.id === s.id)) {
          state.timeline.push(s);
          n++;
        }
      });
    syncTimeline();
    renderTimeline();
    toast("Cluster added", `${n} scenes`, "success");
  }

  async function syncTimeline() {
    try {
      await api("/api/timeline", {
        method: "POST",
        body: JSON.stringify({ scenes: state.timeline }),
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // ── Jobs ────────────────────────────────────────────
  async function trackJob(jobId) {
    state.activeJobId = jobId;
    $("#btn-cancel").classList.remove("hidden");
    setProgress(0, true);
    setStatus("Working…", true);

    // poll as backup to websocket
    const tick = async () => {
      if (state.activeJobId !== jobId) return;
      try {
        const job = await api(`/api/jobs/${jobId}`);
        onJob(job);
        if (job.status === "running") {
          setTimeout(tick, 400);
        }
      } catch {
        setTimeout(tick, 800);
      }
    };
    tick();
  }

  function onJob(job) {
    if (!job) return;
    if (job.status === "running") {
      setProgress(job.progress || 0, true);
      setStatus(job.message || "Working…", true);
    } else if (job.status === "done") {
      setProgress(100, true);
      setStatus(job.message || "Done", false);
      setTimeout(() => setProgress(0, false), 800);
      $("#btn-cancel").classList.add("hidden");
      state.activeJobId = null;
      if (job.kind === "export") {
        toast("Export complete", job.result?.output_path || "", "success");
      } else {
        toast("Analysis complete", job.message || "", "success");
      }
      refreshSession();
    } else if (job.status === "error") {
      setProgress(0, false);
      setStatus("Error", false);
      $("#btn-cancel").classList.add("hidden");
      state.activeJobId = null;
      modal("Error", job.error || job.message || "Something went wrong");
    } else if (job.status === "cancelled") {
      setProgress(0, false);
      setStatus("Cancelled", false);
      $("#btn-cancel").classList.add("hidden");
      state.activeJobId = null;
    }
  }

  // ── Actions ─────────────────────────────────────────
  async function startImport(path) {
    path = (path || $("#path-input").value || "").trim().replace(/^["']|["']$/g, "");
    if (!path) {
      // try native dialog via pywebview
      if (window.pywebview?.api?.open_file) {
        path = await window.pywebview.api.open_file();
        if (!path) return;
        $("#path-input").value = path;
      } else {
        toast("Choose a file", "Paste a path or use Browse", "info");
        return;
      }
    }
    try {
      state.timeline = [];
      const { job_id } = await api("/api/import", {
        method: "POST",
        body: JSON.stringify({ path }),
      });
      trackJob(job_id);
    } catch (e) {
      modal("Import failed", e.message);
    }
  }

  async function startExport() {
    if (!state.timeline.length) return;
    let out = null;
    if (window.pywebview?.api?.save_file) {
      out = await window.pywebview.api.save_file();
    } else {
      out = prompt("Export path (.mp4)", "C:\\Users\\Windows 11 Pro\\Videos\\fracture_out.mp4");
    }
    if (!out) return;
    try {
      const { job_id } = await api("/api/export", {
        method: "POST",
        body: JSON.stringify({ output_path: out, scenes: state.timeline }),
      });
      trackJob(job_id);
    } catch (e) {
      modal("Export failed", e.message);
    }
  }

  async function saveSettings() {
    applyTheme();
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify({
          eps: Number($("#set-eps").value),
          min_samples: Number($("#set-min").value),
          accurate_export: $("#set-accurate").checked,
          theme: $("#set-theme").value,
          accent: $("#set-accent").value,
        }),
      });
      toast("Settings saved", "", "success");
    } catch (e) {
      modal("Settings error", e.message);
    }
  }

  async function recluster() {
    await saveSettings();
    try {
      const { job_id } = await api("/api/recluster", {
        method: "POST",
        body: JSON.stringify({
          eps: Number($("#set-eps").value),
          min_samples: Number($("#set-min").value),
        }),
      });
      trackJob(job_id);
    } catch (e) {
      modal("Recluster failed", e.message);
    }
  }

  async function refreshSession() {
    try {
      const s = await api("/api/session");
      // keep local timeline if user has been editing
      const keepTl = state.timeline.length > 0;
      const tl = keepTl ? state.timeline : s.timeline || [];
      renderSession(s);
      if (keepTl) {
        state.timeline = tl;
        renderTimeline();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ── WS ──────────────────────────────────────────────
  function connectWs() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    state.ws = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "hello" || msg.type === "session") {
          if (msg.session) renderSession(msg.session);
        } else if (msg.type === "job") {
          onJob(msg.job);
        } else if (msg.type === "model") {
          $("#stat-model").textContent = msg.ready ? "Ready" : msg.error || "Loading…";
          if (msg.ready) setStatus("AI model ready", false);
        }
      } catch {}
    };
    ws.onclose = () => setTimeout(connectWs, 1500);
    setInterval(() => {
      if (ws.readyState === 1) ws.send("ping");
    }, 15000);
  }

  // ── Wire ────────────────────────────────────────────
  function wire() {
    $("#btn-import").onclick = () => startImport();
    $("#btn-browse").onclick = async () => {
      if (window.pywebview?.api?.open_file) {
        const p = await window.pywebview.api.open_file();
        if (p) {
          $("#path-input").value = p;
          startImport(p);
        }
      } else {
        toast("Browse", "Paste a full file path into the field", "info");
        $("#path-input").focus();
      }
    };
    $("#path-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") startImport();
    });
    $("#btn-export").onclick = startExport;
    $("#btn-clear-tl").onclick = () => {
      state.timeline = [];
      syncTimeline();
      renderTimeline();
    };
    $("#btn-add-cluster").onclick = () => {
      if (state.clusterFilter == null) {
        toast("Pick a cluster", "Filter a chip first (or Shift+click)", "info");
        return;
      }
      addCluster(state.clusterFilter);
    };
    $("#btn-cancel").onclick = async () => {
      if (!state.activeJobId) return;
      try {
        await api(`/api/jobs/${state.activeJobId}/cancel`, { method: "POST" });
      } catch {}
    };
    $("#btn-save-settings").onclick = saveSettings;
    $("#btn-recluster").onclick = recluster;
    $("#btn-reset-settings").onclick = () => {
      $("#set-theme").value = "dark";
      $("#set-accent").value = "violet";
      $("#set-eps").value = 0.35;
      $("#set-min").value = 2;
      $("#set-accurate").checked = false;
      $("#eps-val").textContent = "0.35";
      $("#min-val").textContent = "2";
      applyTheme();
    };
    $("#set-eps").oninput = (e) => ($("#eps-val").textContent = Number(e.target.value).toFixed(2));
    $("#set-min").oninput = (e) => ($("#min-val").textContent = e.target.value);
    $("#set-theme").onchange = applyTheme;
    $("#set-accent").onchange = applyTheme;

    // drag-drop files on window
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => {
      e.preventDefault();
      // pywebview may expose path via files; otherwise user pastes path
      const f = e.dataTransfer?.files?.[0];
      if (f && f.path) {
        $("#path-input").value = f.path;
        startImport(f.path);
      } else if (f?.name) {
        toast("Drop path", "Browsers hide full paths — use Browse or paste the path", "info");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, select")) return;
      if (e.key === "i" || e.key === "I") startImport();
      if (e.key === "e" || e.key === "E") startExport();
      if (e.key === "s" || e.key === "S") showPage("settings");
      if (e.key === "Escape" && state.activeJobId) $("#btn-cancel").click();
    });
  }

  // pywebview ready
  window.addEventListener("pywebviewready", () => {
    setStatus("Desktop shell ready", false);
  });

  wire();
  connectWs();
  refreshSession();
  api("/api/health")
    .then((h) => {
      if (!h.ffmpeg) toast("FFmpeg missing", "Add ffmpeg & ffprobe to PATH", "error");
      if (h.model_ready) setStatus("AI model ready", false);
      else setStatus("Loading AI model…", true);
    })
    .catch(() => setStatus("Connecting…", true));
})();
