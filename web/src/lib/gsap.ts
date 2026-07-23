"use client";

/**
 * Central GSAP setup for Fracture web.
 * Import from `@/lib/gsap` (not bare `gsap`) so plugins are registered once.
 *
 * Included (safe / commonly used, free with gsap npm):
 * - ScrollTrigger, ScrollToPlugin, Flip, Observer, Draggable
 * - TextPlugin, CustomEase, EasePack helpers
 * - MotionPathPlugin
 *
 * Not registered by default (pull in only when a screen needs them):
 * DrawSVG, MorphSVG, SplitText, ScrambleText, ScrollSmoother,
 * Inertia, Physics*, Pixi, Easel, GSDevTools, MotionPathHelper
 */

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { Draggable } from "gsap/Draggable";
import { TextPlugin } from "gsap/TextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { RoughEase, ExpoScaleEase, SlowMo } from "gsap/EasePack";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(
    useGSAP,
    ScrollTrigger,
    ScrollToPlugin,
    Flip,
    Observer,
    Draggable,
    TextPlugin,
    CustomEase,
    RoughEase,
    ExpoScaleEase,
    SlowMo,
    MotionPathPlugin
  );

  // Shared eases used across the app
  CustomEase.create("fracture.out", "M0,0 C0.16,1 0.3,1 1,1");
  CustomEase.create("fracture.soft", "M0,0 C0.25,0.1 0.25,1 1,1");

  gsap.defaults({
    ease: "power3.out",
    duration: 0.45,
  });

  registered = true;
}

// Auto-register on first client import
registerGsap();

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  ScrollToPlugin,
  Flip,
  Observer,
  Draggable,
  TextPlugin,
  CustomEase,
  MotionPathPlugin,
};

export default gsap;
