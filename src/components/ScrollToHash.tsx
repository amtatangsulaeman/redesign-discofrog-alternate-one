"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Arriving on the home page with a hash (e.g. /#studio from /work): the browser jumps before
 * the pinned laptop section has added its scroll space, so the target ends up far off.
 * Re-scroll once every ScrollTrigger on the page has been measured.
 */
export default function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let raf = 0;
    // two frames: sibling components create their ScrollTriggers in their own effects
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}
