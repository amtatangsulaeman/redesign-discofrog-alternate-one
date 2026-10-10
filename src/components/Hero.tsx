"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, EASE, REDUCED_MOTION, ScrollTrigger } from "@/lib/gsap";
import { createGravityStage } from "@/lib/gravityStage";
import type { FrogName } from "@/lib/frogArt";
import { bringToLife, bounceProps, eyesWide, talk as mouthTalk } from "@/lib/frogLife";
import FrogArt from "./FrogArt";
import styles from "./Hero.module.css";

/**
 * Gravity hero (after wildishandco.co.uk): a plain centred headline stays put while the
 * stickers and the intro card drop into a pile below it — and can be thrown with the mouse.
 * Once the pile settles the frogs come alive: every few seconds one crouches and hops, and now
 * and then the one that just landed says something about Discofrog in a speech bubble.
 */
const TILES = [
  { src: "/figma/floatImage1.png", bg: "#e9e2d6", photo: true, alt: "JBS Villa brand identity" },
  { src: "/frogs/frog-goldie.svg", bg: "#fdefc4", alt: "", frog: "goldie" as FrogName },
  { src: "/frogs/frog-byte.svg", bg: "#d8ebf6", alt: "", frog: "byte" as FrogName },
  { src: "/frogs/frog-hopper.svg", bg: "#d6f3ec", alt: "", frog: "hopper" as FrogName },
  { src: "/figma/logo.png", bg: "#dff2e2", alt: "" },
  { src: "/frogs/frog-groove.svg", bg: "#ffe1ea", alt: "", frog: "groove" as FrogName },
];


// what the frogs say, in turn
const LINES = [
  "Ribbit! We make brands move.",
  "Branding, websites and SEO. All in-house.",
  "One small team, Jakarta and Melbourne.",
  "Awwwards Nominee 2026!",
  "Fast sites. Bold brands.",
  "Psst… the work is just below.",
];
const DRAG_LINE = "Go on, throw me around.";

