"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, useGSAP, EASE, ScrollTrigger } from "@/lib/gsap";
import SectionHeader from "./SectionHeader";
import styles from "./Services.module.css";

const SERVICES = [
  {
    title: "Brand Identity",
    summary: "Strategy, logo and visual systems that make you recognisable.",
    body: "We define what you stand for and who you’re for, then turn it into an identity system — logo, colour, type and guidelines — built to stay consistent as you grow.",
    list: [
      ["Brand strategy", "Naming", "Logo design"],
      ["Visual identity", "Brand guidelines", "Packaging"],
    ],
    mascot: "/frogs/frog-goldie.svg",
  },
  {
    title: "Web Design & Development",
    summary: "Fast, custom websites designed and built in-house.",
    body: "From sitemap and UX to UI and development. We build on modern stacks so your site loads fast, is easy to update and turns visitors into enquiries.",
    list: [
      ["UX & sitemap", "UI design", "Responsive build"],
      ["Next.js / Webflow", "CMS integration", "Care & maintenance"],
    ],
    mascot: "/frogs/frog-byte.svg",
  },
  {
    title: "SEO & Growth",
    summary: "Get found on Google and turn traffic into enquiries.",
    body: "SEO is built into every site from day one, then grown month by month: technical audits, keyword research, on-page optimisation and content that ranks — tracked in clear monthly reports.",
    list: [
      ["Technical SEO audit", "Keyword research", "On-page optimisation"],
      ["Local SEO (Google Business)", "Content strategy", "Analytics & reporting"],
    ],
    mascot: "/frogs/frog-disco.svg",
  },
  {
    title: "Digital Experience",
    summary: "Motion, interaction and campaign pages people remember.",
    body: "Interactive storytelling for launches and campaigns — scroll animation, micro-interactions, 3D and motion graphics that make people stop scrolling and remember you.",
    list: [
      ["Motion design", "Micro-interactions", "3D & WebGL"],
      ["Campaign landing pages", "Social assets", "Launch support"],
    ],
    mascot: "/frogs/frog-hopper.svg",
  },
];

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const { contextSafe } = useGSAP(
    () => {
      // Collins-style page theme: the whole page dims to ink while this section holds the
      // middle of the screen (globals.css animates the colour tokens)
      const html = document.documentElement;
      const setTheme = (dark: boolean) => {
        if (dark) html.dataset.theme = "dark";
        else delete html.dataset.theme;
      };
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 55%",
        end: "bottom 45%",
        refreshPriority: -1, // below the pinned showcase — measure after it
        onToggle: (self) => setTheme(self.isActive),
        onRefresh: (self) => setTheme(self.isActive),
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
      <SectionHeader eyebrow="Explore  02  —  Capabilities" title="What we do" code="S.04" />

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
                    <li key={li}>— {li}</li>
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
