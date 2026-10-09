"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Rows3, ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE, REDUCED_MOTION } from "@/lib/gsap";
import { attachPixelHover } from "@/lib/pixelHover";
import { PROJECTS } from "@/lib/projects";
import SectionHeader from "./SectionHeader";
import styles from "./WorkIndex.module.css";

/**
 * /work index — straight to the point, after wearecollins.com/case-studies.
 *   Shelf  — covers on a staggered 3-column shelf (covers are landscape, so no portrait crop)
 *   Spines — full-width colour bands in each cover's own tint, like book spines
 * Type, spacing and colours follow the home page's "Selected work" section.
 */
type View = "shelf" | "spines";

// per-column drop so the shelf reads like books of different heights
const SHELF_DROP = [0, 88, 40];
// spine insets — every band a slightly different width
const SPINE_INSET = [0, 3.5, 8, 4.5, 1.5, 6];

export default function WorkIndex() {
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("shelf");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        gsap.from("[data-toggle]", { y: 20, opacity: 0, duration: 0.9, ease: EASE.outExpo, delay: 0.2 });
        gsap.utils.toArray<HTMLElement>("[data-item]").forEach((el, i) => {
          gsap.from(el, {
            y: 70,
            opacity: 0,
            duration: 1.1,
            ease: EASE.outExpo,
            delay: i < 6 ? 0.25 + i * 0.06 : 0,
            scrollTrigger: i < 6 ? undefined : { trigger: el, start: "top 92%" },
          });
        });
      });
      // pixel trail on the shelf covers (mouse only)
      mm.add(`(pointer: fine) and (not ${REDUCED_MOTION})`, () => {
        if (view !== "shelf") return;
        const detach = gsap.utils
          .toArray<HTMLElement>("[data-cover]")
          .map((el) => attachPixelHover(el, el.querySelector("img")!));
        return () => detach.forEach((d) => d());
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [view], revertOnUpdate: true },
  );

  return (
    <section ref={root} className={styles.page}>
      <SectionHeader
        eyebrow={`Portfolio  —  ${PROJECTS.length} projects`}
        title="All work"
        code={`P.${PROJECTS.length}`}
      />

      <div className={styles.bar} data-toggle>
        <p className={styles.lede}>
          Brand identities, websites and company profiles — built for brands ready to make a bigger move.
        </p>
        <div className={styles.toggle} role="tablist" aria-label="Layout">
          <button
            role="tab"
            aria-selected={view === "shelf"}
            className={view === "shelf" ? styles.on : undefined}
            onClick={() => setView("shelf")}
          >
            <LayoutGrid size={15} strokeWidth={2} aria-hidden /> Shelf
          </button>
          <button
            role="tab"
            aria-selected={view === "spines"}
            className={view === "spines" ? styles.on : undefined}
            onClick={() => setView("spines")}
          >
            <Rows3 size={15} strokeWidth={2} aria-hidden /> Spines
          </button>
        </div>
      </div>

      {view === "shelf" ? (
        <ul className={styles.shelf}>
          {PROJECTS.map((p, i) => (
            <li key={p.slug} data-item style={{ "--drop": `${SHELF_DROP[i % 3]}px` } as React.CSSProperties}>
              <Link href={p.href} className={styles.card}>
                <div className={styles.cover} data-cover>
                  <Image
                    src={p.image}
                    alt={`${p.name} — ${p.services.join(", ")}`}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    className={styles.photo}
                  />
                  <span className={styles.open} aria-hidden>
                    <ArrowRight size={18} strokeWidth={2} />
                  </span>
                </div>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.services}>{p.services.join(" · ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.spines}>
          {PROJECTS.map((p, i) => (
            <li
              key={p.slug}
              data-item
              style={{ "--inset": `${SPINE_INSET[i % SPINE_INSET.length]}%` } as React.CSSProperties}
            >
              <Link href={p.href} className={styles.spine} style={{ background: p.tint, color: p.ink }}>
                <span className={styles.spineName}>{p.name}</span>
                <span className={styles.spineLine}>{p.overview}</span>
                <span className={styles.spineMeta}>{p.services.join(" · ")}</span>
                <span className={styles.spineThumb} aria-hidden>
                  <Image src={p.image} alt="" fill sizes="220px" className={styles.photo} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
