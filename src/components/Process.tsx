"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP, EASE, REDUCED_MOTION, ScrollTrigger } from "@/lib/gsap";
import SectionHeader from "./SectionHeader";
import styles from "./Process.module.css";

const STEPS = [
  {
    title: "Discovery",
    text: "We dig for the hidden (and sometimes uncomfortable) truths about your business — your audience, your competitors and what actually makes you different.",
    deliverables: ["Stakeholder workshop", "Audience research", "Competitor audit"],
    frog: "/frogs/frog-byte.svg",
    tint: "#d8ebf6",
  },
  {
    title: "Strategy",
    text: "Positioning, audience and message — so the creative becomes obvious. You get a clear direction to say yes to before a single pixel is designed.",
    deliverables: ["Brand positioning", "Messaging", "Sitemap & UX flows"],
    frog: "/frogs/frog-hopper.svg",
    tint: "#d6f3ec",
  },
  {
    title: "Design + build",
    text: "Identity, website and everything in between. One team, no hand-offs — the people who design it are the people who build it.",
    deliverables: ["Visual identity", "UI design", "Development", "CMS"],
    frog: "/frogs/frog-goldie.svg",
    tint: "#fdefc4",
  },
  {
    title: "Launch + impact",
    text: "We ship, track rankings and conversions, and keep optimising after go-live. Launch day is where the measuring starts.",
    deliverables: ["Launch support", "SEO tracking", "Monthly reports"],
    frog: "/frogs/frog-disco.svg",
    tint: "#dff2e2",
  },
];

export default function Process() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");

      // which step is in the middle of the viewport drives the sticky panel
      steps.forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });

      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        // progress line fills across the whole list
        gsap.fromTo(
          "[data-progress]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-steps]", start: "top 55%", end: "bottom 55%", scrub: true },
          },
        );
        steps.forEach((el) => {
          gsap.from(el.querySelectorAll("[data-rise]"), {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
            ease: EASE.outExpo,
            scrollTrigger: { trigger: el, start: "top 80%" },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // frog pops when the active step changes
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-frog]",
        { scale: 0.6, rotate: -14, y: 30 },
        { scale: 1, rotate: 0, y: 0, duration: 0.8, ease: "back.out(2)", overwrite: true },
      );
      gsap.fromTo("[data-big-num]", { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: EASE.outExpo });
    },
    { scope: root, dependencies: [active] },
  );

  const step = STEPS[active];

  return (
    <section id="process" ref={root} className={styles.process}>
      <SectionHeader eyebrow="Explore  03  —  Approach" title="How we work" code="A.04" />

      <div className={styles.layout}>
        {/* sticky panel (desktop) */}
        <aside className={styles.panel} aria-hidden>
          <div className={styles.panelCard} style={{ background: step.tint }}>
            <div className={styles.counter}>
              <span className={styles.bigNum} data-big-num key={active}>
                {String(active + 1).padStart(2, "0")}
              </span>
              <span className={styles.total}>/ {String(STEPS.length).padStart(2, "0")}</span>
            </div>
            <div className={styles.frog} data-frog>
              <Image src={step.frog} alt="" fill sizes="280px" />
            </div>
            <p className={styles.panelTitle}>{step.title}</p>
          </div>
        </aside>

        <ol className={styles.steps} data-steps>
          <span className={styles.track} aria-hidden>
            <span className={styles.progress} data-progress />
          </span>
          {STEPS.map((s, i) => (
            <li key={s.title} className={`${styles.step} ${i === active ? styles.isActive : ""}`} data-step>
              <span className={styles.dot} aria-hidden />
              <div className={styles.stepHead} data-rise>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className={styles.title} data-rise>
                {s.title}
              </h3>
              <p className={styles.text} data-rise>
                {s.text}
              </p>
              <ul className={styles.chips} data-rise aria-label="Deliverables">
                {s.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              {/* mobile: each step carries its own frog */}
              <div className={styles.mobileFrog} style={{ background: s.tint }} aria-hidden>
                <Image src={s.frog} alt="" fill sizes="120px" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
