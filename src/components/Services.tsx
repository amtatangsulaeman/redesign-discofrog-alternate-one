"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, useGSAP, EASE, ScrollTrigger, pauseWhenOffscreen } from "@/lib/gsap";
import { SERVICES } from "@/lib/services";
import { bringToLife, part } from "@/lib/frogLife";
import FrogArt from "./FrogArt";
import SectionHeader from "./SectionHeader";
import styles from "./Services.module.css";

/**
 * Home "What we do". The page dims to night while this section is in view (Collins-style
 * theme), and on desktop the section becomes a night-pond story:
 *   a frog on a lily pad, four fireflies blinking above the water. The frog catches the first
 *   one as the pond scrolls in; every scroll after that it flicks its tongue out, reels the next
 *   firefly in and swallows it — its belly glows a little brighter, a jar dot lights up and
 *   that service's card replaces the last. After the fourth, the sun comes up, the page turns
 *   light again and "Here's how we do it" hands over to How we work below.
 * Phones get the same story stacked vertically (card on top, pond below, fireflies placed for
 * a tall screen). Very short screens (landscape phones) and reduced motion keep the accordion.
 * Which one shows is decided in CSS with the same media queries as STORY / STORY_NARROW.
 */
const STORY = "(min-width: 901px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
const STORY_NARROW = "(max-width: 900px) and (min-height: 520px) and (prefers-reduced-motion: no-preference)";
// where each firefly hovers in the scene (fractions of the scene box)
const FLIES = [
  [0.16, 0.3],
  [0.8, 0.16],
  [0.42, 0.1],
  [0.9, 0.46],
];
// phones: the scene is the full width under the card; keep the fireflies clear of the frog
const FLIES_NARROW = [
  [0.14, 0.36],
  [0.84, 0.2],
  [0.36, 0.08],
  [0.9, 0.58],
];
const pad2 = (n: number) => String(n).padStart(2, "0");

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const { contextSafe } = useGSAP(
    () => {
      // Collins-style page theme: the whole page dims to ink while this section holds the
      // middle of the screen (globals.css animates the colour tokens). On desktop the story
      // brings the morning early: once the sun is up the page is light again.
      const html = document.documentElement;
      let inView = false;
      let sunUp = false;
      const applyTheme = () => {
        if (inView && !sunUp) html.dataset.theme = "dark";
        else delete html.dataset.theme;
      };
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 55%",
        end: "bottom 45%",
        refreshPriority: -1, // below the pinned showcase — measure after it
        onToggle: (self) => ((inView = self.isActive), applyTheme()),
        onRefresh: (self) => ((inView = self.isActive), applyTheme()),
      });

      gsap.set("[data-mascot]", { yPercent: 110, rotate: 24 });
      gsap.set("[data-arrow]", { rotate: 0 });
      gsap.from("[data-service]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: EASE.outExpo,
        scrollTrigger: { trigger: "[data-service]", start: "top 85%" },
      });

      const mm = gsap.matchMedia();
      const story = (SPOTS: number[][]) => {
        const el = root.current!.querySelector<HTMLElement>("[data-night]")!;
        const scene = el.querySelector<HTMLElement>("[data-scene]")!;
        const frog = scene.querySelector<HTMLElement>("[data-frog]")!;
        const body = frog.querySelector<HTMLElement>("[data-fbody]")!;
        const belly = frog.querySelector<HTMLElement>("[data-belly]")!;
        const tongue = scene.querySelector<HTMLElement>("[data-tongue]")!;
        const flies = gsap.utils.toArray<HTMLElement>("[data-fly]", scene);
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", el);
        const dots = gsap.utils.toArray<HTMLElement>("[data-dot]", el);
        const N = SERVICES.length;

        // geometry (scene coordinates), re-measured on every refresh. The mouth is taken from the
        // frog's layout box (unaffected by its turn/squash transforms) — the drawn tongue in
        // frog-disco.svg sits at (108, 111) of 216 × 226 — then turned with the frog about its
        // feet (transform-origin 50% 100%) by the angle it faces for that catch.
        const MOUTH_Y = 111 / 226;
        const perch = frog.offsetParent as HTMLElement;
        const mouth = (turnDeg = 0) => {
          const w = frog.offsetWidth;
          const h = frog.offsetHeight;
          const feetX = perch.offsetLeft + frog.offsetLeft + w / 2;
          const feetY = perch.offsetTop + frog.offsetTop + h;
          const r = (turnDeg * Math.PI) / 180;
          const up = h * (1 - MOUTH_Y); // mouth height above the feet
          return { x: feetX + up * Math.sin(r), y: feetY - up * Math.cos(r) };
        };
        const fly = (i: number) => ({ x: SPOTS[i][0] * scene.clientWidth, y: SPOTS[i][1] * scene.clientHeight });
        flies.forEach((f, i) => gsap.set(f, { left: `${SPOTS[i][0] * 100}%`, top: `${SPOTS[i][1] * 100}%` }));
        // how far the frog turns towards firefly i (a little, never more than 14°)
        const turnFor = (i: number) => {
          const m = mouth();
          const f = fly(i);
          return gsap.utils.clamp(-14, 14, ((Math.atan2(f.y - m.y, f.x - m.x) * 180) / Math.PI + 90) * 0.18);
        };
        const reach = (i: number) => {
          const m = mouth(turnFor(i));
          const f = fly(i);
          return { m, len: Math.hypot(f.x - m.x, f.y - m.y), angle: (Math.atan2(f.y - m.y, f.x - m.x) * 180) / Math.PI };
        };

        gsap.set(cards, { autoAlpha: 0, y: 30 });
        gsap.set(tongue, { scaleX: 0 });
        gsap.set(belly, { opacity: 0 });
        gsap.set(dots, { "--on": 0 });

        // the fireflies drift and blink on their own (inner layer; catches move the outer one)
        const drift = gsap.to("[data-fly-drift]", {
          x: () => gsap.utils.random(-14, 14),
          y: () => gsap.utils.random(-10, 10),
          duration: () => gsap.utils.random(1.4, 2.4),
          ease: "sine.inOut",
          stagger: { each: 0.2, yoyo: true, repeat: -1 },
        });
        const blink = gsap.to("[data-fly-glow]", {
          opacity: 0.35,
          duration: () => gsap.utils.random(0.5, 1.1),
          ease: "sine.inOut",
          stagger: { each: 0.15, from: "random", yoyo: true, repeat: -1 },
        });
        const stars = gsap.to("[data-star]", {
          opacity: 0.2,
          duration: () => gsap.utils.random(1, 2.2),
          ease: "sine.inOut",
          stagger: { each: 0.1, from: "random", yoyo: true, repeat: -1 },
        });
        pauseWhenOffscreen(el, [drift, blink, stars]);

        // the frog's face (inline art): it eyes each firefly before it strikes, squints and chews after
        const pupils = [...part(frog, "Pupil L"), ...part(frog, "Pupil R")];
        const shines = [...part(frog, "Shine L"), ...part(frog, "Shine R")];
        const eyes = part(frog, "Eyes");
        const mouthArt = part(frog, "Mouth");
        const aim = (i: number) => (reach(i).angle * Math.PI) / 180;
        const stopLife = bringToLife([frog], { glance: false });

        // one catch: eye it, crouch, turn, tongue out, reel the firefly in, swallow, glow, next card
        const caught = (tl: gsap.core.Timeline, i: number, t: number) => {
          tl.to(pupils, { x: () => Math.cos(aim(i)) * 7, y: () => Math.sin(aim(i)) * 6, duration: 0.1, ease: "power2.out" }, t)
            .to(shines, { x: () => Math.cos(aim(i)) * 3, y: () => Math.sin(aim(i)) * 2.5, duration: 0.1, ease: "power2.out" }, t)
            // after the gulp: a happy squint, a little chewing, eyes back to the middle
            .to(eyes, { scaleY: 0.45, svgOrigin: "108 52", duration: 0.08, ease: "power2.out" }, t + 0.56)
            .to(eyes, { scaleY: 1, duration: 0.15, ease: "power2.out" }, t + 0.76)
            .to(mouthArt, { scaleY: 1.3, svgOrigin: "108 100", duration: 0.05, ease: "sine.inOut", yoyo: true, repeat: 3 }, t + 0.58)
            .to([...pupils, ...shines], { x: 0, y: 0, duration: 0.2, ease: "power2.out" }, t + 0.62);
          // crouch and turn first, back to full height before the tongue leaves the mouth, so the
          // mouth is exactly where the tongue starts
          tl.to(body, { scaleY: 0.88, scaleX: 1.08, duration: 0.08, ease: "power2.out" }, t)
            .to(frog, { rotate: () => turnFor(i), duration: 0.12, ease: "power2.out" }, t)
            .to(body, { scaleY: 1, scaleX: 1, duration: 0.05 }, t + 0.08)
            .set(tongue, { x: () => reach(i).m.x, y: () => reach(i).m.y - 4, rotate: () => reach(i).angle, width: () => reach(i).len, scaleX: 0 }, t + 0.14)
            .to(tongue, { scaleX: 1, duration: 0.16, ease: "power3.out" }, t + 0.15)
            // reel it in: tongue and firefly travel back together
            .to(tongue, { scaleX: 0, duration: 0.22, ease: "power2.in" }, t + 0.33)
            .to(flies[i], { x: () => reach(i).m.x - fly(i).x, y: () => reach(i).m.y - fly(i).y, scale: 0.4, duration: 0.22, ease: "power2.in" }, t + 0.33)
            .to(flies[i], { opacity: 0, duration: 0.04 }, t + 0.54)
            // gulp
            .to(body, { scaleY: 0.84, scaleX: 1.14, duration: 0.07, ease: "power2.out" }, t + 0.55)
            .to(body, { scaleY: 1, scaleX: 1, duration: 0.22, ease: "back.out(3)" }, t + 0.62)
            .to(frog, { rotate: 0, duration: 0.25, ease: "power2.out" }, t + 0.55)
            .to(belly, { opacity: 0.25 + i * 0.22, duration: 0.2 }, t + 0.56)
            .to(dots[i], { "--on": 1, duration: 0.15 }, t + 0.56);
          if (i > 0) tl.to(cards[i - 1], { autoAlpha: 0, y: -24, duration: 0.2, ease: "power2.in" }, t + 0.1);
          tl.to(cards[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, t + 0.6);
        };

        // the frog catches the first firefly as the pond scrolls in
        const intro = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 45%" } });
        intro.timeScale(1.4);
        caught(intro, 0, 0.2);

        const HOLD = 0.3;
        const SUNRISE = N - 1; // the timeline unit after the last catch
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            // each catch takes ~3/4 of a screen of scrolling
            end: () => `+=${Math.round(window.innerHeight * 0.75 * (N + HOLD))}`,
            pin: true,
            // the section is a flex column, where ScrollTrigger would skip the spacing by default
            pinSpacing: true,
            scrub: 0.4,
            invalidateOnRefresh: true,
            // settle on the nearest catch (no velocity guess, so a flick never skips one)
            snap: { snapTo: "labels", inertia: false, duration: { min: 0.3, max: 0.9 }, delay: 0.1, ease: "power2.inOut" },
            onUpdate: (self) => {
              const up = self.animation!.time() > SUNRISE + 0.55;
              if (up !== sunUp) {
                sunUp = up;
                applyTheme();
              }
            },
          },
        });
        tl.addLabel("c0", 0);
        for (let i = 1; i < N; i++) {
          caught(tl, i, i - 1);
          tl.addLabel(`c${i}`, i);
        }
        // sunrise: the last card makes way for the hand-over line, the sky warms, the frog hops
        const finale = el.querySelector("[data-finale]");
        tl.to(cards[N - 1], { autoAlpha: 0, y: -24, duration: 0.2, ease: "power2.in" }, SUNRISE)
          .to("[data-sun]", { opacity: 1, yPercent: -18, duration: 0.8, ease: "power1.out" }, SUNRISE)
          .to("[data-stars]", { opacity: 0, duration: 0.6 }, SUNRISE + 0.1)
          .to("[data-day-water]", { opacity: 1, duration: 0.7, ease: "power1.inOut" }, SUNRISE + 0.15)
          .to("[data-night-water]", { opacity: 0, duration: 0.7, ease: "power1.inOut" }, SUNRISE + 0.15)
          .to(belly, { opacity: 1, duration: 0.3 }, SUNRISE + 0.1)
          .to(body, { y: -50, scaleY: 1.08, scaleX: 0.94, duration: 0.18, ease: "power2.out" }, SUNRISE + 0.3)
          .to(eyes, { scale: 1.12, svgOrigin: "108 52", duration: 0.15, ease: "back.out(3)" }, SUNRISE + 0.3)
          .to(eyes, { scale: 1, duration: 0.2 }, SUNRISE + 0.55)
          .to(body, { y: 0, scaleY: 1, scaleX: 1, duration: 0.22, ease: "bounce.out" }, SUNRISE + 0.48)
          .fromTo(finale, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, SUNRISE + 0.35)
          .addLabel("sunrise", SUNRISE + 1)
          .to({}, { duration: HOLD });

        return () => {
          stopLife();
          sunUp = false;
          applyTheme();
        };
      };
      mm.add(STORY, () => story(FLIES));
      mm.add(STORY_NARROW, () => story(FLIES_NARROW));

      return () => mm.revert();
    },
    { scope: root },
  );
  // leave the page light if this section unmounts while dimmed
  useEffect(() => () => void delete document.documentElement.dataset.theme, []);

  const toggle = contextSafe((i: number) => {
    const rows = gsap.utils.toArray<HTMLElement>("[data-service]");
    const next = open === i ? null : i;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduced ? 0 : 0.8;

    rows.forEach((row, idx) => {
      const body = row.querySelector("[data-body]");
      const mascot = row.querySelector("[data-mascot]");
      const arrow = row.querySelector("[data-arrow]");
      const isOpen = idx === next;
      if (isOpen) body!.removeAttribute("hidden");
      gsap.to(body, {
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
        duration: D,
        ease: EASE.outExpo,
        overwrite: true,
        // closed panels leave the accessibility tree and the tab order
        onComplete: () => {
          if (!isOpen) body!.setAttribute("hidden", "");
          else gsap.set(body, { height: "auto" }); // inline auto (not a px value) → follows content on resize
          ScrollTrigger.refresh();
        },
      });
      gsap.to(arrow, { rotate: isOpen ? 180 : 0, duration: 0.6, ease: EASE.outExpo, overwrite: true });
      gsap.to(mascot, {
        yPercent: isOpen ? 0 : 110,
        rotate: isOpen ? 8 : 24,
        duration: isOpen ? 0.9 : 0.4,
        delay: isOpen ? 0.2 : 0,
        ease: isOpen ? EASE.popBack : "power2.in",
        overwrite: true,
      });
    });
    setOpen(next);
  });

  return (
    <section id="services" ref={root} className={styles.services}>
      <SectionHeader eyebrow="Explore  02  /  Capabilities" title="What we do" code="S.04" />

      {/* ——— Desktop: the night pond (the wrapper is full-bleed; the pinned stage fills it) ——— */}
      <div className={styles.nightWrap}>
      <div className={styles.night} data-night>
        <div className={styles.sun} data-sun aria-hidden />
        <div className={styles.stars} data-stars aria-hidden>
          {Array.from({ length: 14 }, (_, k) => (
            <span
              key={k}
              className={styles.star}
              data-star
              style={{ left: `${(k * 37) % 100}%`, top: `${(k * 53) % 60}%` } as React.CSSProperties}
            />
          ))}
        </div>
        <div className={styles.nightWater} data-night-water aria-hidden />
        <div className={styles.dayWater} data-day-water aria-hidden />

        {/* what the frog has caught so far */}
        <div className={styles.cards}>
          {SERVICES.map((s, i) => (
            <article key={s.slug} className={styles.card} data-card aria-labelledby={`night-${s.slug}`}>
              <p className={styles.caught}>
                Caught {pad2(i + 1)} / {pad2(SERVICES.length)}
              </p>
              <h3 id={`night-${s.slug}`} className={styles.cardTitle}>
                {s.title}
              </h3>
              <p className={styles.cardSummary}>{s.summary}</p>
              <p className={styles.cardBody}>{s.body}</p>
              <p className={styles.cardList}>{s.list.flat().slice(0, 4).join("  ·  ")}</p>
            </article>
          ))}
          <div className={styles.card} data-finale>
            <p className={styles.caught}>Morning</p>
            <p className={styles.cardTitle}>That’s what we do. Here’s how we do it.</p>
            <p className={styles.hint}>
              Keep scrolling <ArrowDown size={15} strokeWidth={2} aria-hidden />
            </p>
          </div>
          {/* the jar: one dot per firefly caught */}
          <div className={styles.jar} aria-hidden>
            {SERVICES.map((s) => (
              <span key={s.slug} className={styles.dot} data-dot />
            ))}
          </div>
        </div>

        <div className={styles.scene} data-scene aria-hidden>
          {FLIES.map(([x, y], i) => (
            <span key={i} className={styles.fly} data-fly style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
              <span className={styles.flyDrift} data-fly-drift>
                <span className={styles.flyGlow} data-fly-glow />
                <span className={styles.flyBody} />
              </span>
            </span>
          ))}
          <span className={styles.tongue} data-tongue />
          <div className={styles.perch}>
            <svg className={styles.padSvg} viewBox="0 0 220 100">
              <ellipse cx="110" cy="60" rx="104" ry="36" fill="rgba(0, 0, 0, 0.25)" />
              <path d="M110 50 L213.6 46.5 A104 40 0 1 1 204.3 33.1 Z" fill="#3f7d4a" stroke="#2f6339" strokeWidth="2" />
              <g stroke="rgba(255,255,255,0.18)" strokeWidth="1.6" strokeLinecap="round">
                <path d="M110 50 L28 34" />
                <path d="M110 50 L36 70" />
                <path d="M110 50 L110 88" />
                <path d="M110 50 L180 78" />
                <path d="M110 50 L60 16" />
              </g>
            </svg>
            <div className={styles.frog} data-frog>
              <div className={styles.frogBody} data-fbody>
                <FrogArt name="disco" className={styles.frogArt} />
                <span className={styles.belly} data-belly />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ——— Phones, short screens, reduced motion: the accordion ——— */}
      <div className={styles.accordion}>
        {SERVICES.map((s, i) => (
          <div key={s.title} className={`${styles.item} ${open === i ? styles.open : ""}`} data-service>
            <button
              id={`service-${i}-label`}
              className={styles.row}
              onClick={() => toggle(i)}
              aria-expanded={open === i}
              aria-controls={`service-${i}`}
            >
              <span className={styles.left}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.title}>{s.title}</span>
              </span>
              <span className={styles.right}>
                <span className={styles.summary}>{s.summary}</span>
                <span className={styles.arrow}>
                  <span data-arrow className={styles.arrowGlyph}>
                    <ArrowDown size={24} strokeWidth={2} />
                  </span>
                </span>
              </span>
            </button>

            <div
              id={`service-${i}`}
              className={styles.body}
              data-body
              role="region"
              aria-labelledby={`service-${i}-label`}
              hidden
            >
              <div className={styles.bodyInner}>
                <p className={styles.bodyText}>{s.body}</p>
                {/* one stacked list under the paragraph */}
                <ul className={styles.list}>
                  {s.list.flat().map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.mascotWrap} aria-hidden>
              <div className={styles.mascot} data-mascot>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mascot} alt="" />
              </div>
            </div>
          </div>
        ))}
        <div className={styles.divider} />
      </div>
    </section>
  );
}
