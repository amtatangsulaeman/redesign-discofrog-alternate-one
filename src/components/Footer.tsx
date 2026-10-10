"use client";

import { useRef } from "react";
import { ArrowRight, ArrowUp } from "lucide-react";
import { gsap, useGSAP, REDUCED_MOTION, pauseWhenOffscreen } from "@/lib/gsap";
import { bringToLife, part } from "@/lib/frogLife";
import DiscoBall from "./DiscoBall";
import Mascot from "./Mascot";
import styles from "./Footer.module.css";

// Beam pivots — base angle + first swing direction (Figma 208:557…565)
const BEAMS = [
  { src: "/figma/beamPivot.svg", base: 55, dir: 1, bright: true },
  { src: "/figma/beamPivot1.svg", base: 25, dir: -1, bright: false },
  { src: "/figma/beamPivot2.svg", base: 0, dir: 1, bright: true },
  { src: "/figma/beamPivot3.svg", base: -25, dir: -1, bright: false },
  { src: "/figma/beamPivot4.svg", base: -55, dir: 1, bright: true },
];

const SPOTS = [
  { src: "/figma/floorSpot.svg", x: 816, dir: -1 },
  { src: "/figma/floorSpot1.svg", x: 966, dir: 1 },
  { src: "/figma/floorSpot2.svg", x: 1116, dir: -1 },
  { src: "/figma/floorSpot3.svg", x: 1266, dir: 1 },
];

const SPARKLES = [
  { src: "/figma/sparkle1.svg", x: 1041, y: 206, s: 22, delay: 0 },
  { src: "/figma/sparkle3.svg", x: 1243, y: 236, s: 16, delay: 0.6 },
  { src: "/figma/sparkle4.svg", x: 1081, y: 316, s: 14, delay: 0.2 },
  { src: "/figma/sparkle5.svg", x: 1271, y: 326, s: 20, delay: 0.3 },
  { src: "/figma/sparkle6.svg", x: 991, y: 266, s: 12, delay: 0.9 },
];

const COLUMNS = [
  { label: "Jakarta", lines: ["Level 25, Revenue Tower", "District 8, SCBD"] },
  { label: "Melbourne", lines: ["199 William Street", "Melbourne, Australia"] },
  {
    label: "Contact",
    lines: [
      { text: "discofrogstudio@gmail.com", href: "mailto:discofrogstudio@gmail.com" },
      { text: "WhatsApp", href: "#" },
    ],
  },
  {
    label: "Follow",
    lines: [
      { text: "Instagram", href: "#" },
      { text: "LinkedIn", href: "#" },
      { text: "Behance", href: "#" },
    ],
  },
];

/**
 * Frog dance at 120 BPM (one beat = 0.5s, synced with the beam flicker), 4 bars = 8s loop.
 * Squash & stretch pivots on the feet so it stays planted; a floor shadow sells the hops.
 *   bar 1 · bounce on every beat
 *   bar 2 · hip sway — weight shifts left / right, body leans into it
 *   bar 3 · shimmy — quick shoulder wiggle on the off-beats, then a crouch
 *   bar 4 · big jump with stretch, wobbly landing, settle
 * The face dances along: it sings on the bounces, eyes follow the sway, closes its eyes for the
 * shimmy, goes wide-eyed in the big jump and blushes on the landing.
 */
