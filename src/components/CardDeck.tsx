"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./CardDeck.module.css";

/**
 * Shuffle-able photo deck. Click / Enter / Space throws the top card off and it rejoins at the
 * back; dragging the top card flings it in the drag direction once it passes a threshold,
 * otherwise it springs back.
 */
// resting pose of the first three depths (front → back); deeper cards hide behind the last one
const POSE = [
  { xPercent: -6, yPercent: -4, rotate: -3 },
  { xPercent: 10, yPercent: 6, rotate: 4 },
  { xPercent: 2, yPercent: 12, rotate: 1 },
];
const THROW_AT = 110; // px of drag that counts as a throw

export default function CardDeck({ images, label }: { images: string[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  // order[0] is the card on top
  const order = useRef(images.map((_, i) => i));
  const busy = useRef(false);
  const drag = useRef<{ x: number; y: number; dx: number; moved: boolean } | null>(null);
  const [top, setTop] = useState(0);

  const pose = (depth: number) => ({ ...POSE[Math.min(depth, POSE.length - 1)], opacity: depth < POSE.length ? 1 : 0 });

  const layout = (animate: boolean) => {
    order.current.forEach((card, depth) => {
      const el = cards.current[card];
      if (!el) return;
      el.style.zIndex = String(images.length - depth);
      const to = { ...pose(depth), x: 0, y: 0, scale: 1 };
      if (animate) gsap.to(el, { ...to, duration: 0.7, ease: "back.out(1.4)", overwrite: "auto" });
      else gsap.set(el, to);
    });
  };

  useGSAP(
    () => {
      layout(false);
      // handlers below animate outside the GSAP context — stop them if we unmount mid-throw
      const els = cards.current;
      return () => gsap.killTweensOf(els);
    },
    { scope: root },
  );

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** fling the top card off in `dir` (−1 left, 1 right) and send it to the back */
  const throwTop = (dir: number, fromX = 0) => {
    if (busy.current || images.length < 2) return;
    busy.current = true;
    const card = order.current[0];
    const el = cards.current[card]!;
    const done = () => {
      order.current = [...order.current.slice(1), card];
      setTop(order.current[0]);
      // drop it in behind the stack, then everyone eases to their new depth
      gsap.set(el, { ...pose(images.length - 1), x: 0, y: 0 });
      layout(true);
      busy.current = false;
    };
    if (reduced()) return done();
    gsap
      .timeline({ onComplete: done })
      .to(el, {
        x: fromX + dir * window.innerWidth * 0.55,
        y: -40,
        rotate: dir * 24,
        duration: 0.45,
        ease: "power2.in",
      })
      .to(el, { opacity: 0, duration: 0.15 }, "-=0.15");
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy.current || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 5) d.moved = true;
    d.dx = dx;
    const el = cards.current[order.current[0]];
    gsap.set(el, { x: dx, y: dy * 0.4, rotate: POSE[0].rotate + dx * 0.06 });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) return throwTop(1); // plain click → next card
    if (Math.abs(d.dx) > THROW_AT) return throwTop(Math.sign(d.dx), d.dx);
    // not far enough: spring back
    gsap.to(cards.current[order.current[0]], {
      ...POSE[0],
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "back.out(2)",
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      throwTop(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      throwTop(e.key === "ArrowLeft" ? -1 : 1);
    }
  };

  return (
    <div className={styles.wrap}>
      <div
        ref={root}
        className={styles.deck}
        role="button"
        tabIndex={0}
        aria-label={`${label} — image ${top + 1} of ${images.length}. Press Enter for the next image.`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        {images.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={styles.card}
          >
            <Image src={src} alt="" fill sizes="(max-width: 700px) 75vw, 560px" className={styles.img} draggable={false} />
          </div>
        ))}
      </div>
      <p className={styles.hint} aria-hidden>
        Click or drag to shuffle · {top + 1} / {images.length}
      </p>
    </div>
  );
}
