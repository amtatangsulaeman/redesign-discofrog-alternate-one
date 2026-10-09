"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, EASE, REDUCED_MOTION, ScrollTrigger } from "@/lib/gsap";
import { createGravityStage } from "@/lib/gravityStage";
import styles from "./Hero.module.css";

/**
 * Gravity hero (after wildishandco.co.uk): a plain centred headline stays put while the
 * stickers and the intro card drop into a pile below it — and can be thrown with the mouse.
 */
const TILES = [
  { src: "/figma/floatImage1.png", bg: "#e9e2d6", photo: true, alt: "JBS Villa — brand identity" },
  { src: "/frogs/frog-goldie.svg", bg: "#fdefc4", alt: "" },
  { src: "/frogs/frog-byte.svg", bg: "#d8ebf6", alt: "" },
  { src: "/frogs/frog-hopper.svg", bg: "#d6f3ec", alt: "" },
  { src: "/figma/logo.png", bg: "#dff2e2", alt: "" },
  { src: "/frogs/frog-groove.svg", bg: "#ffe1ea", alt: "" },
];

const HEADLINE = ["Discofrog makes", "brands move."];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(`not ${REDUCED_MOTION}`, () => {
        const physics = createGravityStage(stage.current!, {
          interactive: window.matchMedia("(pointer: fine)").matches,
        });

        // Everything pops in where CSS put it… then gravity takes over
        gsap.from("[data-inner]", {
          opacity: 0,
          y: 40,
          scale: 0.85,
          duration: 0.9,
          stagger: 0.045,
          ease: EASE.outExpo,
          delay: 0.15,
        });
        gsap.from("[data-rise]", { yPercent: 110, duration: 1.1, stagger: 0.1, ease: EASE.outExpo, delay: 0.1 });
        const fall = gsap.delayedCall(1.9, physics.drop);

        // Leaving the hero: a quick scroll makes the pile hop (energy carried into the next
        // section) while the whole stage sinks back, shrinks and fades behind the laptop section
        let lastHop = 0;
        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity();
            const now = performance.now();
            if (v > 900 && now - lastHop > 700) {
              lastHop = now;
              physics.nudge(Math.min(v / 260, 14));
            }
          },
        });
        gsap.to(stage.current, {
          yPercent: 28,
          scale: 0.9,
          opacity: 0.25,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        // soft seam into the laptop section — only while the hero is leaving
        gsap.to(document.getElementById("showcase"), {
          "--seam": 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "15% top", scrub: true },
        });

        return () => {
          fall.kill();
          physics.destroy();
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="top" ref={root} className={styles.hero}>
      <div ref={stage} className={styles.stage}>
        <div className={styles.layout}>
          <div className={styles.tiles}>
            {TILES.map((t) => (
              <div key={t.src} className={styles.tile} style={{ background: t.bg }} data-body>
                <div className={styles.tileInner} data-inner>
                  <Image
                    src={t.src}
                    alt={t.alt}
                    fill
                    sizes="200px"
                    className={t.photo ? styles.tilePhoto : t.src.startsWith("/frogs/") ? styles.tileFrog : styles.tileArt}
                    draggable={false}
                    priority
                  />
                </div>
              </div>
            ))}
          </div>

          {/* not a physics body — pinned to the centre of the hero, above the pile */}
          <h1 className={styles.headline}>
            {HEADLINE.map((line) => (
              <span key={line} className={styles.headlineMask}>
                <span className={styles.headlineLine} data-rise>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <div className={styles.card} data-body>
            <p className={styles.cardInner} data-inner>
              Safe doesn’t stand out. We build bold identities, fast websites and SEO for brands ready to make a{" "}
              <strong>bigger move.</strong>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
