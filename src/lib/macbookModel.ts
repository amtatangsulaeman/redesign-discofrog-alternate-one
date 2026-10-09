/**
 * Procedural MacBook Pro 13" (2020-style: Touch Bar, Touch ID, inverted-T arrows).
 * Units are decimetres, origin at the centre of the base's footprint, front = +z.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Real proportions: 30.41 × 21.24 × 1.56 cm
export const W = 3.04;
export const D = 2.12;
export const BASE_H = 0.1;
export const LID_T = 0.05;
export const LID_H = 2.03;
// 13.3" 16:10 panel
export const DISPLAY_W = 2.84;
export const DISPLAY_H = DISPLAY_W / 1.6;
export const DISPLAY_Y = 0.14 + DISPLAY_H / 2; // bottom bezel is taller than the top one
export const OPEN_ANGLE = -0.24; // radians, tilted back
export const CLOSED_ANGLE = Math.PI / 2;
/** Lid hinge position, local to the laptop group */
export const HINGE = new THREE.Vector3(0, BASE_H, -D / 2 + 0.06);

/** Rounded rectangle centred on the origin (optionally as a hole path) */
function roundedRect(w: number, h: number, r: number, path: THREE.Path = new THREE.Shape()) {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

/** Extruded rounded slab with soft edges; occupies z ∈ [0, depth] and exactly w × h */
function slab(w: number, h: number, r: number, depth: number, bevel: number, holes: THREE.Path[] = []) {
  const shape = roundedRect(w - bevel * 2, h - bevel * 2, Math.max(r - bevel, 0.001)) as THREE.Shape;
  shape.holes.push(...holes);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  });
  geo.translate(0, 0, bevel);
  return geo;
}

// ——— Keyboard layout (key widths in "u") ———
type Key = { w: number; label?: string; sub?: string; small?: boolean; align?: "l" | "r"; half?: "up" | "down" };
const ROWS: Key[][] = [
  [
    { w: 1, sub: "~", label: "`" }, { w: 1, sub: "!", label: "1" }, { w: 1, sub: "@", label: "2" },
    { w: 1, sub: "#", label: "3" }, { w: 1, sub: "$", label: "4" }, { w: 1, sub: "%", label: "5" },
    { w: 1, sub: "^", label: "6" }, { w: 1, sub: "&", label: "7" }, { w: 1, sub: "*", label: "8" },
    { w: 1, sub: "(", label: "9" }, { w: 1, sub: ")", label: "0" }, { w: 1, sub: "_", label: "-" },
    { w: 1, sub: "+", label: "=" }, { w: 1.5, label: "delete", small: true, align: "r" },
  ],
  [
    { w: 1.5, label: "tab", small: true, align: "l" },
    ..."QWERTYUIOP".split("").map((c) => ({ w: 1, label: c })),
    { w: 1, sub: "{", label: "[" }, { w: 1, sub: "}", label: "]" }, { w: 1, sub: "|", label: "\\" },
  ],
  [
    { w: 1.75, label: "caps lock", small: true, align: "l" },
    ..."ASDFGHJKL".split("").map((c) => ({ w: 1, label: c })),
    { w: 1, sub: ":", label: ";" }, { w: 1, sub: '"', label: "'" },
    { w: 1.75, label: "return", small: true, align: "r" },
  ],
  [
    { w: 2.25, label: "shift", small: true, align: "l" },
    ..."ZXCVBNM".split("").map((c) => ({ w: 1, label: c })),
    { w: 1, sub: "<", label: "," }, { w: 1, sub: ">", label: "." }, { w: 1, sub: "?", label: "/" },
    { w: 2.25, label: "shift", small: true, align: "r" },
  ],
  [
    { w: 1, label: "fn", small: true, align: "l" }, { w: 1, label: "control", small: true, align: "l" },
    { w: 1, label: "option", small: true, align: "l" }, { w: 1.25, label: "command", small: true, align: "r" },
    { w: 5 }, { w: 1.25, label: "command", small: true, align: "l" },
    { w: 1, label: "option", small: true, align: "l" },
    { w: 1, label: "◀", small: true, half: "down" }, { w: 1, label: "▲", small: true, half: "up" },
    { w: 0, label: "▼", small: true, half: "down" }, { w: 1, label: "▶", small: true, half: "down" },
  ],
];
const ROW_U = 14.5;

