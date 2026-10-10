"use client";

import { Fragment, useId, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { gsap, useGSAP, EASE, REDUCED_MOTION, ScrollTrigger, pauseWhenOffscreen } from "@/lib/gsap";
import { SERVICES, EXTRAS } from "@/lib/services";
import { projectBySlug } from "@/lib/projects";
import { bringToLife, part, talk } from "@/lib/frogLife";
import FrogArt from "./FrogArt";
import SectionHeader from "./SectionHeader";
import styles from "./ServicesPage.module.css";

/**
 * /services told as a pond story: four lily pads, one frog. Every pad it lands on is a
 * service, and the frog "says" it in a speech bubble.
 *
 * Desktop: the pond is a pinned stage. Scrolling makes the frog crouch, hop along an arc to
 * the next pad and land with a splash (droplets + ripples, the pad dips); then its bubble
 * pops up. Scrolling snaps to each landing.
 * Phones, short screens: the pads stack down the page and the frog drops onto each one as it
 * scrolls in. Reduced motion: the same stacked pond, still.
 * Which of the two is shown is decided in CSS with the same media query as STORY below.
 */
const pad2 = (n: number) => String(n).padStart(2, "0");
const STORY = "(min-width: 901px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
const STACK =
  "(max-width: 900px) and (prefers-reduced-motion: no-preference), (max-height: 639px) and (prefers-reduced-motion: no-preference)";

// fixed splash pattern (dx, rise, size px) per droplet, so every landing looks alike; wide
// enough that the droplets clear the frog sitting in the middle
const DROPS = [
  [-150, 70, 12],
  [-118, 118, 9],
  [-84, 150, 14],
  [-52, 170, 8],
  [56, 168, 10],
  [90, 146, 14],
  [124, 112, 9],
  [156, 66, 12],
  [-176, 30, 8],
  [180, 34, 8],
];

function LilyPad({ flower }: { flower?: boolean }) {
  // unique gradient id per pad: a shared id could resolve to a copy inside a hidden layout
  const fill = `pad-${useId().replace(/:/g, "")}`;
  return (
    <svg className={styles.padSvg} viewBox="0 0 220 100" aria-hidden>
      <defs>
        <radialGradient id={fill} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#9bd79a" />
          <stop offset="100%" stopColor="#5ea964" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="60" rx="104" ry="36" fill="rgba(20, 90, 110, 0.14)" />
      <path d="M110 50 L213.6 46.5 A104 40 0 1 1 204.3 33.1 Z" fill={`url(#${fill})`} stroke="#4c9a57" strokeWidth="2" />
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M110 50 L28 34" />
        <path d="M110 50 L36 70" />
        <path d="M110 50 L110 88" />
        <path d="M110 50 L180 78" />
        <path d="M110 50 L120 12" />
        <path d="M110 50 L60 16" />
      </g>
      {flower && (
        <g transform="translate(48 40)">
          <ellipse cx="0" cy="-6" rx="7" ry="11" fill="#f7b6cf" />
          <ellipse cx="-9" cy="0" rx="10" ry="6" fill="#f39cbd" />
          <ellipse cx="9" cy="0" rx="10" ry="6" fill="#f39cbd" />
          <circle cx="0" cy="-1" r="4.5" fill="#fdd26e" />
        </g>
      )}
    </svg>
  );
}

/** droplets + two ripple rings, centred on a pad; invisible until a landing plays them */
function Splash() {
  return (
    <span className={styles.splash} aria-hidden>
      <span className={styles.ripple} data-ripple />
      <span className={styles.ripple} data-ripple />
      {DROPS.map(([, , size], k) => (
        <span key={k} className={styles.drop} data-drop style={{ "--d": `${size}px` } as React.CSSProperties} />
      ))}
    </span>
  );
}

function Frog() {
  return (
    <span className={styles.frogBody} data-body>
      <span className={styles.frogBreathe}>
        <FrogArt name="disco" className={styles.frogArt} />
      </span>
    </span>
  );
}

export default function ServicesPage() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const story = useRef<ScrollTrigger | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // one splash: droplets fly out on an arc and fall back, ripples spread and fade
      const splash = (scope: Element, tl: gsap.core.Timeline, at: number, speed = 1) => {
        scope.querySelectorAll("[data-drop]").forEach((d, k) => {
          const [dx, rise] = DROPS[k];
          tl.fromTo(
            d,
            { x: 0, y: 0, scale: 0.4, opacity: 0 },
            {
              keyframes: {
                "0%": { opacity: 1, scale: 1 },
                "45%": { x: dx * 0.6, y: -rise },
                "100%": { x: dx, y: 18, opacity: 0, scale: 0.5 },
              },
              duration: 0.38 * speed,
              ease: "none",
            },
            at,
          );
        });
        tl.fromTo(
          scope.querySelectorAll("[data-ripple]"),
          { scale: 0.3, opacity: 0.9 },
          { scale: 1.7, opacity: 0, duration: 0.4 * speed, stagger: 0.08 * speed, ease: "power1.out" },
          at,
        );
      };

      // ——— shared: prologue, water drift, breathing, epilogue, add-ons ———
      mm.add(`not ${REDUCED_MOTION}`, () => {
        gsap.from("[data-fade]", { y: 24, opacity: 0, duration: 1, stagger: 0.1, ease: EASE.outExpo, delay: 0.2 });
        const waves = gsap.to("[data-wave]", { xPercent: -50, duration: 14, ease: "none", repeat: -1 });
        // every frog on the page breathes, blinks and follows the pointer (desktop) / glances (touch)
        const stopLife = bringToLife(gsap.utils.toArray<HTMLElement>("[data-body]"), {
          followPointer: window.matchMedia("(pointer: fine)").matches,
        });
        pauseWhenOffscreen(stage.current, [waves]);
        // the ending: the frog hops down off the last pad onto a new one, splashes, then says it
        const tail = root.current!.querySelector<HTMLElement>("[data-tail]")!;
        const endPad = tail.querySelector<HTMLElement>("[data-pad]")!;
        const ending = gsap.timeline({ scrollTrigger: { trigger: tail, start: "top 70%" } });
        ending
          .fromTo(
            "[data-end-frog]",
            { x: 260, y: -240, rotate: 12, opacity: 0 },
            {
              keyframes: { "0%": { opacity: 1 }, "50%": { x: 130, y: -300, rotate: 8 }, "100%": { x: 0, y: 0, rotate: 0 } },
              duration: 0.75,
              ease: "none",
            },
          )
          .fromTo("[data-end-frog] [data-body]", { scaleY: 0.8, scaleX: 1.16 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "back.out(3)" })
          .fromTo(endPad, { y: 9 }, { y: 0, duration: 0.6, ease: "back.out(3)" }, "<");
        splash(endPad, ending, 0.75, 1.4);
        ending
          .from("[data-end-bubble]", { scale: 0.5, opacity: 0, y: 30, duration: 0.6, ease: "back.out(1.8)" }, 0.85)
          .from("[data-epilogue] [data-word]", { yPercent: 110, duration: 0.9, stagger: 0.035, ease: EASE.outExpo }, 1)
          .add(() => void talk(tail.querySelector("[data-end-frog] [data-body]")!, 10), 0.95);

        // the little pads bob on the water, out of step with each other
        const bob = gsap.to("[data-bob]", {
          y: -7,
          rotate: (i: number) => (i % 2 ? 2 : -2),
          duration: 1.8,
          ease: "sine.inOut",
          // repeat inside the stagger: each pad loops on its own instead of the whole set
          stagger: { each: 0.35, from: "random", yoyo: true, repeat: -1 },
        });
        pauseWhenOffscreen(tail, [bob]);
        gsap.from("[data-extra]", {
          y: 36,
          opacity: 0,
          duration: 1,
          stagger: 0.08,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: "[data-extras]", start: "top 80%" },
        });
        return () => stopLife();
      });

      // ——— desktop: the frog hops pad to pad on a pinned pond ———
      mm.add(STORY, () => {
        const el = stage.current!;
        const pond = el.querySelector<HTMLElement>("[data-pond]")!;
        const frog = pond.querySelector<HTMLElement>("[data-frog]")!;
        const body = frog.querySelector<HTMLElement>("[data-body]")!;
        const eyes = part(body, "Eyes");
        const mouth = part(body, "Mouth");
        const pads = gsap.utils.toArray<HTMLElement>("[data-pad]", pond);
        const bubbles = gsap.utils.toArray<HTMLElement>("[data-bubble]", pond);
        const fills = gsap.utils.toArray<HTMLElement>("[data-fill]", el);
        const counter = el.querySelector("[data-counter]");
        const N = pads.length;
        const HOLD = 0.35;

        // frog box position (top-left) that puts its feet on pad i
        const at = (i: number) => {
          const p = pads[i].getBoundingClientRect();
          const o = pond.getBoundingClientRect();
          return {
            x: p.left - o.left + p.width / 2 - frog.offsetWidth / 2,
            y: p.top - o.top + p.height * 0.42 - frog.offsetHeight * 0.88,
          };
        };
        const X = (i: number) => () => at(i).x;
        const Y = (i: number) => () => at(i).y;
        const PEAK = (i: number) => () => Math.min(at(i - 1).y, at(i).y) - frog.offsetHeight * 1.1;

        gsap.set(bubbles, { opacity: 0, scale: 0.5, y: 24 });
        gsap.set(bubbles[0], { opacity: 1, scale: 1, y: 0 });
        gsap.set(fills, { scaleX: (i: number) => (i === 0 ? 1 : 0) });

        // only the bubble being said is reachable by keyboard / screen readers
        let current = -1;
        const setActive = (i: number) => {
          if (i === current) return;
          current = i;
          bubbles.forEach((b, k) => (b.inert = k !== i));
          if (counter) counter.textContent = `${pad2(i + 1)} / ${pad2(N)}`;
        };
        setActive(0);

        // the frog drops onto the first pad as the pond scrolls in (inner layer, so it never
        // fights the scrubbed hops on the outer one)
        const intro = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 60%" } });
        intro
          .from(frog.querySelector("[data-drop-in]"), { y: -320, duration: 0.55, ease: "power2.in" })
          .fromTo(body, { scaleY: 0.78, scaleX: 1.16 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "back.out(3)" })
          .fromTo(pads[0], { y: 10 }, { y: 0, duration: 0.6, ease: "back.out(3)" }, "<");
        splash(pads[0], intro, 0.55, 1.6);
        intro.from(bubbles[0].querySelector("[data-pop]"), { scale: 0.4, opacity: 0, y: 20, duration: 0.6, ease: "back.out(2)" }, 0.75);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 1.1 * (N - 1 + HOLD))}`,
            pin: true,
            // the page is a flex column, where ScrollTrigger would skip the spacing by default
            pinSpacing: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            // always settle on the nearest landing (no velocity guess, so a flick never skips a pad)
            snap: { snapTo: "labels", inertia: false, duration: { min: 0.3, max: 0.9 }, delay: 0.1, ease: "power2.inOut" },
            onUpdate: (self) => setActive(Math.min(N - 1, Math.round(self.animation!.time()))),
          },
        });
        tl.set(frog, { x: X(0), y: Y(0) }, 0).addLabel("c0", 0);

        for (let i = 1; i < N; i++) {
          const t = i - 1;
          const air = 0.45;
          const up = t + 0.22;
          const land = up + air;
          tl
            // the frog stops talking…
            .to(bubbles[i - 1], { opacity: 0, scale: 0.7, y: 12, duration: 0.18, ease: "power2.in" }, t)
            // …crouches…
            .to(body, { scaleY: 0.8, scaleX: 1.12, duration: 0.12, ease: "power2.out" }, t + 0.1)
            .to(pads[i - 1], { y: 5, duration: 0.12 }, t + 0.1)
            // …and hops: across, up and down on an arc, stretched and tilted mid-air
            .to(frog, { x: X(i), duration: air }, up)
            .to(frog, { y: PEAK(i), duration: air / 2, ease: "power2.out" }, up)
            .to(frog, { y: Y(i), duration: air / 2, ease: "power2.in" }, up + air / 2)
            .to(body, { scaleY: 1.12, scaleX: 0.9, rotate: 10, duration: air / 2, ease: "power1.out" }, up)
            .to(body, { rotate: -4, duration: air / 2, ease: "power1.in" }, up + air / 2)
            .to(pads[i - 1], { y: 0, duration: 0.3, ease: "back.out(3)" }, up)
            // landing: squash, the pad dips, water splashes…
            .to(body, { scaleY: 0.8, scaleX: 1.16, rotate: 0, duration: 0.06, ease: "power2.out" }, land)
            .to(body, { scaleY: 1, scaleX: 1, duration: 0.2, ease: "back.out(3)" }, land + 0.06)
            .to(pads[i], { y: 9, duration: 0.06, ease: "power2.out" }, land)
            .to(pads[i], { y: 0, duration: 0.3, ease: "back.out(3)" }, land + 0.06);
          splash(pads[i], tl, land);
          tl
            // …and the frog says what this pad is
            .to(bubbles[i], { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "back.out(2)" }, land + 0.1)
            // eyes wide for the jump, then it speaks
            .to(eyes, { scale: 1.12, svgOrigin: "108 52", duration: 0.12, ease: "back.out(3)" }, up)
            .to(eyes, { scale: 1, duration: 0.15, ease: "power2.out" }, land)
            .to(mouth, { scaleY: 1.45, scaleX: 0.92, svgOrigin: "108 100", duration: 0.04, ease: "sine.inOut", yoyo: true, repeat: 5 }, land + 0.12)
            .to(fills[i], { scaleX: 1, duration: 0.6 }, t + 0.2)
            .addLabel(`c${i}`, t + 1);
        }
        tl.to({}, { duration: HOLD }).addLabel("end"); // a beat on the last pad before the page moves on
        story.current = tl.scrollTrigger ?? null;

        return () => {
          bubbles.forEach((b) => (b.inert = false));
          story.current = null;
        };
      });

      // ——— stacked: the frog drops onto each pad as it scrolls in ———
      mm.add(STACK, () => {
        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
          const q = gsap.utils.selector(step);
          const tl = gsap.timeline({ scrollTrigger: { trigger: step, start: "top 70%" } });
          tl.from(q("[data-drop-in]"), { y: -220, opacity: 0, duration: 0.5, ease: "power2.in" })
            .fromTo(q("[data-body]"), { scaleY: 0.78, scaleX: 1.16 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "back.out(3)" })
            .fromTo(q("[data-pad]"), { y: 8 }, { y: 0, duration: 0.6, ease: "back.out(3)" }, "<");
          splash(q("[data-pad]")[0], tl, 0.5, 1.6);
          tl.from(q("[data-pop]"), { scale: 0.5, opacity: 0, y: 24, duration: 0.6, ease: "back.out(2)" }, 0.6).add(
            () => void talk(q("[data-body]")[0]),
            0.75,
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // jump to a pad in the story (desktop) or to its step (stacked)
  const jump = (i: number) => () => {
    const behavior = window.matchMedia(REDUCED_MOTION).matches ? "auto" : "smooth";
    const st = story.current;
    if (st) window.scrollTo({ top: st.labelToScroll(`c${i}`), behavior });
    else document.getElementById(SERVICES[i].slug)?.scrollIntoView({ behavior, block: "center" });
  };

  // a line split into masked words, so it can rise word by word (the space sits outside the
  // mask: trailing white space inside an inline-block is dropped)
  const words = (text: string) =>
    text.split(" ").map((w, k) => (
      <Fragment key={k}>
        <span className={styles.mask}>
          <span data-word>{w}</span>
        </span>{" "}
      </Fragment>
    ));

  // what the frog says on a pad (`where` keeps heading ids unique across the two layouts)
  const bubble = (i: number, where: "pond" | "step") => {
    const s = SERVICES[i];
    const p = projectBySlug(s.example)!;
    return (
      <div className={styles.bubbleInner} data-pop>
        <p className={styles.kicker}>{s.story}</p>
        <h2 id={`${s.slug}-${where}`} className={styles.name}>
          {s.title}
        </h2>
        <p className={styles.summary}>{s.summary}</p>
        <p className={styles.deliverables}>{s.list.flat().slice(0, 3).join("  ·  ")}</p>
        <Link href={p.href} className={styles.see}>
          See it in {p.name} <ArrowRight size={15} strokeWidth={2} aria-hidden />
        </Link>
      </div>
    );
  };

  return (
    <section ref={root} className={styles.page}>
      <SectionHeader eyebrow="Services  /  What we do" title="Services" code={`S.${pad2(SERVICES.length)}`} />

      {/* ——— Prologue ——— */}
      <div className={styles.prologue}>
        <p className={styles.lede} data-fade>
          Every brand we take on goes through the same four chapters. Our frog knows the way.
        </p>
        <p className={styles.hint} data-fade>
          Scroll to follow the frog <ArrowDown size={15} strokeWidth={2} aria-hidden />
        </p>
      </div>

      {/* ——— The pond: pinned story (desktop) ——— */}
      <div ref={stage} className={styles.stage}>
        <div className={styles.stageHead}>
          <p className={styles.count} data-counter>
            01 / {pad2(SERVICES.length)}
          </p>
          <div className={styles.progress}>
            {SERVICES.map((s, i) => (
              <button key={s.slug} type="button" className={styles.bar} onClick={jump(i)} aria-label={`Go to ${s.title}`}>
                <span className={styles.fill} data-fill />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pond} data-pond>
          <div className={styles.water} aria-hidden>
            {[0, 1, 2].map((k) => (
              <svg key={k} className={styles.wave} data-wave viewBox="0 0 1200 20" preserveAspectRatio="none">
                <path d="M0 10 Q 75 0 150 10 T 300 10 T 450 10 T 600 10 T 750 10 T 900 10 T 1050 10 T 1200 10" />
              </svg>
            ))}
          </div>

          {SERVICES.map((s, i) => (
            <div
              key={s.slug}
              className={styles.spot}
              // pads step left → right and alternate low/high; the bubble leans inward so it stays on screen
              style={{ "--x": `${12 + i * 25.3}%`, "--b": i % 2 ? "36%" : "19%", "--sx": i < 2 ? 0.28 : 0.72 } as React.CSSProperties}
            >
              <div className={styles.pad} data-pad>
                <LilyPad flower={i === 2} />
                <Splash />
              </div>
              <div className={styles.bubble} data-bubble role="group" aria-labelledby={`${s.slug}-pond`}>
                {bubble(i, "pond")}
              </div>
            </div>
          ))}

          <div className={styles.frog} data-frog aria-hidden>
            <div data-drop-in>
              <Frog />
            </div>
          </div>
        </div>
      </div>

      {/* ——— The pond: stacked (phones, short screens, reduced motion) ——— */}
      <ol className={styles.steps}>
        {SERVICES.map((s, i) => (
          <li key={s.slug} id={s.slug} className={styles.step} data-step aria-labelledby={`${s.slug}-step`}>
            <div className={styles.bubble}>{bubble(i, "step")}</div>
            <div className={styles.stepPad}>
              <div className={styles.pad} data-pad>
                <LilyPad flower={i === 2} />
                <Splash />
              </div>
              <div className={styles.stepFrog} aria-hidden>
                <div data-drop-in>
                  <Frog />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* ——— The pond carries on: the frog tells the ending, the smaller services float by,
          and the water runs into the CTA below ——— */}
      <div className={styles.tail} data-tail>
        <div className={styles.ending}>
          <div className={styles.endingFrog} aria-hidden>
            <div className={styles.pad} data-pad>
              <LilyPad />
              <Splash />
            </div>
            <div className={styles.endingFrogBody} data-end-frog>
              <Frog />
            </div>
          </div>
          <div className={styles.endingBubble} data-end-bubble>
            <p className={styles.epilogue} data-epilogue>
              {words("That’s the whole story. One team, from first idea to launch day.")}
            </p>
          </div>
        </div>

        <div className={styles.extras} data-extras>
          <div className={styles.extrasHead}>
            <h2 className={styles.h2}>Also in the pond</h2>
            <p className={styles.extrasLede}>Smaller pieces we take on alongside a project, or on their own.</p>
          </div>
          <ul className={styles.lilies}>
            {EXTRAS.map((x, i) => {
              const p = projectBySlug(x.example)!;
              return (
                <li key={x.name} className={styles.lily} data-extra>
                  <div className={styles.lilyPad} data-bob aria-hidden>
                    <LilyPad flower={i === 1} />
                  </div>
                  <h3 className={styles.extraName}>{x.name}</h3>
                  <p className={styles.extraLine}>{x.line}</p>
                  <Link href={p.href} className={styles.extraLink}>
                    <span className={styles.eg}>e.g.</span> {p.name} <ArrowRight size={15} strokeWidth={2} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* the edge of the water, in the CTA's yellow, so the pond runs straight into it */}
        <svg className={styles.shore} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
          <path d="M0 30 Q 120 6 240 30 T 480 30 T 720 30 T 960 30 T 1200 30 T 1440 30 V60 H0 Z" />
        </svg>
      </div>
    </section>
  );
}
