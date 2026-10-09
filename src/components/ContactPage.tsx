"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Phone } from "lucide-react";
import { gsap, useGSAP, EASE, REDUCED_MOTION } from "@/lib/gsap";
import { ABOUT } from "@/lib/about";
import SectionHeader from "./SectionHeader";
import Button from "./Button";
import styles from "./ContactPage.module.css";

/**
 * /contact — after discofrogstudio.com's "Let's collaborate" panel (name · email · project ·
 * "prefer to talk now?"), reworked as a full page in this site's style: a sticky info column,
 * and a short three-step form (easy chip questions first, contact details last) so it never
 * feels like a long brief.
 *
 * There is no mail backend yet: submitting composes a ready-to-send email in the visitor's
 * mail app (the button says so). Swap `send()` for a POST to an API route when one exists.
 */
const NEEDS = ["Brand identity", "Website", "SEO & growth", "Motion & 3D", "Company profile", "Something else"];
const WHEN = ["As soon as possible", "In 1–3 months", "Later this year", "Just exploring"];
const MAX = 1000;

const STEPS = [
  { label: "Your needs", title: "What can we help with?", sub: "Pick anything that fits — takes about two minutes in total." },
  { label: "The project", title: "Tell us a little more", sub: "A few lines is plenty. We’ll ask the rest on a call." },
  { label: "Your details", title: "Where should we reply?", sub: "We reply within one business day." },
] as const;

type Key = "name" | "email" | "details";
type Errors = Partial<Record<Key, string>>;
/** which step each required field lives on */
const STEP_OF: Record<Key, number> = { details: 1, name: 2, email: 2 };

function validate(f: { name: string; email: string; details: string }): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please tell us your name.";
  if (!f.email.trim()) e.email = "We need an email to reply to.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "That email doesn’t look right — check for typos.";
  if (f.details.trim().length < 20) e.details = "A sentence or two helps us prepare — at least 20 characters.";
  return e;
}

