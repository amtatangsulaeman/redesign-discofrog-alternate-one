"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { gsap, useGSAP, EASE, REDUCED_MOTION } from "@/lib/gsap";
import type { Project } from "@/lib/projects";
import Button from "./Button";
import CardDeck from "./CardDeck";
import styles from "./CaseStudy.module.css";

/**
 * Case study detail, structured after wearecollins.com/case-studies/equinox-hotels:
 *   header (label · title · tagline) → horizontal gallery → meta + statement →
 *   white "result" panel with a shuffle-able card deck → client quote → more work.
 * Collins' Impact/Press blocks are left out: the live site has no such data.
 */
export default function CaseStudy({ project: p, more }: { project: Project; more: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        gsap.from("[data-rise]", { yPercent: 105, duration: 1.2, stagger: 0.08, ease: EASE.outExpo, delay: 0.1 });
        gsap.from("[data-fade]", { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: EASE.outExpo, delay: 0.3 });
        gsap.from("[data-slide]", { x: 120, opacity: 0, duration: 1.3, stagger: 0.07, ease: EASE.outExpo, delay: 0.35 });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: EASE.outExpo, scrollTrigger: { trigger: el, start: "top 85%" } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Drag the gallery with the mouse (touch / trackpad keep native scrolling).
  // Scroll-snap is switched off while dragging — otherwise the browser snaps every scrollLeft
  // write straight back and the strip feels stuck — then a short momentum glide, then snap again.
  const drag = useRef<{ x: number; left: number; vx: number; lastX: number; lastT: number } | null>(null);
  const glide = useRef(0);
  const stopGlide = () => {
    cancelAnimationFrame(glide.current);
    glide.current = 0;
  };
  const release = () => {
    const el = strip.current;
    if (el) delete el.dataset.dragging;
  };
  const onDown = (e: React.PointerEvent) => {
    const el = strip.current;
    if (e.pointerType !== "mouse" || e.button !== 0 || !el) return;
    stopGlide();
    drag.current = { x: e.clientX, left: el.scrollLeft, vx: 0, lastX: e.clientX, lastT: e.timeStamp };
    el.dataset.dragging = "true";
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = strip.current;
    if (!d || !el) return;
    el.scrollLeft = d.left - (e.clientX - d.x);
    const dt = Math.max(e.timeStamp - d.lastT, 1);
    d.vx = 0.8 * ((e.clientX - d.lastX) / dt) + 0.2 * d.vx; // px/ms, smoothed
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  };
  const onUp = () => {
    const d = drag.current;
    const el = strip.current;
    drag.current = null;
    if (!d || !el) return release();
    let v = -d.vx * 16; // px per frame
    if (Math.abs(v) < 0.5) return release();
    const step = () => {
      el.scrollLeft += v;
      v *= 0.94;
      const atEdge = el.scrollLeft <= 0 || el.scrollLeft >= el.scrollWidth - el.clientWidth;
      if (Math.abs(v) > 0.4 && !atEdge) glide.current = requestAnimationFrame(step);
      else release(); // snap back on for the final settle
    };
    glide.current = requestAnimationFrame(step);
  };

  const mail = `mailto:discofrogstudio@gmail.com?subject=${encodeURIComponent(`Project like ${p.name}`)}`;

  return (
    <article ref={root} className={styles.page}>
      {/* ——— Header ——— */}
      <header className={styles.head}>
        <p className={styles.label} data-fade>
          <Link href="/work">Work</Link> <span aria-hidden>/</span> {p.name}
        </p>
        <div>
          <h1 className={styles.title}>
            <span className={styles.mask}>
              <span data-rise>{p.name}</span>
            </span>
          </h1>
          <p className={styles.tagline} data-fade>
            {p.services.join(" · ")}
          </p>
        </div>
      </header>

      {/* ——— Gallery strip ——— */}
      <div
        ref={strip}
        className={styles.strip}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        tabIndex={0}
        aria-label={`${p.name} gallery — scroll sideways`}
      >
        {p.gallery.map((src, i) => (
          <figure key={src} className={styles.shot} data-slide>
            <Image
              src={src}
              alt={`${p.name} — image ${i + 1} of ${p.gallery.length}`}
              fill
              sizes="(max-width: 700px) 85vw, 70vw"
              className={styles.img}
              draggable={false}
              priority={i < 2}
            />
          </figure>
        ))}
      </div>

      {/* ——— Meta + statement ——— */}
      <section className={styles.overview} data-reveal>
        <dl className={styles.meta}>
          <div>
            <dt>Client</dt>
            <dd>{p.name}</dd>
          </div>
          <div>
            <dt>Services</dt>
            {p.services.map((s) => (
              <dd key={s}>{s}</dd>
            ))}
          </div>
        </dl>
        <div className={styles.statementCol}>
          <p className={styles.statement}>{p.overview}</p>
          <Button href={mail} icon={Mail}>
            Start a similar project
          </Button>
        </div>
      </section>

      {/* ——— Result panel ——— */}
      <section className={styles.panel} data-reveal>
        <h2 className={styles.panelTitle}>The result</h2>
        <p className={styles.panelText}>{p.conclusion}</p>
        {/* the whole gallery as a shuffle-able deck, starting from image 2 (image 1 is the cover) */}
        <CardDeck images={[...p.gallery.slice(1), p.gallery[0]]} label={`${p.name} gallery`} />
      </section>

      {/* ——— Client quote ——— */}
      {p.quote && (
        <figure className={styles.quote} data-reveal>
          <blockquote>“{p.quote}”</blockquote>
          <figcaption>{p.author}</figcaption>
        </figure>
      )}

      {/* ——— More work ——— */}
      <section className={styles.more} data-reveal>
        <div className={styles.moreHead}>
          <h2 className={styles.moreTitle}>More work</h2>
          <Button href="/work" variant="soft" icon={ArrowRight}>
            All projects
          </Button>
        </div>
        <ul className={styles.moreGrid}>
          {more.map((m) => (
            <li key={m.slug}>
              <Link href={m.href} className={styles.card}>
                <div className={styles.cover}>
                  <Image src={m.image} alt={`${m.name} — ${m.services.join(", ")}`} fill sizes="(max-width: 700px) 100vw, 33vw" className={styles.img} />
                </div>
                <h3 className={styles.name}>{m.name}</h3>
                <p className={styles.services}>{m.services.join(" · ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
