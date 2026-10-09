"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Tile palette from the Figma "Disco ball → Tiles" layer
const TILE_COLORS = ["#ffffff", "#d9ecff", "#c3c7d2", "#b5bac6", "#f4f0ff", "#e6e8ef", "#fff3d6", "#9aa0ae"];
// Beam colours — reflected in the mirror tiles
const LIGHT_COLORS = ["#fdd26e", "#ff8fb1", "#3b8fd6", "#5bc86a", "#a98bf5"];

/** Builds a small "club" environment so the mirror tiles have colourful things to reflect. */
function createEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color("#7d818e");
  const panel = new THREE.PlaneGeometry(1, 1);
  const add = (color: string, intensity: number, pos: [number, number, number], scale: [number, number]) => {
    const m = new THREE.Mesh(
      panel,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.scale.set(scale[0], scale[1], 1);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  add("#ffffff", 6, [0, 6, 2], [8, 4]);
  add("#ffffff", 3, [-4, 2, 5], [3, 3]);
  LIGHT_COLORS.forEach((c, i) => {
    const a = (i / LIGHT_COLORS.length) * Math.PI * 2;
    add(c, 3, [Math.cos(a) * 6, -1 + (i % 2) * 2, Math.sin(a) * 6], [1.6, 4]);
  });
  add("#c9ccd6", 1.2, [0, -6, 0], [10, 10]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  env.traverse((o) => {
    if (o instanceof THREE.Mesh) (o.material as THREE.Material).dispose();
  });
  panel.dispose();
  return tex;
}

export default function DiscoBall({ className }: { className?: string }) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.environment = createEnvironment(renderer);

    // Sphere of radius 1 exactly filling the square canvas
    const fov = 30;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 20);
    camera.position.set(0, 0, 1 / Math.sin(THREE.MathUtils.degToRad(fov / 2)));

    const ball = new THREE.Group();
    ball.rotation.z = THREE.MathUtils.degToRad(-12);
    scene.add(ball);

    // Dark core shows through the grout between tiles
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.975, 48, 32),
      new THREE.MeshStandardMaterial({ color: "#6d7280", metalness: 0.5, roughness: 0.6 }),
    );
    ball.add(core);

    // Mirror tiles: latitude rings, tile count per ring follows the circumference
    const rings = 18;
    const tileSize = (Math.PI / rings) * 0.86;
    const placements: { lat: number; lon: number }[] = [];
    for (let r = 0; r < rings; r++) {
      const lat = -Math.PI / 2 + ((r + 0.5) / rings) * Math.PI;
      const count = Math.max(4, Math.round(Math.cos(lat) * rings * 2));
      for (let k = 0; k < count; k++) placements.push({ lat, lon: (k / count) * Math.PI * 2 + (r % 2) * 0.1 });
    }

    const tileGeo = new THREE.BoxGeometry(tileSize, tileSize, 0.02);
    const tileMat = new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.18, envMapIntensity: 1.6 });
    const tiles = new THREE.InstancedMesh(tileGeo, tileMat, placements.length);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    placements.forEach(({ lat, lon }, i) => {
      dummy.position.setFromSphericalCoords(1, Math.PI / 2 - lat, lon);
      dummy.lookAt(dummy.position.clone().multiplyScalar(2));
      // Slightly uneven tiles = more glints
      dummy.rotateX((Math.random() - 0.5) * 0.12);
      dummy.rotateY((Math.random() - 0.5) * 0.12);
      dummy.updateMatrix();
      tiles.setMatrixAt(i, dummy.matrix);
      tiles.setColorAt(i, color.set(TILE_COLORS[i % TILE_COLORS.length]));
    });
    ball.add(tiles);

    // Coloured spot lights orbiting the ball → tiles flash beam colours
    const lights = LIGHT_COLORS.map((c) => {
      const l = new THREE.PointLight(c, 6, 8, 1.5);
      scene.add(l);
      return l;
    });
    scene.add(new THREE.AmbientLight("#ffffff", 0.4));

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Pointer spin boost
    let spin = 0;
    const onEnter = () => (spin = 3);
    el.addEventListener("pointerenter", onEnter);

    // Only run the loop while on screen — it fully stops otherwise
    let visible = false;
    let raf = 0;
    const timer = new THREE.Timer();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        timer.update(); // drop the time spent off screen
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(el);

    const tick = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
      timer.update(now);
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = timer.getElapsed();
      spin *= 0.96;
      // Figma: tiles slide 448px per 8s across a 100px ball ≈ one revolution per ~2.3s; slowed for calm
      ball.rotation.y += dt * (reduced ? 0.15 : 0.9 + spin);
      lights.forEach((l, i) => {
        const a = t * 0.8 + (i / lights.length) * Math.PI * 2;
        l.position.set(Math.cos(a) * 2.4, Math.sin(t * 1.3 + i) * 1.2, Math.sin(a) * 2.4 + 1.2);
        l.intensity = 3 + 3 * Math.max(0, Math.sin(t * 4 + i * 1.7));
      });
      renderer.render(scene, camera);
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      tileGeo.dispose();
      tileMat.dispose();
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      scene.environment?.dispose();
      timer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className={className} aria-hidden />;
}
