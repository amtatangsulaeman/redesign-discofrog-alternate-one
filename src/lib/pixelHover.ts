/**
 * Pixel trail on hover: cells around the cursor turn into flat "pixels" sampled from the
 * image underneath, then fade back out. Drawn on a 2D canvas laid over the media; the loop
 * only runs while there is something to fade.
 */
type Options = { cell?: number; radius?: number; decay?: number };

export function attachPixelHover(media: HTMLElement, img: HTMLImageElement, opts: Options = {}) {
  const CELL = opts.cell ?? 30; // px per pixel block
  const RADIUS = opts.radius ?? 140; // px of influence around the cursor
  const DECAY = opts.decay ?? 0.945; // per frame (~60fps): trail fades in ~1s

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "1",
  });
  media.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  // tiny offscreen copy of the visible image: one source pixel per cell
  const sample = document.createElement("canvas");
  const sctx = sample.getContext("2d", { willReadFrequently: true })!;

  let cols = 0;
  let rows = 0;
  let heat = new Float32Array(0);
  let colors = new Uint8ClampedArray(0);
  let raf = 0;
  let pointer: { x: number; y: number } | null = null;
  let last: { x: number; y: number } | null = null;

  function resize() {
    const r = media.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    cols = Math.ceil(r.width / CELL);
    rows = Math.ceil(r.height / CELL);
    heat = new Float32Array(cols * rows);
    sample.width = cols;
    sample.height = rows;
  }

  // Re-sample the image as it is currently drawn (object-fit + parallax transform included)
  function sampleImage() {
    const mr = media.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return false;
    // object-fit: cover inside the img's (transformed) box
    const s = Math.max(ir.width / nw, ir.height / nh);
    const dw = nw * s;
    const dh = nh * s;
    const dx = ir.left - mr.left + (ir.width - dw) / 2;
    const dy = ir.top - mr.top + (ir.height - dh) / 2;
    sctx.clearRect(0, 0, cols, rows);
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(img, dx / CELL, dy / CELL, dw / CELL, dh / CELL);
    try {
      colors = sctx.getImageData(0, 0, cols, rows).data;
    } catch {
      return false; // cross-origin image — skip the effect
    }
    return true;
  }

  function paint(x: number, y: number) {
    const c0 = Math.max(0, Math.floor((x - RADIUS) / CELL));
    const c1 = Math.min(cols - 1, Math.floor((x + RADIUS) / CELL));
    const r0 = Math.max(0, Math.floor((y - RADIUS) / CELL));
    const r1 = Math.min(rows - 1, Math.floor((y + RADIUS) / CELL));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const d = Math.hypot(c * CELL + CELL / 2 - x, r * CELL + CELL / 2 - y) / RADIUS;
        if (d >= 1) continue;
        // soft edge + a little noise so the border stays "pixel-ragged"
        const v = (1 - d * d) * (0.75 + Math.random() * 0.25);
        const i = r * cols + c;
        if (v > heat[i]) heat[i] = v;
      }
    }
  }

  function frame() {
    raf = 0;
    if (pointer) {
      // fill the gap between pointer events so fast moves leave a continuous trail
      const from = last ?? pointer;
      const dist = Math.hypot(pointer.x - from.x, pointer.y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (CELL * 1.5)));
      for (let k = 1; k <= steps; k++) {
        paint(from.x + ((pointer.x - from.x) * k) / steps, from.y + ((pointer.y - from.y) * k) / steps);
      }
      last = pointer;
    }
    sampleImage();
    ctx.clearRect(0, 0, cols * CELL, rows * CELL);
    let alive = false;
    for (let i = 0; i < heat.length; i++) {
      const h = heat[i];
      if (h < 0.02) {
        heat[i] = 0;
        continue;
      }
      alive = true;
      const p = i * 4;
      // each block = the average colour of the image under it (true pixelation, no hue shift)
      ctx.fillStyle = `rgba(${colors[p]},${colors[p + 1]},${colors[p + 2]},${Math.min(1, h * 1.8)})`;
      // 1px grid gap; blocks shrink as they fade → crisp grid that dissolves
      const inset = 0.5 + (1 - Math.min(1, h * 1.6)) * CELL * 0.22;
      ctx.fillRect((i % cols) * CELL + inset, Math.floor(i / cols) * CELL + inset, CELL - inset * 2, CELL - inset * 2);
      heat[i] = h * DECAY;
    }
    if (alive || pointer) raf = requestAnimationFrame(frame);
  }

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const local = (e: PointerEvent) => {
    const r = media.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    resize();
    pointer = local(e);
    last = null;
    kick();
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (!cols) resize();
    pointer = local(e);
    kick();
  };
  const onLeave = () => {
    pointer = null;
    last = null;
    kick(); // let the trail fade out
  };

  media.addEventListener("pointerenter", onEnter);
  media.addEventListener("pointermove", onMove);
  media.addEventListener("pointerleave", onLeave);

  return () => {
    cancelAnimationFrame(raf);
    media.removeEventListener("pointerenter", onEnter);
    media.removeEventListener("pointermove", onMove);
    media.removeEventListener("pointerleave", onLeave);
    canvas.remove();
  };
}
