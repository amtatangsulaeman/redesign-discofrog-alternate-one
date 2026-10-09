"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";
import { PROJECTS } from "@/lib/projects";
import styles from "./Testimonials.module.css";

const AUTO_MS = 7000;
const QUOTES = PROJECTS.filter((p) => p.quote);

// prefers-reduced-motion as a subscribable value (server: assume motion is fine)
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useReducedMotion = () =>
  useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);

/**
 * One testimonial at a time, big: quote + client on the left, their project tilted on the
 * right. Auto-advances (paused on hover / focus / reduced motion); client chips and ←/→ jump.
 */
export default function Testimonials() {
  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const dir = useRef(1);
  const chips = useRef<HTMLDivElement>(null);
  const q = QUOTES[i];

  const go = (next: number, d = next > i ? 1 : -1) => {
    dir.current = d;
    setI((next + QUOTES.length) % QUOTES.length);
  };

  // auto-advance
  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => go(i + 1, 1), AUTO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused, reduced]);

  // keep the active chip in view
  useEffect(() => {
    const row = chips.current;
    const el = row?.querySelector<HTMLElement>(`[data-chip="${i}"]`);
    if (!row || !el) return;
    // measure relative to the chip row itself (offsetLeft is relative to some ancestor)
    const left = el.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    row.scrollTo({ left: Math.max(0, left - 8), behavior: "smooth" });
  }, [i]);

  // swap animation whenever the quote changes
  useGSAP(
    () => {
      if (reduced) return;
      const d = dir.current;
      gsap.fromTo("[data-line]", { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.04, ease: EASE.outExpo });
      gsap.fromTo("[data-meta]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.25, ease: EASE.outExpo });
      gsap.fromTo(
        "[data-shot]",
        { xPercent: d * 18, rotate: d * 10, opacity: 0, scale: 0.92 },
        { xPercent: 0, rotate: i % 2 ? 3 : -3, opacity: 1, scale: 1, duration: 1, ease: EASE.outExpo },
      );
    },
    { scope: root, dependencies: [i, reduced] },
  );

  // split the quote into words wrapped in masks so they can rise line by line
  const words = q.quote.split(" ");

  return (
    <div
      ref={root}
      className={styles.wrap}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.stage}>
        <figure className={styles.quote} aria-live="polite">
          <blockquote className={styles.text} key={q.slug} aria-label={`“${q.quote}”`}>
            <span aria-hidden>
              {words.map((w, k) => (
                <Fragment key={k}>
                  <span className={styles.mask}>
                    <span data-line className={styles.word}>
                      {k === 0 ? "“" : ""}
                      {w}
                      {k === words.length - 1 ? "”" : ""}
                    </span>
                  </span>
                  {/* the space lives outside the clipped mask, or it collapses */}
                  {k < words.length - 1 && " "}
                </Fragment>
              ))}
            </span>
          </blockquote>
          <figcaption className={styles.meta} data-meta>
            <span className={styles.author}>{q.author}</span>
            <span className={styles.client}>
              {q.name} · {q.services.join(", ")}
            </span>
            <Link href={q.href} className={styles.link}>
              View the work <ArrowRight size={15} strokeWidth={2} aria-hidden />
            </Link>
          </figcaption>
        </figure>

        <Link href={q.href} className={styles.shotWrap} tabIndex={-1} aria-hidden>
          <div className={styles.shot} data-shot key={q.slug}>
            <Image src={q.image} alt="" fill sizes="(max-width: 900px) 90vw, 40vw" className={styles.img} />
          </div>
        </Link>
      </div>

      <div className={styles.bar}>
        <div className={styles.controls}>
          <button className={styles.ctrl} onClick={() => go(i - 1, -1)} aria-label="Previous testimonial">
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <span className={styles.count} aria-live="off">
            {String(i + 1).padStart(2, "0")} / {String(QUOTES.length).padStart(2, "0")}
          </span>
          <button className={styles.ctrl} onClick={() => go(i + 1, 1)} aria-label="Next testimonial">
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </div>

        <div ref={chips} className={styles.chips} role="tablist" aria-label="Clients">
          {QUOTES.map((c, k) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={k === i}
              data-chip={k}
              className={`${styles.chip} ${k === i ? styles.on : ""}`}
              onClick={() => go(k)}
            >
              {c.name}
              {k === i && !paused && !reduced && (
                <span className={styles.progress} key={`${i}-${paused}`} style={{ animationDuration: `${AUTO_MS}ms` }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
