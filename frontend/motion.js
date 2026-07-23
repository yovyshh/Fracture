/* Fracture motion layer — GSAP timelines, staggers, micro-interactions */
(function (global) {
  const gsap = global.gsap;
  if (!gsap) {
    console.warn("[fracture] GSAP missing — motion degraded to CSS");
  }

  const reduced =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const Motion = {
    ok: !!gsap && !reduced,

    boot() {
      if (!this.ok) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("#sidebar", { x: -24, opacity: 0, duration: 0.45 })
        .from(
          ".nav-btn, .sidebar-brand",
          { y: 12, opacity: 0, stagger: 0.06, duration: 0.35 },
          "-=0.2"
        )
        .from(".neon-logo", { scale: 0.86, opacity: 0, duration: 0.5 }, "-=0.15")
        .from(
          ".logo-mark, .version-pill, .hero-sub, .search-row, .status-strip",
          { y: 16, opacity: 0, stagger: 0.07, duration: 0.4 },
          "-=0.25"
        )
        .from(
          "#timeline-block, #recent-block",
          { y: 18, opacity: 0, stagger: 0.08, duration: 0.4 },
          "-=0.2"
        );

      // soft neon pulse on logo outline
      gsap.to(".neon-logo", {
        filter: "drop-shadow(0 0 10px rgba(0,71,255,.55)) drop-shadow(0 0 22px rgba(0,71,255,.25))",
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    },

    pageIn(el) {
      if (!this.ok || !el) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.38, ease: "power3.out", clearProps: "transform" }
      );
    },

    staggerIn(nodes, opts = {}) {
      if (!nodes || !nodes.length) return;
      if (!this.ok) return;
      gsap.fromTo(
        nodes,
        { autoAlpha: 0, y: 14, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: opts.duration || 0.36,
          stagger: opts.stagger || 0.035,
          ease: "power3.out",
          clearProps: "transform",
        }
      );
    },

    toastIn(el) {
      if (!el) return;
      if (!this.ok) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 18, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.6)" }
      );
    },

    toastOut(el, onDone) {
      if (!el) {
        onDone && onDone();
        return;
      }
      if (!this.ok) {
        onDone && onDone();
        return;
      }
      gsap.to(el, {
        autoAlpha: 0,
        y: 10,
        scale: 0.96,
        duration: 0.22,
        ease: "power2.in",
        onComplete: onDone,
      });
    },

    modalIn(backdrop, modal) {
      if (!this.ok) return;
      gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      gsap.fromTo(
        modal,
        { autoAlpha: 0, y: 16, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "back.out(1.5)" }
      );
    },

    progressTo(fillEl, pct) {
      if (!fillEl) return;
      const p = Math.max(0, Math.min(100, pct));
      if (!this.ok) {
        fillEl.style.width = p + "%";
        return;
      }
      gsap.to(fillEl, { width: p + "%", duration: 0.28, ease: "power2.out", overwrite: true });
    },

    /** Soft lift hover for cards / chips */
    bindHoverLift(root = document) {
      if (!this.ok) return;
      root.querySelectorAll(".scene-card, .chip, .stat-card, .btn.primary").forEach((el) => {
        if (el.dataset.hoverBound) return;
        el.dataset.hoverBound = "1";
        el.addEventListener("pointerenter", () => {
          gsap.to(el, {
            y: el.classList.contains("scene-card") ? -4 : -2,
            scale: el.classList.contains("scene-card") ? 1.02 : 1.03,
            duration: 0.22,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
        el.addEventListener("pointerleave", () => {
          gsap.to(el, {
            y: 0,
            scale: 1,
            duration: 0.28,
            ease: "power3.out",
            overwrite: "auto",
          });
        });
      });
    },

    flash(el, color = "var(--accent)") {
      if (!this.ok || !el) return;
      gsap.fromTo(
        el,
        { boxShadow: `0 0 0 0 ${color}` },
        {
          boxShadow: `0 0 0 8px transparent`,
          duration: 0.55,
          ease: "power2.out",
        }
      );
    },

    tabPanel(panel) {
      if (!this.ok || !panel) return;
      gsap.fromTo(
        panel,
        { autoAlpha: 0, x: 10 },
        { autoAlpha: 1, x: 0, duration: 0.28, ease: "power2.out" }
      );
    },

    pop(el) {
      if (!this.ok || !el) return;
      gsap.fromTo(
        el,
        { scale: 0.9, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.28, ease: "back.out(2)" }
      );
    },
  };

  global.FractureMotion = Motion;
})(window);
