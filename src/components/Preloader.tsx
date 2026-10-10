"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import FrogArt from "./FrogArt";
import styles from "./Preloader.module.css";

/**
 * First-load preloader. It is in the server HTML, so it covers the page from the very first
 * paint; the page renders underneath while fonts and images load. Meanwhile every GSAP animation
 * is held (the global timeline is paused), so the hero intro and the rest start exactly as the
 * curtain lifts instead of playing unseen behind it. Scrolling is locked until then.
 * Done when fonts + images + window load are in (at least MIN ms, at most MAX ms), then the frog
 * hops and the panel slides away. Client-side navigation keeps the layout, so it never shows
 * again until a full reload. The loader's own motion is CSS (GSAP is paused).
 */
const MIN = 900;
const MAX = 5000;

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  // layout effect: runs before the page sections set up their GSAP intros (they come after it in
  // the tree), so nothing gets a single frame to play before the global timeline is paused
  useLayoutEffect(() => {
    const el = root.current!;
    const html = document.documentElement;
    const started = performance.now();
    gsap.globalTimeline.pause();

    // progress: images loaded + fonts + window load, eased towards the target so it never jumps
    let fontsDone = false;
    let pageDone = document.readyState === "complete";
    document.fonts?.ready.then(() => (fontsDone = true));
    const onLoad = () => (pageDone = true);
    window.addEventListener("load", onLoad);
    const target = () => {
      // only what the first screen shows: lazy images further down never load until scrolled to
      const imgs = Array.from(document.images).filter(
        (i) => !el.contains(i) && i.loading !== "lazy" && i.getBoundingClientRect().top < window.innerHeight,
      );
      const ready = imgs.length ? imgs.filter((i) => i.complete).length / imgs.length : 1;
      return Math.min(1, ready * 0.7 + (fontsDone ? 0.15 : 0) + (pageDone ? 0.15 : 0));
    };

    let shown = 0;
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      if (count.current) count.current.textContent = "100";
      if (bar.current) bar.current.style.transform = "scaleX(1)";
      el.dataset.state = "leaving";
      // lift the curtain, then let the page run
      window.setTimeout(() => {
        delete html.dataset.loading;
        gsap.globalTimeline.resume();
        ScrollTrigger.refresh();
      }, 380);
      window.setTimeout(() => (el.style.display = "none"), 1100);
    };
    const tick = () => {
      const t = performance.now() - started;
      const goal = t > MAX ? 1 : target();
      shown += (goal - shown) * 0.12;
      if (goal === 1 && 1 - shown < 0.01) shown = 1;
      const pct = Math.round(shown * 100);
      if (count.current) count.current.textContent = String(pct);
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (shown === 1 && t >= MIN) return finish();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      // React (strict mode, in development) unmounts and remounts once: the remount carries on, so
      // only unlock if the preloader is really gone — never leave the site frozen
      window.setTimeout(() => {
        if (finished || document.contains(el)) return;
        delete html.dataset.loading;
        gsap.globalTimeline.resume();
      }, 0);
    };
  }, []);

  return (
    <div ref={root} className={styles.loader} data-preloader aria-hidden>
      <div className={styles.center}>
        <div className={styles.frog}>
          <FrogArt name="disco" className={styles.art} />
        </div>
        <span className={styles.shadow} />
        <p className={styles.line}>Warming up the pond…</p>
      </div>
      <div className={styles.foot}>
        <span className={styles.track}>
          <span ref={bar} className={styles.bar} />
        </span>
        <span className={styles.count}>
          <span ref={count}>0</span>%
        </span>
      </div>
    </div>
  );
}
