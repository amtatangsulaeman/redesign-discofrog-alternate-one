"use client";

import { gsap, useGSAP, EASE, REDUCED_MOTION } from "@/lib/gsap";

/** Slides every SectionHeader line up from its mask as it scrolls into view. */
export default function RevealHeaders() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`not ${REDUCED_MOTION}`, () => {
      gsap.utils.toArray<HTMLElement>('[data-reveal="header"]').forEach((header) => {
        gsap.from(header.querySelectorAll("[data-reveal-line]"), {
          yPercent: 105,
          duration: 1.2,
          stagger: 0.12,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: header, start: "top 85%" },
        });
      });
    });
    return () => mm.revert();
  });

  return null;
}
