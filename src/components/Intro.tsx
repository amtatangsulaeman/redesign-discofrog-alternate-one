"use client";

import { useRef } from "react";
import { gsap, useGSAP, REDUCED_MOTION } from "@/lib/gsap";
import { ArrowDown } from "lucide-react";
import Button from "./Button";
import styles from "./Intro.module.css";

const STATEMENT =
  "Hi! We’re Discofrog, a small branding & web studio between Jakarta and Melbourne. Small enough to stay close, experienced enough to push back when the brief needs it.";

export default function Intro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        // The section sticks in the middle of the screen while its words light up one by one,
        // and only scrolls on once the whole statement is lit (plus a short beat to read it).
        const words = gsap.utils.toArray<HTMLElement>("[data-word]");
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "center center",
              // scroll distance scales with the statement length: ~3.5% of a screen per word
              end: () => `+=${Math.round(window.innerHeight * words.length * 0.035)}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(words, { opacity: 0.15 }, { opacity: 1, stagger: 0.05, duration: 0.05, ease: "none" })
          .to({}, { duration: 0.25 }); // hold the finished statement before releasing
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="studio" ref={root} className={styles.intro}>
      <p className={styles.label}>(Welcome)</p>
      <div className={styles.statement}>
        <p className={styles.text} aria-label={STATEMENT}>
          {STATEMENT.split(" ").map((w, i) => (
            <span key={i} data-word aria-hidden>
              {w}{" "}
            </span>
          ))}
        </p>
        <Button href="#process" variant="soft" icon={ArrowDown}>
          How we work
        </Button>
      </div>
    </section>
  );
}
