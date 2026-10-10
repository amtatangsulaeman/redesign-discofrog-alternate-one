"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE, REDUCED_MOTION } from "@/lib/gsap";
import { attachPixelHover } from "@/lib/pixelHover";
import { PROJECTS, projectBySlug } from "@/lib/projects";
import SectionHeader from "./SectionHeader";
import styles from "./Work.module.css";

type Case = { name: string; tags: string; image: string; href: string; size: "lg" | "sm" };

// featured four — content comes from the shared project list (scraped from the live site)
const pick = (slug: string, size: Case["size"]): Case => {
  const p = projectBySlug(slug)!;
  return { name: p.name, tags: p.services.join(" · "), image: p.image, href: p.href, size };
};

const ROWS: { cls: string; cases: Case[] }[] = [
  { cls: styles.row1, cases: [pick("jbs", "lg"), pick("formindo", "sm")] },
  { cls: styles.row2, cases: [pick("ragam", "sm"), pick("lavely", "lg")] },
];

export default function Work() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        gsap.utils.toArray<HTMLElement>("[data-case]").forEach((el) => {
          const media = el.querySelector("[data-media]");
          const img = el.querySelector("img");
          gsap.from(media, {
            clipPath: "inset(18% 8% 0% 8% round 16px)",
            duration: 1.3,
            ease: EASE.outExpo,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.15 },
            {
              yPercent: 8,
              scale: 1.15,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
          gsap.from(el.querySelector("[data-info]"), {
            y: 24,
            opacity: 0,
            duration: 0.9,
            ease: EASE.outExpo,
            scrollTrigger: { trigger: el, start: "top 70%" },
          });
        });
      });
      // Pixel trail under the cursor — mouse only, full motion only
      mm.add(`(pointer: fine) and (not ${REDUCED_MOTION})`, () => {
        const detach = gsap.utils.toArray<HTMLElement>("[data-media]").map((media) =>
          attachPixelHover(media, media.querySelector("img")!),
        );
        return () => detach.forEach((d) => d());
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} className={styles.work}>
      <SectionHeader eyebrow="Explore  01  /  Portfolio" title="Selected work" code="P.04" />

      {ROWS.map((row, r) => (
        <div key={r} className={`${styles.row} ${row.cls}`}>
          {row.cases.map((c) => (
            <Link key={c.name} href={c.href} className={`${styles.case} ${styles[c.size]}`} data-case>
              <div className={styles.media} data-media>
                <Image
                  src={c.image}
                  alt={`${c.name}: ${c.tags}`}
                  fill
                  sizes={c.size === "lg" ? "(max-width: 800px) 100vw, 62vw" : "(max-width: 800px) 100vw, 31vw"}
                  className={styles.image}
                />
                <span className={styles.tag}>
                  <span>View work</span>
                  <ArrowRight size={15} strokeWidth={2} aria-hidden />
                </span>
              </div>
              <div className={styles.info} data-info>
                <div className={styles.infoL}>
                  <h3 className={styles.name}>{c.name}</h3>
                  <p className={styles.tags}>{c.tags}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ))}

      <Link href="/work" className={styles.seeAll}>
        <span className={styles.seeAllText}>See all projects</span>
        <sup className={styles.count}>{PROJECTS.length}</sup>
        <ArrowRight className={styles.seeAllArrow} strokeWidth={1.75} aria-hidden />
      </Link>
    </section>
  );
}