type Placed = { x: number; z: number; w: number; d: number; key: Key };

function layoutKeys(u: number, gap: number, top: number) {
  const placed: Placed[] = [];
  const left = -(ROW_U * u) / 2;
  ROWS.forEach((row, r) => {
    let cx = left;
    const zRow = top + r * u + u / 2;
    let lastUp: Placed | null = null;
    row.forEach((key) => {
      const w = key.w * u;
      if (key.half) {
        // inverted-T: ▲/▼ share one column, each half-height
        const d = u / 2 - gap / 2;
        if (key.w === 0 && lastUp) {
          placed.push({ x: lastUp.x, z: zRow + u / 4, w: lastUp.w, d: d - gap / 2, key });
          return;
        }
        const z = key.half === "up" ? zRow - u / 4 : zRow + u / 4;
        const p = { x: cx + w / 2, z, w: w - gap, d: d - gap / 2, key };
        placed.push(p);
        if (key.half === "up") lastUp = p;
        cx += w;
        return;
      }
      placed.push({ x: cx + w / 2, z: zRow, w: w - gap, d: u - gap, key });
      cx += w;
    });
  });
  return placed;
}

/** White key legends + Touch Bar, drawn once to a transparent canvas over the keyboard */
function legendTexture(
  placed: Placed[],
  kw: number,
  kd: number,
  originZ: number,
  touchBar: { x: number; z: number; w: number; d: number },
) {
  const px = 2048 / kw;
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = Math.round(kd * px);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const draw = () => {
    drawLegends(c, px, kw, originZ, placed, touchBar);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);
  return tex;
}

function drawLegends(
  c: HTMLCanvasElement,
  px: number,
  kw: number,
  originZ: number,
  placed: Placed[],
  touchBar: { x: number; z: number; w: number; d: number },
) {
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  const font = getComputedStyle(document.body).fontFamily || "system-ui";
  const toX = (x: number) => (x + kw / 2) * px;
  const toY = (z: number) => (z - originZ) * px;
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.textBaseline = "middle";

  placed.forEach(({ x, z, w, d, key }) => {
    if (!key.label && !key.sub) return;
    const cx = toX(x);
    const cy = toY(z);
    const kwPx = w * px;
    const kdPx = d * px;
    if (key.small) {
      g.font = `500 ${Math.round(kdPx * (key.half ? 0.42 : 0.2))}px ${font}`;
      if (key.half || !key.align) {
        g.textAlign = "center";
        g.fillText(key.label!, cx, cy);
      } else {
        g.textAlign = key.align === "l" ? "left" : "right";
        const pad = kwPx * 0.12;
        g.fillText(key.label!, key.align === "l" ? cx - kwPx / 2 + pad : cx + kwPx / 2 - pad, cy + kdPx * 0.28);
      }
    } else if (key.sub) {
      g.textAlign = "center";
      g.font = `500 ${Math.round(kdPx * 0.24)}px ${font}`;
      g.fillText(key.sub, cx, cy - kdPx * 0.2);
      g.fillText(key.label!, cx, cy + kdPx * 0.2);
    } else {
      g.textAlign = "center";
      g.font = `500 ${Math.round(kdPx * 0.34)}px ${font}`;
      g.fillText(key.label!, cx, cy);
    }
  });

  // Touch Bar: glossy strip with a few dim controls
  const tx = toX(touchBar.x - touchBar.w / 2);
  const ty = toY(touchBar.z - touchBar.d / 2);
  const tw = touchBar.w * px;
  const th = touchBar.d * px;
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = `500 ${Math.round(th * 0.34)}px ${font}`;
  g.textAlign = "left";
  g.fillText("esc", tx + th * 0.5, ty + th / 2);
  g.textAlign = "center";
  ["‹", "☼", "◫", "◑", "◁", "▷", "◂", "▸"].forEach((ch, i, all) => {
    g.fillText(ch, tx + tw * (0.42 + (i / (all.length - 1)) * 0.52), ty + th / 2);
  });
}

