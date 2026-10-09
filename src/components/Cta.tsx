"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, REDUCED_MOTION, pauseWhenOffscreen } from "@/lib/gsap";
import { ArrowRight } from "lucide-react";
import Button from "./Button";
import styles from "./Cta.module.css";

// One phrase is wider than any screen, so two copies are enough for a seamless loop
const STARS = ["/figma/star1.svg", "/figma/star2.svg"];

// Same closing CTA on every page; the link to the page you're already on is left out
const LINKS = [
  { href: "/work", label: "Explore work", icon: ArrowRight },
  { href: "/about", label: "Meet the studio" },
];

type Props = {
  /** route of the page this sits on, e.g. "/about" */
  current?: string;
};

export default function Cta({ current = "/" }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        // One phrase+star unit every 18s (Figma had 8s — slowed down so it reads calmly).
        // Track holds 2 units → -50% per loop.
        const loop = gsap.to("[data-track]", { xPercent: -50, duration: 18, ease: "none", repeat: -1 });
        const spin = gsap.to("[data-star]", { rotate: 360, duration: 18, ease: "none", repeat: -1 });
        pauseWhenOffscreen(root.current, [loop, spin]);

        // Scroll velocity nudges the marquee
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            if (loop.paused()) return;
            // gentle nudge from scrolling — at most 1.8× speed
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 2500, 0.8);
            gsap.to(loop, {
              timeScale: boost,
              duration: 0.2,
              overwrite: true,
              onComplete: () => void gsap.to(loop, { timeScale: 1, duration: 1, overwrite: true }),
            });
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="contact" ref={root} className={styles.cta}>
      <div className={styles.marquee}>
        <div className={styles.track} data-track>
          {STARS.map((star, i) => (
            <div key={i} className={styles.unit} aria-hidden={i > 0}>
              <h2 className={styles.phrase}>Ready for a bigger move? Get in touch</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={star} alt="" className={styles.star} data-star />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.end}>
        <p className={styles.prompt}>Scrolled all the way down? That’s where it starts. What’s next?</p>
        <div className={styles.buttons}>
          <Button href="/contact" icon={ArrowRight}>
            Start a project
          </Button>
          {LINKS.filter((l) => l.href !== current).map((l) => (
            <Button key={l.href} href={l.href} variant="glass" icon={l.icon}>
              {l.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
