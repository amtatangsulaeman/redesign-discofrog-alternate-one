"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { projectBySlug } from "@/lib/projects";
import styles from "./ServiceList.module.css";

type Service = { name: string; line: string; example: string };

/**
 * Collins-style service rows. Each row links to an example case study; on mouse hover a
 * preview of that project floats after the cursor (one shared card, swapped per row).
 */
export default function ServiceList({ items }: { items: Service[] }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const rows = items.map((s) => ({ ...s, project: projectBySlug(s.example)! }));

  const move = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);
  useGSAP(
    () => {
      const el = preview.current!;
      gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
      const cleanup = () => gsap.killTweensOf(el);
      move.current = {
        x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
      };
      return cleanup;
    },
    { scope: root },
  );

  const fine = () => window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !move.current) return;
    const r = root.current!.getBoundingClientRect();
    move.current.x(e.clientX - r.left);
    move.current.y(e.clientY - r.top);
  };
  const show = (i: number, e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !fine()) return;
    setCurrent(i);
    gsap.to(preview.current, { autoAlpha: 1, scale: 1, rotate: i % 2 ? 4 : -4, duration: 0.45, ease: "back.out(1.6)" });
  };
  const hide = () => {
    setCurrent(null);
    gsap.to(preview.current, { autoAlpha: 0, scale: 0.6, duration: 0.3, ease: "power2.in" });
  };

  return (
    <div ref={root} className={styles.wrap} onPointerMove={onMove} onPointerLeave={hide}>
      <ul className={styles.list} data-reveal>
        {rows.map((s, i) => (
          <li key={s.name}>
            <Link
              href={s.project.href}
              className={`${styles.row} ${current !== null && current !== i ? styles.dim : ""}`}
              onPointerEnter={(e) => show(i, e)}
            >
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.name}>{s.name}</span>
              <span className={styles.line}>{s.line}</span>
              <span className={styles.example}>
                <span className={styles.exampleLabel}>e.g.</span> {s.project.name}
                <ArrowRight size={16} strokeWidth={2} aria-hidden className={styles.arrow} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* floating preview — every cover stacked, only the hovered one visible */}
      <div ref={preview} className={styles.preview} aria-hidden>
        {rows.map((s, i) => (
          <Image
            key={s.name}
            src={s.project.image}
            alt=""
            fill
            sizes="360px"
            className={`${styles.previewImg} ${current === i ? styles.on : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
