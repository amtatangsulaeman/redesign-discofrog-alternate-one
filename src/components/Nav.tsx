"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { gsap, useGSAP, EASE, ScrollTrigger } from "@/lib/gsap";
import styles from "./Nav.module.css";

/** Nav modelled on clou.ch: logo · frosted link pill · round menu button → full-screen menu */
const LINKS = [
  { label: "Work", href: "/work", section: "#work" },
  { label: "About us", href: "/about", section: "#studio" },
  { label: "Services", href: "/#services", section: "#services" },
  { label: "Contact", href: "/contact", section: "#contact" },
];

/** `current`: section the page belongs to (e.g. "#work" on /work pages); home leaves it unset
 *  and follows the section in view. Passed as a prop — reading the URL here would make every
 *  prerendered route dynamic under cacheComponents. */
export default function Nav({ current }: { current?: string } = {}) {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [sectionInView, setActive] = useState<string | null>(null);
  const active = current ?? sectionInView;
  const [onDark, setOnDark] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // Highlight the link of the section currently in view
  useEffect(() => {
    const sections = LINKS.map((l) => document.querySelector(l.section)).filter(Boolean) as Element[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = `#${e.target.id}`;
          setActive((prev) => (e.isIntersecting ? id : prev === id ? null : prev));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Full-screen menu: circle wipe out of the menu button, then the big links rise in
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);

      // Wordmark turns white while it sits over a [data-nav-theme="dark"] section
      const overDark = new Set<Element>();
      // document-wide on purpose: selector strings inside useGSAP are scoped to the header
      document.querySelectorAll<HTMLElement>('[data-nav-theme="dark"]').forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 56px",
          end: "bottom 56px",
          refreshPriority: -1, // these sections sit below the pinned showcase — measure after it
          onToggle: (self) => {
            if (self.isActive) overDark.add(section);
            else overDark.delete(section);
            setOnDark(overDark.size > 0);
          },
        });
      });

      tl.current = gsap
        .timeline({ paused: true })
        .set(q("[data-overlay]"), { visibility: "visible" })
        // clip-path reads --wipe; the circle's centre sits on the menu button (set in CSS)
        .fromTo(q("[data-overlay]"), { "--wipe": "0%" }, { "--wipe": "150%", duration: 0.8, ease: "power3.inOut" })
        .from(q("[data-item-text]"), { yPercent: 110, duration: 0.9, stagger: 0.07, ease: EASE.outExpo }, 0.35)
        .from(q("[data-item-line]"), { scaleX: 0, duration: 0.9, stagger: 0.07, ease: EASE.outExpo }, 0.35)
        .from(q("[data-overlay-foot]"), { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" }, 0.6);
    },
    { scope: root },
  );

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (open) t.timeScale(1).play();
    else t.timeScale(1.6).reverse();
    // lock page scroll behind the menu
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header ref={root} className={`${styles.nav} ${open ? styles.isOpen : ""} ${onDark ? styles.onDark : ""}`}>
      <Link href="/" className={styles.logo} aria-label="Discofrog — home" onClick={() => setOpen(false)}>
        <Image src="/figma/logo.png" alt="Discofrog" width={151} height={46} className={styles.logoMark} priority />
      </Link>

      <nav className={styles.panel} aria-label="Primary">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.link} ${active === l.section ? styles.active : ""}`}
            aria-current={active === l.section ? "true" : undefined}
          >
            <span className={styles.dot} aria-hidden />
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>

      <button
        className={styles.menuButton}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <Menu className={styles.iconMenu} size={20} strokeWidth={2} aria-hidden />
        <X className={styles.iconClose} size={20} strokeWidth={2} aria-hidden />
      </button>

      <div id="site-menu" className={styles.overlay} data-overlay aria-hidden={!open} inert={!open}>
        <ul className={styles.items}>
          {LINKS.map((l) => (
            <li key={l.href} className={styles.item}>
              <span className={styles.itemLine} data-item-line />
              <Link href={l.href} className={styles.itemLink} onClick={() => setOpen(false)}>
                <span className={styles.itemFill} aria-hidden />
                <span className={styles.itemMask}>
                  <span className={styles.itemText} data-item-text>
                    {l.label}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.overlayFoot} data-overlay-foot>
          <p>
            Discofrog Studio
            <br />
            Jakarta — Melbourne
          </p>
          <p>
            <a href="mailto:discofrogstudio@gmail.com">discofrogstudio@gmail.com</a>
            <br />
            <a href="#">WhatsApp</a>
          </p>
          <p>
            <a href="#">Instagram</a>
            <br />
            <a href="#">LinkedIn</a>
          </p>
        </div>
      </div>
    </header>
  );
}