function buildDance(frog: HTMLElement, shadow: HTMLElement) {
  const B = 0.5;
  const tl = gsap.timeline({ repeat: -1, defaults: { overwrite: false } });
  const rest = { y: 0, x: 0, scaleX: 1, scaleY: 1, rotation: 0, skewX: 0 };
  gsap.set(frog, { ...rest, transformOrigin: "50% 96%" });

  // one hop: crouch (anticipation) → stretch up → squash on landing → recover
  const hop = (at: number, h: number, extra: gsap.TweenVars = {}) => {
    tl.to(frog, { scaleX: 1.1, scaleY: 0.86, y: 0, duration: B * 0.18, ease: "power2.out", ...extra }, at)
      .to(frog, { scaleX: 0.92, scaleY: 1.1, y: -h, duration: B * 0.32, ease: "power2.out" }, at + B * 0.18)
      .to(frog, { scaleX: 1, scaleY: 1, y: 0, duration: B * 0.3, ease: "power2.in" }, at + B * 0.5)
      .to(frog, { scaleX: 1.14, scaleY: 0.84, duration: B * 0.08, ease: "power1.out" }, at + B * 0.8)
      .to(frog, { scaleX: 1, scaleY: 1, duration: B * 0.12, ease: "back.out(3)" }, at + B * 0.88);
    tl.to(shadow, { scale: 1 - h / 120, opacity: 0.35, duration: B * 0.5, ease: "power2.out" }, at + B * 0.18).to(
      shadow,
      { scale: 1, opacity: 0.6, duration: B * 0.3, ease: "power2.in" },
      at + B * 0.5,
    );
  };

  // bar 1 — bounce
  for (let i = 0; i < 4; i++) hop(i * B, 14);

  // bar 2 — hip sway: lean into each side, small dip on the beat
  [-1, 1, -1, 1].forEach((dir, i) => {
    const at = 2 + i * B;
    tl.to(frog, { x: dir * 10, rotation: dir * 8, skewX: -dir * 5, scaleY: 0.95, scaleX: 1.04, duration: B * 0.45, ease: "sine.out" }, at)
      .to(frog, { scaleY: 1.02, scaleX: 0.99, duration: B * 0.55, ease: "sine.inOut" }, at + B * 0.45);
    tl.to(shadow, { x: dir * 8, duration: B, ease: "sine.inOut" }, at);
  });

  // bar 3 — shimmy (fast wiggle), then crouch to wind up
  tl.to(frog, { x: 0, rotation: 0, skewX: 0, scaleX: 1, scaleY: 1, duration: 0.15, ease: "sine.out" }, 4);
  tl.to(shadow, { x: 0, duration: 0.3 }, 4);
  for (let i = 0; i < 10; i++) {
    tl.to(frog, { skewX: i % 2 ? -7 : 7, rotation: i % 2 ? 3 : -3, duration: 0.15, ease: "sine.inOut" }, 4.15 + i * 0.15);
  }
  tl.to(frog, { skewX: 0, rotation: 0, scaleX: 1.16, scaleY: 0.8, duration: 0.35, ease: "power2.in" }, 5.65);

  // bar 4 — big jump with a little twist, wobbly landing
  tl.to(frog, { scaleX: 0.88, scaleY: 1.16, y: -70, rotation: -10, duration: 0.42, ease: "power3.out" }, 6)
    .to(frog, { rotation: 8, duration: 0.3, ease: "sine.inOut" }, 6.3)
    .to(frog, { y: 0, scaleX: 0.96, scaleY: 1.06, rotation: 0, duration: 0.33, ease: "power2.in" }, 6.42)
    .to(frog, { scaleX: 1.22, scaleY: 0.78, duration: 0.08, ease: "power1.out" }, 6.75)
    .to(frog, { scaleX: 0.95, scaleY: 1.05, duration: 0.18, ease: "sine.out" }, 6.83)
    .to(frog, { scaleX: 1.03, scaleY: 0.98, duration: 0.18, ease: "sine.inOut" }, 7.01)
    .to(frog, { ...rest, duration: 0.3, ease: "sine.out" }, 7.19);
  tl.to(shadow, { scale: 0.45, opacity: 0.2, duration: 0.42, ease: "power3.out" }, 6).to(
    shadow,
    { scale: 1, opacity: 0.6, duration: 0.33, ease: "power2.in" },
    6.42,
  );
  // ——— the face ———
  const eyes = part(frog, "Eyes");
  const mouth = part(frog, "Mouth");
  const pupils = [...part(frog, "Pupil L"), ...part(frog, "Pupil R")];
  const shines = [...part(frog, "Shine L"), ...part(frog, "Shine R")];
  const cheeks = [...part(frog, "Cheek L"), ...part(frog, "Cheek R")];
  const EYE = "108 52";
  const MOUTH = "108 100";
  // bar 1: sings, the mouth opens on every hop
  for (let i = 0; i < 4; i++) {
    tl.to(mouth, { scaleY: 1.5, scaleX: 0.9, svgOrigin: MOUTH, duration: B * 0.25, ease: "power2.out" }, i * B + B * 0.18).to(
      mouth,
      { scaleY: 1, scaleX: 1, duration: B * 0.3, ease: "power2.in" },
      i * B + B * 0.55,
    );
  }
  // bar 2: eyes lead the sway
  [-1, 1, -1, 1].forEach((dir, i) => {
    tl.to(pupils, { x: dir * 6, y: 1, duration: B * 0.4, ease: "sine.out" }, 2 + i * B).to(shines, { x: dir * 2.5, duration: B * 0.4, ease: "sine.out" }, 2 + i * B);
  });
  // bar 3: eyes shut, big grin, lost in the music
  tl.to([...pupils, ...shines], { x: 0, y: 0, duration: 0.15 }, 4)
    .to(eyes, { scaleY: 0.12, svgOrigin: EYE, duration: 0.12, ease: "power2.in" }, 4.1)
    .to(mouth, { scaleY: 1.6, scaleX: 1.05, svgOrigin: MOUTH, duration: 0.2, ease: "power2.out" }, 4.1)
    .to(eyes, { scaleY: 1, duration: 0.15, ease: "power2.out" }, 5.6)
    .to(mouth, { scaleY: 1, scaleX: 1, duration: 0.2 }, 5.6);
  // bar 4: wide-eyed in the air, a blush on landing
  tl.to(eyes, { scale: 1.16, svgOrigin: EYE, duration: 0.2, ease: "back.out(3)" }, 6)
    .to(mouth, { scaleY: 1.7, scaleX: 0.85, svgOrigin: MOUTH, duration: 0.2, ease: "power2.out" }, 6)
    .to(eyes, { scale: 1, duration: 0.2, ease: "power2.out" }, 6.75)
    .to(mouth, { scaleY: 1, scaleX: 1, duration: 0.25 }, 6.75)
    .to(cheeks, { opacity: 1, scale: 1.2, svgOrigin: "108 107", duration: 0.2 }, 6.75)
    .to(cheeks, { opacity: 0.55, scale: 1, duration: 0.5 }, 7.3);

  tl.to({}, { duration: 8 - tl.duration() }); // pad to exactly 4 bars
  return tl;
}