export function buildMacbook(screenTex: THREE.Texture, logoTex: THREE.Texture) {
  const aluminium = new THREE.MeshStandardMaterial({ color: "#cfd1d6", metalness: 1, roughness: 0.34 });
  const brushed = new THREE.MeshStandardMaterial({ color: "#b4b6bb", metalness: 1, roughness: 0.28 });
  const keycap = new THREE.MeshStandardMaterial({ color: "#0b0b0c", metalness: 0.25, roughness: 0.42 });
  const well = new THREE.MeshStandardMaterial({ color: "#2b2c30", metalness: 0.4, roughness: 0.55 });
  const black = new THREE.MeshStandardMaterial({ color: "#0a0a0b", roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: "#050506", metalness: 0.3, roughness: 0.06, envMapIntensity: 0.5 });
  const display = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, color: "#000000" });

  const laptop = new THREE.Group();

  // ——— Base ———
  const u = (W * 0.86) / ROW_U; // key pitch
  const gap = u * 0.1;
  const kbTop = -D / 2 + 0.2; // back edge of the keyboard well
  const tbD = u * 0.62; // Touch Bar row depth
  const kbW = ROW_U * u + u * 0.18;
  const kbD = tbD + 5 * u + u * 0.3;
  const kbCenterZ = kbTop + kbD / 2;

  // Keyboard sits in a cut-out of the top case
  const wellHole = roundedRect(kbW, kbD, u * 0.18, new THREE.Path());
  // after the rotation below world z = −shape y, so offset the hole by −kbCenterZ
  const holePath = new THREE.Path(wellHole.getPoints(12).map((p) => new THREE.Vector2(p.x, p.y - kbCenterZ)));
  const baseGeo = slab(W, D, 0.16, BASE_H, 0.018, [holePath]);
  baseGeo.rotateX(-Math.PI / 2); // extrusion z → up (+y); shape y → −z
  const base = new THREE.Mesh(baseGeo, aluminium);
  laptop.add(base);

  const recess = 0.012;
  const wellMesh = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(kbW, kbD, u * 0.18) as THREE.Shape), well);
  wellMesh.rotation.x = -Math.PI / 2;
  wellMesh.position.set(0, BASE_H - recess, kbCenterZ);
  laptop.add(wellMesh);

  // Keys — one InstancedMesh per key size so rounded corners don't stretch
  const rowsTop = kbTop + u * 0.15 + tbD;
  const placed = layoutKeys(u, gap, rowsTop);
  const keyH = 0.009;
  const bySize = new Map<string, Placed[]>();
  placed.forEach((p) => {
    const id = `${p.w.toFixed(4)}x${p.d.toFixed(4)}`;
    bySize.set(id, [...(bySize.get(id) ?? []), p]);
  });
  const m = new THREE.Matrix4();
  bySize.forEach((keys) => {
    const geo = new RoundedBoxGeometry(keys[0].w, keyH, keys[0].d, 2, Math.min(keys[0].d, keys[0].w) * 0.14);
    const mesh = new THREE.InstancedMesh(geo, keycap, keys.length);
    keys.forEach((k, i) => mesh.setMatrixAt(i, m.makeTranslation(k.x, BASE_H - recess + keyH / 2 + 0.001, k.z)));
    laptop.add(mesh);
  });

  // Touch Bar + Touch ID
  const tbZ = kbTop + u * 0.12 + tbD / 2;
  const touchId = { w: u * 0.95, d: tbD - gap };
  const touchBar = { x: -touchId.w / 2 - gap / 2, z: tbZ, w: ROW_U * u - touchId.w - gap * 2, d: tbD - gap };
  const tb = new THREE.Mesh(new RoundedBoxGeometry(touchBar.w, keyH, touchBar.d, 2, touchBar.d * 0.2), glass);
  tb.position.set(touchBar.x, BASE_H - recess + keyH / 2 + 0.001, tbZ);
  laptop.add(tb);
  const tid = new THREE.Mesh(new RoundedBoxGeometry(touchId.w, keyH, touchId.d, 2, touchId.d * 0.2), black);
  tid.position.set((ROW_U * u) / 2 - touchId.w / 2, BASE_H - recess + keyH / 2 + 0.001, tbZ);
  laptop.add(tid);

  // Legends
  const legendW = ROW_U * u;
  const legendD = kbD - u * 0.3;
  const legendOrigin = kbTop + u * 0.1;
  const legends = new THREE.Mesh(
    new THREE.PlaneGeometry(legendW, legendD),
    new THREE.MeshBasicMaterial({
      map: legendTexture(placed, legendW, legendD, legendOrigin, touchBar),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  legends.rotation.x = -Math.PI / 2;
  legends.position.set(0, BASE_H - recess + keyH + 0.0016, legendOrigin + legendD / 2);
  laptop.add(legends);

  // Trackpad — wide Force Touch glass
  const padW = W * 0.45;
  const padD = 0.78;
  const padZ = kbTop + kbD + 0.07 + padD / 2;
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(padW, padD, 0.05) as THREE.Shape, 12), brushed);
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, BASE_H + 0.0012, padZ);
  laptop.add(pad);
  const padEdge = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(padW + 0.012, padD + 0.012, 0.056) as THREE.Shape, 12),
    new THREE.MeshStandardMaterial({ color: "#8e9095", metalness: 1, roughness: 0.4 }),
  );
  padEdge.rotation.x = -Math.PI / 2;
  padEdge.position.set(0, BASE_H + 0.0006, padZ);
  laptop.add(padEdge);

  // Thumb notch: polished half-moon scooped out of the front edge
  const notchShape = new THREE.Shape();
  notchShape.moveTo(-0.21, 0);
  notchShape.quadraticCurveTo(0, 0.07, 0.21, 0);
  notchShape.lineTo(-0.21, 0);
  const notch = new THREE.Mesh(
    new THREE.ShapeGeometry(notchShape, 16),
    new THREE.MeshStandardMaterial({ color: "#eceef1", metalness: 1, roughness: 0.18 }),
  );
  notch.rotation.x = -Math.PI / 2;
  notch.position.set(0, BASE_H + 0.0009, D / 2 - 0.004);
  laptop.add(notch);

  // Ports on the right side: 2× USB-C + headphone jack
  [-0.62, -0.42].forEach((z) => {
    const port = new THREE.Mesh(new RoundedBoxGeometry(0.01, 0.028, 0.09, 2, 0.004), black);
    port.position.set(W / 2 - 0.002, BASE_H * 0.48, z);
    laptop.add(port);
  });
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 16), black);
  jack.rotation.z = Math.PI / 2;
  jack.position.set(W / 2 - 0.002, BASE_H * 0.5, 0.55);
  laptop.add(jack);

  // Hinge: dark barrel between base and lid
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, W * 0.84, 24), black);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.copy(HINGE).add(new THREE.Vector3(0, -0.01, -0.01));
  laptop.add(hinge);

  // ——— Lid ———
  const lid = new THREE.Group();
  lid.position.copy(HINGE);
  laptop.add(lid);

  const shellGeo = slab(W, LID_H, 0.14, LID_T, 0.012);
  shellGeo.translate(0, LID_H / 2, -LID_T); // front face at z = 0, bottom edge on the hinge
  lid.add(new THREE.Mesh(shellGeo, aluminium));

  // Edge-to-edge black glass, a thin aluminium rim left around it
  const glassMesh = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(W - 0.035, LID_H - 0.035, 0.125) as THREE.Shape, 16), glass);
  glassMesh.position.set(0, LID_H / 2, 0.0012);
  lid.add(glassMesh);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(DISPLAY_W, DISPLAY_H), display);
  screen.position.set(0, DISPLAY_Y, 0.0024);
  lid.add(screen);

  // FaceTime camera
  const cam = new THREE.Mesh(new THREE.CircleGeometry(0.009, 16), new THREE.MeshBasicMaterial({ color: "#1d1f26" }));
  cam.position.set(0, DISPLAY_Y + DISPLAY_H / 2 + 0.045, 0.0026);
  lid.add(cam);

  // Discofrog logo on the back of the lid, upright for someone looking at the closed laptop from the front
  const logoAspect = 151 / 46;
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.86 / logoAspect),
    new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, metalness: 0.6, roughness: 0.3 }),
  );
  logo.rotation.set(0, Math.PI, Math.PI);
  logo.position.set(0, LID_H / 2, -LID_T - 0.001);
  lid.add(logo);

  return { laptop, lid, display, glass };
}
