import { forwardRef } from "react";
import FrogArt from "./FrogArt";
import styles from "./Mascot.module.css";

/**
 * The Discofrog mascot ("Disco" from the Figma component set), drawn inline so its face can move
 * (see frogLife). The box scales via `--m` (px per design unit).
 */
const BOX = 150;

type Props = {
  className?: string;
};

const Mascot = forwardRef<HTMLDivElement, Props>(function Mascot({ className }, ref) {
  const size = `calc(var(--m, var(--u)) * ${BOX})`;
  return (
    <div
      ref={ref}
      className={`${styles.mascot} ${className ?? ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Discofrog mascot"
    >
      <FrogArt name="disco" className={styles.img} />
    </div>
  );
});

export default Mascot;