const HEADLINE = ["Discofrog makes", "brands move."];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(`not ${REDUCED_MOTION}`, () => {
        const interactive = window.matchMedia("(pointer: fine)").matches;
        const say = stage.current!.querySelector<HTMLElement>("[data-say]")!;
        const sayInner = say.querySelector<HTMLElement>("[data-say-inner]")!;
        const sayText = say.querySelector<HTMLElement>("[data-say-text]")!;
        let speaker: HTMLElement | null = null;

        // keep the bubble over the frog that's talking, inside the stage, tail pointing at it
        const placeBubble = () => {
          if (!speaker || !physics) return;
          const pl = physics.placeOf(speaker);
          if (!pl) return;
          const bw = say.offsetWidth;
          const bh = say.offsetHeight;
          // top of the (possibly tilted) tile
          const reachUp = (Math.abs(Math.cos(pl.angle)) * pl.h + Math.abs(Math.sin(pl.angle)) * pl.w) / 2;
          const left = gsap.utils.clamp(12, physics.width() - bw - 12, pl.x - bw / 2);
          const top = pl.y - reachUp - bh - 14;
          say.style.transform = `translate3d(${left}px, ${top}px, 0)`;
          say.style.setProperty("--tail", `${gsap.utils.clamp(22, bw - 22, pl.x - left)}px`);
        };

        // declared before it exists: the stage calls placeBubble while it builds
        let physics: ReturnType<typeof createGravityStage> | null = null;
        // landing: squash flat for a beat, then spring back up (crouch and stretch are in hopOnce)
        const facing = new Map<HTMLElement, number>();
        const land = (el: HTMLElement) => {
          const inner = el.querySelector("[data-inner]");
          eyesWide(el, false);
          bounceProps(el);
          gsap
            .timeline()
            .to(inner, { scaleY: 0.8, scaleX: 1.16, rotate: 0, duration: 0.07, ease: "power2.out", overwrite: true })
            .to(inner, { scaleY: 1, scaleX: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" });
          // now and then a frog keeps going: a second, smaller hop the same way
          const again = Math.random() < 0.3;
          facing.delete(el);
          if (again) gsap.delayedCall(0.22, () => hopOnce(el, 11.5));
        };
        physics = createGravityStage(stage.current!, { interactive, onSync: placeBubble, onLand: land });

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

        // ——— the frogs come alive ———
        const frogs = gsap.utils.toArray<HTMLElement>("[data-frog]", stage.current);
        const lines = interactive ? [...LINES.slice(0, 3), DRAG_LINE, ...LINES.slice(3)] : LINES;
        let line = 0;
        let hops = 0;

        const talk = (el: HTMLElement) => {
          if (speaker || !physics?.live()) return;
          speaker = el;
          sayText.textContent = lines[line++ % lines.length];
          mouthTalk(el);
          placeBubble();
          gsap
            .timeline({ onComplete: () => void (speaker = null) })
            .fromTo(sayInner, { scale: 0.4, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(2)" })
            .to(sayInner, { scale: 0.85, opacity: 0, y: 6, duration: 0.25, ease: "power2.in" }, "+=2.6");
        };

        // crouch (gathering), launch, stretch and lean into the jump; landing is handled by land()
        function hopOnce(frog?: HTMLElement, power = gsap.utils.random(15.8, 19)) {
          if (!physics?.live()) return;
          const pool = frogs.filter((f) => f !== speaker && !facing.has(f));
          const el = frog ?? pool[Math.floor(Math.random() * pool.length)];
          if (!el) return;
          // a smaller frog (phones) jumps proportionally lower: height grows with power², so
          // scale power by √(size) against the 176 px desktop frog
          const size = gsap.utils.clamp(0.65, 1.1, Math.sqrt(el.offsetHeight / 176));
          power *= size;
          const inner = el.querySelector("[data-inner]");
          gsap
            .timeline()
            .to(inner, { scaleY: 0.78, scaleX: 1.12, rotate: 0, transformOrigin: "50% 100%", duration: frog ? 0.06 : 0.1, ease: "power2.in" })
            .add(() => {
              const dir = physics!.hop(el, power);
              if (!dir) return void gsap.to(inner, { scaleY: 1, scaleX: 1, duration: 0.3 });
              facing.set(el, dir);
              eyesWide(el, true);
              gsap
                .timeline()
                .to(inner, { scaleY: 1.12, scaleX: 0.9, rotate: dir * 7, duration: 0.12, ease: "power2.out" })
                .to(inner, { scaleY: 1, scaleX: 1, rotate: dir * 3, duration: 0.25, ease: "sine.inOut" });
            });
          // every other hop (and sometimes more), the frog says something once it has landed
          if (!frog && (hops++ % 2 === 0 || Math.random() < 0.35)) gsap.delayedCall(1, () => talk(el));
        }
        const tick = () => {
          hopOnce();
          loop = gsap.delayedCall(gsap.utils.random(1.2, 2.4), tick);
        };
        // ——— idle life: breathing, blinking, eyes on the pointer (desktop) or glancing (touch) ———
        const stopLife = bringToLife(frogs, { followPointer: interactive });

        // first hop a little after the pile has settled
        let loop = gsap.delayedCall(3.6, tick);

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
          loop.kill();
          stopLife();
          speaker = null;
          physics?.destroy();
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
              <div
                key={t.src}
                // frogs have no sticker box: just the frog, sitting on the pile
                className={`${styles.tile} ${t.frog ? styles.frogTile : ""}`}
                style={t.frog ? undefined : { background: t.bg }}
                data-body
                data-frog={t.frog ? "" : undefined}
                data-shape={t.frog ? "frog" : undefined}
              >
                <div className={styles.tileInner} data-inner>
                  {t.frog ? (
                    <FrogArt name={t.frog} className={styles.frogArt} />
                  ) : (
                    <Image
                      src={t.src}
                      alt={t.alt}
                      fill
                      sizes="200px"
                      className={t.photo ? styles.tilePhoto : styles.tileArt}
                      draggable={false}
                      priority
                    />
                  )}
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

          {/* what a frog says after a hop (decorative: the same lines are the site's own copy) */}
          <div className={styles.say} data-say aria-hidden>
            <div className={styles.sayInner} data-say-inner>
              <span data-say-text />
            </div>
          </div>

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
