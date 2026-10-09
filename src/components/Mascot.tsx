import { forwardRef } from "react";
import Image from "next/image";
import styles from "./Mascot.module.css";

/**
 * The Discofrog mascot ("Disco" from the Figma component set). The box scales via `--m` (px per design unit),
 * so callers size it the same way as the old layered SVG mascot.
 */
const BOX = 150;

type Props = {
  className?: string;
};

const Mascot = forwardRef<HTMLDivElement, Props>(function Mascot({ className }, ref) {
  const size = `calc(var(--m, var(--u)) * ${BOX})`;
  return (
    <div ref={ref} className={`${styles.mascot} ${className ?? ""}`} style={{ width: size, height: size }}>
      <Image src="/frogs/frog-disco.svg" alt="Discofrog mascot" fill sizes="220px" className={styles.img} />
    </div>
  );
});

export default Mascot;
