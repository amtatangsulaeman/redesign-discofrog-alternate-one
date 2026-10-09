"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE, REDUCED_MOTION } from "@/lib/gsap";
import { ABOUT } from "@/lib/about";
import SectionHeader from "./SectionHeader";
import Button from "./Button";
import Principles from "./Principles";
import ServiceList from "./ServiceList";
import Testimonials from "./Testimonials";
import styles from "./AboutPage.module.css";

/** /about — same skeleton and tokens as /work: SectionHeader, lede, then straight to content. */
export default function AboutPage() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        gsap.from("[data-fade]", { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: EASE.outExpo, delay: 0.2 });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el.children, {
            y: 50,
            opacity: 0,
            duration: 1.1,
            stagger: 0.06,
            ease: EASE.outExpo,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.page}>
      <SectionHeader eyebrow="About  —  Discofrog Studio" title="About us" code="’21" />

      {/* ——— Statement ——— */}
      <div className={styles.intro}>
        <p className={styles.lede} data-fade>
          {ABOUT.lede}
        </p>
        <p className={styles.statement} data-fade>
          {ABOUT.statement}
        </p>
      </div>

      {/* ——— Facts ——— */}
      <dl className={styles.facts} data-reveal>
        {ABOUT.facts.map((f) => (
          <div key={f.label} className={styles.fact}>
            <dt>{f.label}</dt>
            {f.value.map((v) => (
              <dd key={v}>{v}</dd>
            ))}
          </div>
        ))}
      </dl>

      {/* ——— Principles ——— */}
      <div className={styles.block}>
        <h2 className={styles.h2}>What we stand for</h2>
        <Principles items={ABOUT.principles} />
      </div>

      {/* ——— Services (Collins-style list) ——— */}
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h2 className={styles.h2}>Everything you need, under one roof</h2>
          <Button href="/work" variant="soft" icon={ArrowRight}>
            See our work
          </Button>
        </div>
        <ServiceList items={ABOUT.services} />
      </div>

      {/* ——— Testimonials ——— */}
      <div className={styles.block}>
        <h2 className={styles.h2}>What clients say</h2>
        <Testimonials />
      </div>

      {/* ——— Studios + contact ——— */}
      <div className={styles.block}>
        <h2 className={styles.h2}>Where to find us</h2>
        <div className={styles.offices} data-reveal>
          {ABOUT.offices.map((o) => (
            <address key={o.city} className={styles.office}>
              <span className={styles.city}>{o.city}</span>
              {o.lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
          ))}
          <div className={styles.office}>
            <span className={styles.city}>Contact</span>
            <a href={`mailto:${ABOUT.email}`} className={styles.link}>
              {ABOUT.email}
            </a>
            <a href={ABOUT.whatsapp} className={styles.link} target="_blank" rel="noopener">
              {ABOUT.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
