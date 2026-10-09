"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

// Bezier curves lifted from the Figma motion tracks
export const EASE = {
  outExpo: CustomEase.create("outExpo", "0.16,1,0.3,1"),
  inOutQuart: CustomEase.create("inOutQuart", "0.76,0,0.24,1"),
  popBack: CustomEase.create("popBack", "0.45,1.45,0.8,1"),
  anticipate: CustomEase.create("anticipate", "0.7,-0.4,0.4,1.4"),
};

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Pauses looping animations while `trigger` is off screen, so idle sections cost nothing. */
export function pauseWhenOffscreen(trigger: Element | null, animations: gsap.core.Animation[]) {
  const set = (active: boolean) => animations.forEach((a) => (active ? a.resume() : a.pause()));
  set(false);
  return ScrollTrigger.create({
    trigger,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => set(self.isActive),
    onRefresh: (self) => set(self.isActive),
  });
}

export { gsap, ScrollTrigger, useGSAP };
