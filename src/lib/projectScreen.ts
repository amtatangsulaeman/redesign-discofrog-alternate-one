/**
 * Draws a mini Discofrog "Selected work" page onto a tall canvas.
 * The MacBook screen shows a 16:10 window of it and scrolls down the page.
 */

export const SCREEN_W = 1280;
export const SCREEN_VIEW_H = 800; // 16:10 viewport
export const SCREEN_H = 2400; // full page height

const C = {
  ink: "#1a1a16",
  paper: "#faf7fc",
  muted: "#8a827e",
  line: "#e4dee6",
  blue: "#006ba6",
  yellow: "#fdd26e",
  white: "#ffffff",
};

const CASES = [
  { name: "JBS Villa", tags: "Brand identity · Website", year: "2025" },
  { name: "Formindo", tags: "Brand identity · Website", year: "2025" },
  { name: "Ragam Collective", tags: "Visual identity", year: "2024" },
  { name: "Lavely", tags: "Branding · Packaging", year: "2024" },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** object-fit: cover into a rounded rect */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  if (img) {
    const s = Math.max(w / img.width, h / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    ctx.fillStyle = C.line;
    ctx.fill();
  }
  ctx.restore();
}

// Lucide "arrow-right" (lucide.dev/icons/arrow-right), 24×24 stroke paths
const LUCIDE_ARROW_RIGHT = ["M5 12h14", "m12 5 7 7-7 7"];

function drawArrowRight(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, stroke = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  LUCIDE_ARROW_RIGHT.forEach((d) => ctx.stroke(new Path2D(d)));
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, dark = true) {
  ctx.font = `500 15px ${font}`;
  const w = ctx.measureText(text).width + 44 + 30;
  roundRect(ctx, x - w, y, w, 44, 22);
  ctx.fillStyle = dark ? C.ink : C.white;
  ctx.fill();
  ctx.fillStyle = dark ? C.white : C.ink;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x - w + 22, y + 22);
  ctx.beginPath();
  ctx.arc(x - 26, y + 22, 12, 0, Math.PI * 2);
  ctx.fillStyle = C.yellow;
  ctx.fill();
  drawArrowRight(ctx, x - 33, y + 15, 14, C.ink, 2.5);
  ctx.textBaseline = "alphabetic";
}

export async function drawProjectScreen(canvas: HTMLCanvasElement, fontFamily: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  if (canvas.width !== SCREEN_W) canvas.width = SCREEN_W;
  if (canvas.height !== SCREEN_H) canvas.height = SCREEN_H;

  const [logo, photo] = await Promise.all([loadImage("/figma/logo.png"), loadImage("/figma/floatImage1.png")]);
  const f = fontFamily;
  const pad = 40;
  const inner = SCREEN_W - pad * 2;

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Nav
  if (logo) ctx.drawImage(logo, pad, 20, 118, 36);
  ctx.font = `500 15px ${f}`;
  ctx.fillStyle = C.ink;
  ["Work", "Studio", "Services", "Contact"].forEach((l, i) => {
    ctx.fillStyle = C.muted;
    ctx.font = `500 10px ${f}`;
    ctx.fillText(`0${i + 1}`, 470 + i * 96, 38);
    ctx.fillStyle = C.ink;
    ctx.font = `500 15px ${f}`;
    ctx.fillText(l, 486 + i * 96, 44);
  });
  pill(ctx, "Let’s talk", SCREEN_W - pad, 16, f);

  // Section header
  ctx.fillStyle = C.muted;
  ctx.font = `500 14px ${f}`;
  ctx.fillText("Explore  01  —  Portfolio", pad, 150);
  ctx.fillStyle = C.ink;
  ctx.font = `500 76px ${f}`;
  ctx.letterSpacing = "-2px";
  ctx.fillText("Selected work", pad - 3, 228);
  ctx.font = `500 150px ${f}`;
  ctx.letterSpacing = "-7px";
  ctx.textAlign = "right";
  ctx.fillText("P.04", SCREEN_W - pad, 234);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";

  // Case grid — 896/440 split of the full site, scaled to this width
  const gap = 24;
  const lgW = Math.round(((inner - gap) * 896) / 1336);
  const smW = inner - gap - lgW;
  const lgH = Math.round((lgW * 600) / 896);
  const smH = Math.round((smW * 520) / 440);
  const offset = 140;

  const caseBlock = (c: (typeof CASES)[number], x: number, y: number, w: number, h: number) => {
    drawCover(ctx, photo, x, y, w, h, 14);
    ctx.fillStyle = C.ink;
    ctx.font = `500 24px ${f}`;
    ctx.fillText(c.name, x, y + h + 40);
    ctx.fillStyle = C.muted;
    ctx.font = `400 14px ${f}`;
    ctx.fillText(c.tags, x, y + h + 64);
    ctx.font = `500 14px ${f}`;
    ctx.textAlign = "right";
    ctx.fillText(c.year, x + w, y + h + 40);
    ctx.textAlign = "left";
  };

  const row1 = 300;
  caseBlock(CASES[0], pad, row1, lgW, lgH);
  caseBlock(CASES[1], pad + lgW + gap, row1 + offset, smW, smH);

  // "View work" tag on the first case, as if hovered
  roundRect(ctx, pad + 20, row1 + lgH - 64, 132, 40, 20);
  ctx.fillStyle = C.yellow;
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.font = `500 14px ${f}`;
  ctx.fillText("View work", pad + 38, row1 + lgH - 39);
  drawArrowRight(ctx, pad + 112, row1 + lgH - 51, 14, C.ink, 2.5);

  const row2 = row1 + Math.max(lgH, smH + offset) + 110;
  const row2Bottom = row2 + Math.max(lgH, smH + offset);
  caseBlock(CASES[2], pad, row2Bottom - offset - smH, smW, smH);
  caseBlock(CASES[3], pad + smW + gap, row2Bottom - lgH, lgW, lgH);

  // See all
  const seeY = row2Bottom + 130;
  ctx.fillStyle = C.line;
  ctx.fillRect(pad, seeY, inner, 1);
  ctx.fillStyle = C.ink;
  ctx.font = `500 96px ${f}`;
  ctx.letterSpacing = "-4px";
  ctx.fillText("See all projects", pad - 3, seeY + 116);
  const seeW = ctx.measureText("See all projects").width;
  ctx.letterSpacing = "0px";
  ctx.fillStyle = C.blue;
  ctx.font = `500 24px ${f}`;
  ctx.fillText("12", pad + seeW + 10, seeY + 54);
  drawArrowRight(ctx, pad + seeW + 50, seeY + 42, 84, C.ink, 1.75);

  // CTA band fills the rest of the page
  const ctaY = seeY + 190;
  ctx.fillStyle = C.yellow;
  ctx.fillRect(0, ctaY, SCREEN_W, SCREEN_H - ctaY);
  ctx.fillStyle = C.ink;
  ctx.font = `500 112px ${f}`;
  ctx.letterSpacing = "-5px";
  ctx.fillText("Ready for a bigger", pad - 4, ctaY + 150);
  ctx.fillText("move? Get in touch", pad - 4, ctaY + 262);
  ctx.letterSpacing = "0px";
  pill(ctx, "Start a project", pad + 190, ctaY + 320, f);
}
