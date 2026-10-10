import { useId } from "react";
import { withIds, type FrogName } from "@/lib/frogArt";

/**
 * A frog drawn inline (not an <img>) so its parts can move: eyes blink and follow, the mouth
 * talks, accessories bounce. Decorative — the hero gives meaning elsewhere.
 */
export default function FrogArt({ name, className }: { name: FrogName; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <span className={className} aria-hidden dangerouslySetInnerHTML={{ __html: withIds(name, uid) }} />;
}
