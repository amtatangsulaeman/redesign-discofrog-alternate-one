"use client";

import { useRef } from "react";
import { gsap, useGSAP, REDUCED_MOTION, ScrollTrigger } from "@/lib/gsap";
import { bounceProps, bringToLife, eyesWide, squint } from "@/lib/frogLife";
import type { FrogName } from "@/lib/frogArt";
import FrogArt from "./FrogArt";
import styles from "./Principles.module.css";

type Principle = { label: string; title: string; text: string; frog: string; tint: string };

// "/frogs/frog-goldie.svg" → "goldie"
const artOf = (src: string) => src.replace(/^.*frog-|\.svg$/g, "") as FrogName;

/**
 * Four tinted cards, each with its frog, set on a staggered shelf (like /work).
 * The frogs are alive: they breathe and blink, watch the pointer (or glance around on touch),
 * wave hello with a hop as the cards come in, and now and then one hops on its own.
 * Mouse: the card tilts toward the cursor and the frog hops; a tap makes it hop on touch.
 */
export default function Principles({ items }: { items: Principle[] }) {
  const root = useRef<HTMLUListElement>(null);

  // one hop of a card's frog: crouch, jump (eyes wide), land with a bounce and a pleased squint
  const hop = (card: Element, height = 26) => {
    const frog = card.querySelector<HTMLElement>("[data-frog-hop]");
    const art = card.querySelector("[data-frog-art]");
    if (!frog || !art) return;
    eyesWide(art, true);
    gsap.fromTo(
      frog,
      { y: 0, scaleY: 1, scaleX: 1 },
      {
        keyframes: [
          { scaleY: 0.84, scaleX: 1.12, duration: 0.1, ease: "power2.out" },
          { y: -height, scaleY: 1.1, scaleX: 0.93, duration: 0.22, ease: "power2.out" },
          { y: 0, scaleY: 0.86, scaleX: 1.12, duration: 0.2, ease: "power2.in" },
          { scaleY: 1, scaleX: 1, duration: 0.35, ease: "elastic.out(1, 0.45)" },
        ],
        overwrite: true,
        onComplete: () => {
          eyesWide(art, false);
          bounceProps(art);
          squint(art);
        },
      },
    );
  };

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        const cards = gsap.utils.toArray<HTMLElement>("li", el);
        const arts = gsap.utils.toArray<HTMLElement>("[data-frog-art]", el);
        const stopLife = bringToLife(arts, { followPointer: window.matchMedia("(pointer: fine)").matches });

        // hello: the frogs hop in turn as the shelf comes into view
        const hello = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 70%" } });
        cards.forEach((c, i) => hello.add(() => hop(c, 22), 0.35 + i * 0.18));

        // every few seconds one frog hops on its own (only while the shelf is on screen)
        let onScreen = false;
        ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => (onScreen = self.isActive) });
        let idle = gsap.delayedCall(4, function tick() {
          if (onScreen) hop(cards[Math.floor(Math.random() * cards.length)], 14);
          idle = gsap.delayedCall(gsap.utils.random(3.5, 6.5), tick);
        });

        return () => {
          stopLife();
          idle.kill();
        };
      });
      return () => {
        mm.revert();
        // handlers animate outside the context — kill their tweens on unmount
        gsap.killTweensOf(el.querySelectorAll("li, [data-frog], [data-frog-hop]"));
      };
    },
    { scope: root },
  );

  const fine = () => window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
  const motionOk = () => !window.matchMedia(REDUCED_MOTION).matches;

  const onMove = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse" || !fine()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(e.currentTarget, { rotateY: nx * 10, rotateX: -ny * 10, duration: 0.6, ease: "power3.out" });
    gsap.to(e.currentTarget.querySelector("[data-frog]"), { x: nx * 18, y: ny * 12, duration: 0.6, ease: "power3.out" });
  };
  const onEnter = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse" || !fine()) return;
    hop(e.currentTarget);
  };
  // touch: tap a card and its frog hops
  const onTap = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.pointerType === "mouse" || !motionOk()) return;
    hop(e.currentTarget);
  };
  const onLeave = (e: React.PointerEvent<HTMLLIElement>) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
    gsap.to(e.currentTarget.querySelector("[data-frog]"), { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
  };

  return (
    <ul ref={root} className={styles.grid} data-reveal>
      {items.map((p, i) => (
        <li
          key={p.label}
          className={styles.card}
          style={{ background: p.tint }}
          onPointerMove={onMove}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          onPointerUp={onTap}
        >
          <div className={styles.top}>
            <span className={styles.label}>{p.label}</span>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
          </div>
          <div className={styles.frog} data-frog aria-hidden>
            <div className={styles.frogHop} data-frog-hop>
              <span data-frog-art className={styles.frogArtWrap}>
                <FrogArt name={artOf(p.frog)} className={styles.frogArt} />
              </span>
            </div>
          </div>
          <div className={styles.copy}>
            <h3 className={styles.title}>{p.title}</h3>
            <p className={styles.text}>{p.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
