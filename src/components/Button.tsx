import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import styles from "./Button.module.css";

/**
 * Pill button after wearecollins.com: 45px tall, 14px text, no border, no colour change on
 * hover — it just swells a little (1.04×) on a long expo ease.
 *   solid — ink pill, the primary action
 *   soft  — faint ink tint on light backgrounds
 *   glass — frosted white over colour or imagery
 * Icons are opt-in and should say what the click does (Mail → opens email, ArrowRight → new
 * page, ArrowDown → scrolls down, ArrowUpRight → leaves the site); no icon when it adds nothing.
 */
type Props = {
  children: React.ReactNode;
  variant?: "solid" | "soft" | "glass";
  /** optional Lucide icon after the label */
  icon?: LucideIcon;
  /** icon before the label instead (e.g. ArrowLeft on "Back") */
  iconFirst?: boolean;
} & (
  | { href: string; external?: boolean; type?: never; onClick?: never }
  /** no href → a real <button> (form submit, step navigation) with the same look */
  | { href?: undefined; external?: never; type?: "button" | "submit"; onClick?: () => void }
);

export default function Button({ href, children, variant = "solid", icon: Icon, iconFirst, external, type, onClick }: Props) {
  const className = `${styles.btn} ${styles[variant]}`;
  const newTab = href !== undefined && /^https?:/.test(href);
  const icon = Icon && <Icon size={15} strokeWidth={2} aria-hidden className={styles.icon} />;
  const content = (
    <>
      {iconFirst && icon}
      <span>{children}</span>
      {!iconFirst && icon}
      {newTab && <span className={styles.srOnly}> (opens in new tab)</span>}
    </>
  );
  if (href === undefined) {
    return (
      <button type={type ?? "button"} className={className} onClick={onClick}>
        {content}
      </button>
    );
  }
  // mailto / external / in-page anchors stay plain links; routes go through next/link
  if (external || href.startsWith("mailto:") || href.startsWith("#") || /^https?:/.test(href)) {
    return (
      <a href={href} className={className} {...(newTab ? { target: "_blank", rel: "noopener" } : {})}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
