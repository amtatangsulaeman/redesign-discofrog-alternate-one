import styles from "./SectionHeader.module.css";

type Props = {
  eyebrow: string;
  title: string;
  code: string;
};

export default function SectionHeader({ eyebrow, title, code }: Props) {
  return (
    <div className={styles.header} data-reveal="header">
      <div className={styles.left}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>
          <span className={styles.mask}>
            <span data-reveal-line>{title}</span>
          </span>
        </h2>
      </div>
      <p className={styles.code} aria-hidden>
        <span className={styles.mask}>
          <span data-reveal-line>{code}</span>
        </span>
      </p>
    </div>
  );
}