const u = (v: number) => `calc(var(--su) * ${v})`;

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const mascot = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        const q = gsap.utils.selector(root);
        const loops: gsap.core.Animation[] = [];

        // Beams swing ±22° around their base angle and flicker 1 ↔ 0.35 every 0.5s
        q("[data-beam]").forEach((el, i) => {
          const { base, dir, bright } = BEAMS[i];
          const angles = [base + 22 * dir];
          for (let k = 0; k < 7; k++) angles.push(base + 22 * (k % 2 === 0 ? -dir : dir));
          gsap.set(el, { rotate: base, opacity: bright ? 1 : 0.35 });
          loops.push(
            gsap.to(el, {
              keyframes: { rotate: angles, easeEach: "sine.inOut" },
              duration: 8,
              ease: "none",
              repeat: -1,
            }),
            gsap.to(el, { opacity: bright ? 0.35 : 1, duration: 0.5, ease: "power1.out", yoyo: true, repeat: -1 }),
          );
        });

        // Floor spots slide ±180px (of a 220px spot) left/right
        q("[data-spot]").forEach((el, i) => {
          const d = (SPOTS[i].dir * 180 * 100) / 220;
          loops.push(
            gsap.to(el, {
              keyframes: { xPercent: [0, d, 0, -d, 0], easeEach: "sine.inOut" },
              duration: 8,
              ease: "none",
              repeat: -1,
            }),
          );
        });

        // Sparkles twinkle + turn
        q("[data-sparkle]").forEach((el, i) => {
          loops.push(
            gsap.to(el, { rotate: 180, duration: 8, ease: "none", repeat: -1 }),
            gsap.fromTo(
              el,
              { opacity: 1 },
              { opacity: 0.15, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: SPARKLES[i].delay },
            ),
          );
        });

        loops.push(buildDance(mascot.current!, q("[data-mascot-shadow]")[0]));
        // breathing and twinkling sparkles; the dance drives the eyes, so no blinking or glancing
        const stopLife = bringToLife([mascot.current!], { glance: false, blink: false });

        // Nothing in the disco stage needs to run while the footer is off screen
        pauseWhenOffscreen(root.current, loops);

        // Giant wordmark rises in
        gsap.from(q("[data-big]"), {
          yPercent: 40,
          ease: "none",
          scrollTrigger: { trigger: q("[data-big]"), start: "top bottom", end: "bottom bottom", scrub: true },
        });

        return () => stopLife();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer ref={root} className={styles.footer} data-nav-theme="dark">
      <div className={styles.stage} aria-hidden>
        {SPOTS.map((s) => (
          <div
            key={s.src}
            className={styles.spot}
            data-spot
            style={{ left: u(s.x), top: u(478), width: u(220), height: u(60) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt="" className={styles.spotImg} />
          </div>
        ))}

        {BEAMS.map((b) => (
          <div key={b.src} className={styles.beam} data-beam>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt="" className={styles.beamImg} />
          </div>
        ))}

        <div className={styles.string} />
        <div className={styles.cap} />
        <div className={styles.ball}>
          <DiscoBall className={styles.ballCanvas} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/shade.svg" alt="" className={styles.shade} />
          <div className={styles.highlight}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/highlight.svg" alt="" />
          </div>
        </div>

        <div className={styles.mascotSpot}>
          <span className={styles.mascotShadow} data-mascot-shadow aria-hidden />
          <Mascot ref={mascot} />
        </div>

        {SPARKLES.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.src}
            src={s.src}
            alt=""
            data-sparkle
            className={styles.sparkle}
            style={{ left: u(s.x), top: u(s.y), width: u(s.s), height: u(s.s) }}
          />
        ))}
      </div>

      <div className={styles.columns}>
        {COLUMNS.map((c) => (
          <div key={c.label} className={styles.col}>
            <p className={styles.colLabel}>{c.label}</p>
            <div className={styles.colBody}>
              {c.lines.map((l) =>
                typeof l === "string" ? (
                  <p key={l}>{l}</p>
                ) : (
                  <a key={l.text} href={l.href} className={styles.link}>
                    <ArrowRight size={15} strokeWidth={2} aria-hidden />
                    {l.text}
                  </a>
                ),
              )}
            </div>
          </div>
        ))}
        <div className={styles.col}>
          <button className={`${styles.colLabel} ${styles.toTop}`} onClick={toTop}>
            Back to top <ArrowUp size={14} strokeWidth={2} aria-hidden />
          </button>
          <p className={styles.colBody}>© 2026 Disco Frog Studio</p>
        </div>
      </div>

      <p className={styles.big} data-big>
        Discofrog.
      </p>
    </footer>
  );
}