export default function ContactPage() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const dir = useRef(1);
  const moved = useRef(false);
  const id = useId();
  const [form, setForm] = useState({ name: "", email: "", company: "", details: "" });
  const [needs, setNeeds] = useState<string[]>([]);
  const [when, setWhen] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);

  const errors = validate(form);
  // Empty required fields are only flagged after trying to continue; while filling in, a field is
  // checked on blur only once something was typed (no scolding for tabbing past a field).
  const show = (k: Key) => (tried[STEP_OF[k]] || (touched[k] && form[k].trim() !== "")) && errors[k];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION}`, () => {
        gsap.from("[data-fade]", { y: 28, opacity: 0, duration: 1, stagger: 0.08, ease: EASE.outExpo, delay: 0.2 });
        gsap.from("[data-frog]", { yPercent: 40, rotate: -12, opacity: 0, duration: 1, ease: "back.out(1.8)", delay: 0.6 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // step change: slide the new panel in from the side we're heading to, move focus to its heading,
  // and bring the card back into view if the visitor had scrolled past its top (long steps on mobile)
  useGSAP(
    () => {
      if (!moved.current) return;
      heading.current?.focus({ preventScroll: true });
      const top = card.current?.getBoundingClientRect().top ?? 0;
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 88;
      if (top < navH) window.scrollBy({ top: top - navH - 16, behavior: "smooth" });
      if (window.matchMedia(REDUCED_MOTION).matches) return;
      gsap.fromTo(
        "[data-step]",
        { x: dir.current * 32, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: EASE.outExpo, clearProps: "transform,opacity" },
      );
    },
    { scope: root, dependencies: [step, sent] },
  );

  const goTo = (n: number) => {
    dir.current = n >= step ? 1 : -1;
    moved.current = true;
    setStep(n);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: k === "details" ? e.target.value.slice(0, MAX) : e.target.value }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const toggleNeed = (n: string) => setNeeds((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  const send = () => {
    const subject = `New project — ${form.company.trim() || form.name.trim()}`;
    const meta = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      form.company.trim() && `Brand / company: ${form.company.trim()}`,
      needs.length > 0 && `Looking for: ${needs.join(", ")}`,
      when && `Timing: ${when}`,
    ].filter(Boolean);
    // details set apart by a blank line so the email reads naturally
    const body = [...meta, "", form.details.trim()].join("\n");
    // a real link click hands off to the mail app without unloading the page
    const link = document.createElement("a");
    link.href = `mailto:${ABOUT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    link.click();
  };

  // one submit handler for every step: Enter in a field = Continue
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried((t) => ({ ...t, [step]: true }));
    const first = (["details", "name", "email"] as const).find((k) => STEP_OF[k] === step && errors[k]);
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }
    send();
    moved.current = false;
    setSent(true);
    requestAnimationFrame(() => done.current?.focus());
  };

  const field = (k: "name" | "email" | "company", label: string, opts: { type?: string; auto?: string; optional?: boolean; ph: string }) => {
    const err = k !== "company" && show(k);
    return (
      <div className={styles.field}>
        <label htmlFor={`${id}-${k}`} className={styles.label}>
          {label} {opts.optional && <span className={styles.opt}>Optional</span>}
        </label>
        <input
          id={`${id}-${k}`}
          type={opts.type ?? "text"}
          autoComplete={opts.auto}
          className={styles.input}
          value={form[k]}
          placeholder={opts.ph}
          onChange={set(k)}
          onBlur={blur(k)}
          required={!opts.optional}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-${k}-err` : undefined}
        />
        {err && (
          <p id={`${id}-${k}-err`} className={styles.error} role="alert">
            {err}
          </p>
        )}
      </div>
    );
  };

  const s = STEPS[step];

  return (
    <section ref={root} className={styles.page}>
      <SectionHeader eyebrow="Contact  —  Jakarta & Melbourne" title="Let’s talk" code="Hi." />

      <div className={styles.layout}>
        {/* ——— Info column ——— */}
        <aside className={styles.info}>
          <p className={styles.statement} data-fade>
            Tell us where you are and where you want to go. We’ll come back with ideas — and honest advice on what it
            takes.
          </p>
          <p className={styles.promise} data-fade>
            <Check size={16} strokeWidth={2.5} aria-hidden /> We reply within one business day.
          </p>

          <div className={styles.quick} data-fade>
            <p className={styles.small}>Prefer to talk now?</p>
            <div className={styles.quickRow}>
              <Button href={ABOUT.whatsapp} icon={MessageCircle}>
                Chat on WhatsApp
              </Button>
              <Button href={`mailto:${ABOUT.email}?subject=${encodeURIComponent("Intro call")}`} variant="soft" icon={Phone}>
                Book a call
              </Button>
            </div>
            <a href={`mailto:${ABOUT.email}`} className={styles.mailLink}>
              <Mail size={16} strokeWidth={2} aria-hidden /> {ABOUT.email}
            </a>
          </div>

          <div className={styles.offices} data-fade>
            {ABOUT.offices.map((o) => (
              <address key={o.city}>
                <span className={styles.small}>{o.city}</span>
                {o.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </address>
            ))}
          </div>

          <div className={styles.frog} data-frog aria-hidden>
            <Image src="/frogs/frog-byte.svg" alt="" width={216} height={226} />
          </div>
        </aside>

        {/* ——— Stepper / thank-you ——— */}
        <div ref={card} className={styles.card} data-fade>
          {sent ? (
            <div ref={done} className={styles.done} tabIndex={-1} aria-live="polite">
              <Image src="/frogs/frog-hopper.svg" alt="" width={140} height={146} className={styles.doneFrog} />
              <h2 className={styles.doneTitle}>Thanks, {form.name.trim().split(" ")[0]}!</h2>
              <p className={styles.doneText}>
                Your email app should have opened with everything filled in — just press send. We’ll reply to{" "}
                <strong>{form.email.trim()}</strong> within one business day.
              </p>
              <p className={styles.doneText}>
                Nothing opened? Email us at <a href={`mailto:${ABOUT.email}`}>{ABOUT.email}</a> or message us on{" "}
                <a href={ABOUT.whatsapp} target="_blank" rel="noopener">
                  WhatsApp
                </a>
                .
              </p>
              <div className={styles.doneRow}>
                <Button href="/work" variant="soft" icon={ArrowRight}>
                  Browse our work meanwhile
                </Button>
                <button type="button" className={styles.textBtn} onClick={() => setSent(false)}>
                  Edit my message
                </button>
              </div>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              {/* progress — finished steps can be revisited */}
              <ol className={styles.progress} aria-label="Form progress">
                {STEPS.map((p, i) => (
                  <li key={p.label} className={i < step ? styles.past : i === step ? styles.now : undefined}>
                    <span className={styles.bar} aria-hidden />
                    {i < step ? (
                      <button type="button" className={styles.stepLink} onClick={() => goTo(i)}>
                        <Check size={13} strokeWidth={2.5} aria-hidden /> {p.label}
                        <span className={styles.sr}> — completed, edit</span>
                      </button>
                    ) : (
                      <span className={styles.stepName} aria-current={i === step ? "step" : undefined}>
                        {p.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <div className={styles.panel} data-step key={step}>
                <div className={styles.formHead}>
                  <p className={styles.count}>
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h2 ref={heading} className={styles.formTitle} tabIndex={-1}>
                    {s.title}
                  </h2>
                  <p className={styles.formSub}>{s.sub}</p>
                </div>

                {step === 0 && (
                  <>
                    <fieldset className={styles.fieldset}>
                      <legend className={styles.label}>
                        Services <span className={styles.opt}>Pick any</span>
                      </legend>
                      <div className={styles.chips}>
                        {NEEDS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={needs.includes(n)}
                            className={`${styles.chip} ${needs.includes(n) ? styles.on : ""}`}
                            onClick={() => toggleNeed(n)}
                          >
                            {needs.includes(n) && <Check size={14} strokeWidth={2.5} aria-hidden />}
                            {n}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className={styles.fieldset}>
                      <legend className={styles.label}>
                        When do you want to start? <span className={styles.opt}>Optional</span>
                      </legend>
                      <div className={styles.chips} role="radiogroup">
                        {WHEN.map((w) => (
                          <button
                            key={w}
                            type="button"
                            role="radio"
                            aria-checked={when === w}
                            className={`${styles.chip} ${when === w ? styles.on : ""}`}
                            onClick={() => setWhen(when === w ? null : w)}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className={styles.field}>
                      <label htmlFor={`${id}-details`} className={styles.label}>
                        About the project
                      </label>
                      <p id={`${id}-details-hint`} className={styles.hint}>
                        What you’re working on, what isn’t working today, and what success would look like.
                      </p>
                      <textarea
                        id={`${id}-details`}
                        className={`${styles.input} ${styles.textarea}`}
                        value={form.details}
                        onChange={set("details")}
                        onBlur={blur("details")}
                        rows={6}
                        required
                        placeholder="e.g. We’re opening three new stores and our brand feels dated…"
                        aria-invalid={show("details") ? true : undefined}
                        aria-describedby={`${id}-details-hint ${id}-details-count${show("details") ? ` ${id}-details-err` : ""}`}
                      />
                      <div className={styles.under}>
                        {show("details") ? (
                          <p id={`${id}-details-err`} className={styles.error} role="alert">
                            {errors.details}
                          </p>
                        ) : (
                          <span />
                        )}
                        <span id={`${id}-details-count`} className={styles.count}>
                          {form.details.length} / {MAX}
                        </span>
                      </div>
                    </div>
                    {field("company", "Brand or company", { auto: "organization", optional: true, ph: "Company name or website" })}
                  </>
                )}

                {step === 2 && (
                  <>
                    {field("name", "Your name", { auto: "name", ph: "Jane Doe" })}
                    {field("email", "Email", { type: "email", auto: "email", ph: "jane@company.com" })}
                  </>
                )}
              </div>

              <div className={styles.submitRow}>
                {step > 0 && (
                  <Button variant="soft" icon={ArrowLeft} iconFirst onClick={() => goTo(step - 1)}>
                    Back
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button type="submit" icon={ArrowRight}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" icon={Mail}>
                    Send via email
                  </Button>
                )}
                {step === STEPS.length - 1 && (
                  <p className={styles.fine}>Opens your email app with your message ready to send.</p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
