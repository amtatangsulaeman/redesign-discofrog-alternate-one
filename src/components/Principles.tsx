"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./Principles.module.css";

type Principle = { label: string; title: string; text: string; frog: string; tint: string };

/**
 * Four tinted cards, each with its 3D frog, set on a staggered shelf (like /work).
 * Mouse: the card tilts toward the cursor and the frog hops; touch gets the static layout.
 */
export default function Principles({ items }: { items: Principle[] }) {
  const root = useRef<HTMLUListElement>(null);

  // handlers animate outside a GSAP context — kill their tweens on unmount
  useGSAP(() => {
    const el = root.current;
    return () => el && gsap.killTweensOf(el.querySelectorAll("li, [data-frog], [data-frog-hop]"));
  });

  const fine = () => window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches;

  const onMove = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse" || !fine()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(e.currentTarget, { rotateY: nx * 10, rotateX: -ny * 10, duration: 0.6, ease: "power3.out" });
    gsap.to(e.currentTarget.querySelector("[data-frog]"), { x: nx * 18, y: ny * 12, duration: 0.6, ease: "power3.out" });
  };
  const onEnter = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse" || !fine()) return;
    gsap.fromTo(
      e.currentTarget.querySelector("[data-frog-hop]"),
      { y: 0, scaleY: 1 },
      {
        keyframes: [
          { scaleY: 0.86, scaleX: 1.1, duration: 0.1, ease: "power2.out" },
          { y: -26, scaleY: 1.08, scaleX: 0.94, duration: 0.22, ease: "power2.out" },
          { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: "bounce.out" },
        ],
      },
    );
  };
  const onLeave = (e: React.PointerEvent<HTMLLIElement>) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
    gsap.to(e.currentTarget.querySelector("[data-frog]"), { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
  };

  return (
    <ul ref={root} className={styles.grid} data-reveal>
      {items.map((p, i) => (
        <li
          key={p.label}
          className={styles.card}
          style={{ background: p.tint }}
          onPointerMove={onMove}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
        >
          <div className={styles.top}>
            <span className={styles.label}>{p.label}</span>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
          </div>
          <div className={styles.frog} data-frog aria-hidden>
            <div className={styles.frogHop} data-frog-hop>
              <Image src={p.frog} alt="" fill sizes="240px" />
            </div>
          </div>
          <div className={styles.copy}>
            <h3 className={styles.title}>{p.title}</h3>
            <p className={styles.text}>{p.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
