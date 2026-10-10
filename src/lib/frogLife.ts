"use client";

import { gsap } from "./gsap";

/**
 * Small, shared bits of frog behaviour for the inline frog art (FrogArt): breathing, blinking,
 * eyes that follow the pointer or glance around, a talking mouth, eyes that go wide, a happy
 * squint and accessories that bounce. Coordinates are in the 216 × 226 art.
 */
const EYE_LINE = "108 52"; // blinks / squints squash the eyes about this line
const PROPS = ["Beret", "Glasses", "Badge", "Headband"];

export const part = (el: Element, name: string) => el.querySelectorAll(`[data-part="${name}"]`);

type Look = { px: (v: number) => void; py: (v: number) => void; sx: (v: number) => void; sy: (v: number) => void };
const looks = new WeakMap<Element, Look>();
function lookFns(el: Element): Look {
  let l = looks.get(el);
  if (!l) {
    const pupils = [...part(el, "Pupil L"), ...part(el, "Pupil R")];
    const shines = [...part(el, "Shine L"), ...part(el, "Shine R")];
    const q = (t: Element[], p: "x" | "y") => gsap.quickTo(t, p, { duration: 0.35, ease: "power3.out" });
    l = { px: q(pupils, "x"), py: q(pupils, "y"), sx: q(shines, "x"), sy: q(shines, "y") };
    looks.set(el, l);
  }
  return l;
}

/** look in a direction: dx, dy from -1 to 1 (pupils travel up to 7 art units, the shine less) */
export function lookAt(el: Element, dx: number, dy: number) {
  const l = lookFns(el);
  l.px(dx * 7);
  l.py(dy * 6);
  l.sx(dx * 3);
  l.sy(dy * 2.5);
}

/** look at a point on screen */
export function lookToward(el: Element, x: number, y: number) {
  const r = el.getBoundingClientRect();
  const dx = x - (r.left + r.width / 2);
  const dy = y - (r.top + r.height * 0.3);
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 260);
  lookAt(el, (dx / d) * k, (dy / d) * k);
}

/** the mouth opens and closes a few times, cheeks blush */
export function talk(el: Element, beats = 8) {
  return gsap
    .timeline()
    .to(part(el, "Mouth"), { scaleY: 1.45, scaleX: 0.92, svgOrigin: "108 100", duration: 0.11, ease: "sine.inOut", yoyo: true, repeat: beats - 1 })
    .to([...part(el, "Cheek L"), ...part(el, "Cheek R")], { opacity: 1, scale: 1.15, svgOrigin: "108 107", duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 1.4 }, 0);
}

/** eyes wide (surprised, mid-jump) or back to normal */
export function eyesWide(el: Element, wide: boolean) {
  gsap.to(part(el, "Eyes"), { scale: wide ? 1.12 : 1, svgOrigin: EYE_LINE, duration: wide ? 0.15 : 0.25, ease: wide ? "back.out(3)" : "power2.out", overwrite: "auto" });
}

/** a pleased squint, e.g. after a meal */
export function squint(el: Element) {
  return gsap
    .timeline()
    .to(part(el, "Eyes"), { scaleY: 0.45, svgOrigin: EYE_LINE, duration: 0.1, ease: "power2.out" })
    .to(part(el, "Eyes"), { scaleY: 1, duration: 0.25, ease: "power2.out" }, "+=0.35");
}

/** hats, glasses, badges and headbands jolt and wobble back (on landing) */
export function bounceProps(el: Element) {
  PROPS.forEach((p) =>
    gsap.fromTo(part(el, p), { y: -9, rotate: gsap.utils.random(-8, 8) }, { y: 0, rotate: 0, svgOrigin: "108 40", duration: 0.7, ease: "elastic.out(1, 0.35)" }),
  );
}

/**
 * The idle life of some frogs: breathing, blinking (now and then twice), sparkles twinkling,
 * and eyes that follow the pointer (followPointer) or glance around by themselves (glance).
 * Turn off blink / glance for a frog whose eyes are animated elsewhere (they would undo it).
 * Returns a cleanup. Call inside a gsap.matchMedia / context so the loops revert with it.
 */
export function bringToLife(frogs: Element[], { followPointer = false, glance = true, blink: blinks = true } = {}) {
  let alive = true;
  // pending timers; each removes itself when it fires, so the set never grows
  const later = new Set<gsap.core.Tween>();
  const after = (s: number, fn: () => void) => {
    const t = gsap.delayedCall(s, () => {
      later.delete(t);
      if (alive) fn();
    });
    later.add(t);
  };

  frogs.forEach((el) => {
    gsap.to(part(el, "Frog mascot"), {
      scaleY: 1.035,
      scaleX: 0.99,
      svgOrigin: "108 196",
      duration: gsap.utils.random(1.2, 1.8),
      delay: gsap.utils.random(0, 1.5),
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    const sparkles = [...part(el, "Sparkle"), ...part(el, "Sparkle 2")];
    if (sparkles.length) {
      gsap.to(sparkles, {
        scale: 0.55,
        opacity: 0.5,
        transformOrigin: "50% 50%",
        duration: gsap.utils.random(0.6, 1),
        ease: "sine.inOut",
        stagger: { each: 0.4, yoyo: true, repeat: -1 },
      });
    }
    const eyes = part(el, "Eyes");
    const blink = () => {
      const tl = gsap.timeline();
      const times = Math.random() < 0.2 ? 2 : 1;
      for (let k = 0; k < times; k++) {
        tl.to(eyes, { scaleY: 0.08, svgOrigin: EYE_LINE, duration: 0.07, ease: "power2.in" }).to(eyes, { scaleY: 1, duration: 0.11, ease: "power2.out" });
      }
      after(gsap.utils.random(2, 5.5), blink);
    };
    if (blinks) after(gsap.utils.random(0.8, 3), blink);
    if (!followPointer && glance) {
      const look = () => {
        const a = Math.random() * Math.PI * 2;
        const k = Math.random() < 0.3 ? 0 : 1;
        lookAt(el, Math.cos(a) * k, Math.sin(a) * k * 0.8);
        after(gsap.utils.random(1.2, 3), look);
      };
      after(gsap.utils.random(0.5, 2), look);
    }
  });

  const onPointer = (e: PointerEvent) => frogs.forEach((el) => lookToward(el, e.clientX, e.clientY));
  if (followPointer) window.addEventListener("pointermove", onPointer, { passive: true });

  return () => {
    alive = false;
    later.forEach((t) => t.kill());
    window.removeEventListener("pointermove", onPointer);
  };
}
