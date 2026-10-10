"use client";

import { useRef } from "react";
import Image from "next/image";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ArrowDown } from "lucide-react";
import { gsap, useGSAP, REDUCED_MOTION } from "@/lib/gsap";
import { drawProjectScreen, SCREEN_H, SCREEN_VIEW_H, SCREEN_W } from "@/lib/projectScreen";
import { buildMacbook, CLOSED_ANGLE, D, DISPLAY_H, DISPLAY_W, DISPLAY_Y, OPEN_ANGLE, W } from "@/lib/macbookModel";
import styles from "./MacbookShowcase.module.css";

const FOV = 32;

/**
 * Stickers carried over from the hero so the two sections feel like one scene.
 * x/y = centre in % of the stage, r = resting rotation, s = size multiplier.
 */
const STICKERS = [
  { src: "/figma/floatImage1.png", bg: "#e9e2d6", x: 12, y: 36, r: -10, s: 1, photo: true },
  { src: "/frogs/frog-goldie.svg", bg: "#fdefc4", x: 21, y: 76, r: 8, s: 0.9 },
  { src: "/frogs/frog-byte.svg", bg: "#d8ebf6", x: 87, y: 32, r: 9, s: 0.95 },
  { src: "/frogs/frog-disco.svg", bg: "#dff2e2", x: 80, y: 77, r: -12, s: 0.78 },
  { src: "/frogs/frog-groove.svg", bg: "#ffe1ea", x: 94, y: 57, r: -6, s: 0.68 },
];

/**
 * Showreel played on the laptop screen (H.264, no audio, 30fps, cover-fitted).
 * Phones get a 540p copy — the screen is small there. If the file is missing,
 * the screen falls back to the drawn projects page.
 * Uncompressed source: video-source/showreel-original.mp4
 */
const SCREEN_VIDEO = { desktop: "/video/showreel.mp4", mobile: "/video/showreel-mobile.mp4" };

/** Soft contact shadow under the laptop */
function buildShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(26,26,22,0.38)");
  grad.addColorStop(1, "rgba(26,26,22,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.6, D * 1.7),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.001;
  return mesh;
}

export default function MacbookShowcase() {
  const root = useRef<HTMLElement>(null);
  const mount = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = mount.current;
      if (!el) return;

      // Scroll-driven state; the render loop reads from it
      const s = { lid: CLOSED_ANGLE, open: 0, zoom: 0, scroll: 0, power: 0, mx: 0, my: 0 };

      // Hi-dpi screens already look smooth; skip MSAA there (it's the most expensive part)
      const renderer = new THREE.WebGLRenderer({
        antialias: window.devicePixelRatio < 1.5,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      scene.environment = pmrem.fromScene(room, 0.04).texture;
      pmrem.dispose();
      room.dispose();

      const key = new THREE.DirectionalLight("#ffffff", 1.4);
      key.position.set(3, 6, 4);
      const keyIntensity = key.intensity;
      scene.add(key);

      // Screen texture — the Discofrog projects page
      const screenCanvas = document.createElement("canvas");
      // size up-front: WebGL texture storage is immutable once uploaded
      screenCanvas.width = SCREEN_W;
      screenCanvas.height = SCREEN_H;
      const screenTex = new THREE.CanvasTexture(screenCanvas);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      screenTex.repeat.set(1, SCREEN_VIEW_H / SCREEN_H);
      const font = getComputedStyle(document.body).fontFamily;
      document.fonts.ready
        .then(() => drawProjectScreen(screenCanvas, font))
        .then(() => {
          screenTex.needsUpdate = true;
          requestRender();
        })
        .catch((err) => console.error("[MacbookShowcase] screen texture failed", err));

      const logoTex = new THREE.TextureLoader().load("/figma/logo.png", () => requestRender());
      logoTex.colorSpace = THREE.SRGBColorSpace;

      const { laptop, lid, display, glass } = buildMacbook(screenTex, logoTex);
      // envMapIntensity is ignored for materials lit only by scene.environment — give the glass its own env map
      glass.envMap = scene.environment;
      const glassShine = glass.envMapIntensity;
      scene.add(laptop);
      scene.add(buildShadow());

      // Screen video — replaces the projects page as soon as it can play
      const reduced = window.matchMedia(REDUCED_MOTION).matches;
      const video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "auto";
      let videoTex: THREE.VideoTexture | null = null;
      let playing = false;

      // Video frames only reach the GPU when we render, so render once per decoded frame
      const pump = () => {
        if (!playing) return;
        requestRender();
        if ("requestVideoFrameCallback" in video) video.requestVideoFrameCallback(pump);
        else requestAnimationFrame(pump);
      };
      // Play only while the stage is visible and the screen is switched on
      const wantsPlay = () => !!videoTex && visible && s.power > 0.5 && !reduced;
      const startPlayback = () => {
        video
          .play()
          .then(pump)
          // blocked (autoplay policy, power saver, an extension…) → retry on the next user gesture
          .catch(() => {
            playing = false;
            const retry = () => syncVideo();
            window.addEventListener("pointerdown", retry, { once: true });
            window.addEventListener("keydown", retry, { once: true });
            window.addEventListener("wheel", retry, { once: true, passive: true });
          });
      };
      const syncVideo = () => {
        const shouldPlay = wantsPlay();
        if (shouldPlay === playing) return;
        playing = shouldPlay;
        if (playing) startPlayback();
        else video.pause();
      };
      // Belt and braces for looping: some browsers / download-manager extensions ignore `loop`
      // or pause the element from outside — restart it whenever it should still be playing
      const onEnded = () => {
        video.currentTime = 0;
        if (wantsPlay()) startPlayback();
      };
      const onExternalPause = () => {
        if (playing && wantsPlay() && !document.hidden) startPlayback();
      };
      video.addEventListener("ended", onEnded);
      video.addEventListener("pause", onExternalPause);
      const onVisibility = () => {
        if (!document.hidden && playing && video.paused) startPlayback();
      };
      document.addEventListener("visibilitychange", onVisibility);

      video.addEventListener(
        "loadeddata",
        () => {
          videoTex = new THREE.VideoTexture(video);
          videoTex.colorSpace = THREE.SRGBColorSpace;
          // object-fit: cover onto the 16:10 display
          const va = video.videoWidth / video.videoHeight;
          const sa = DISPLAY_W / DISPLAY_H;
          if (va > sa) videoTex.repeat.set(sa / va, 1);
          else videoTex.repeat.set(1, va / sa);
          videoTex.offset.set((1 - videoTex.repeat.x) / 2, (1 - videoTex.repeat.y) / 2);
          display.map = videoTex;
          display.needsUpdate = true;
          syncVideo();
          requestRender();
        },
        { once: true },
      );
      // missing file → stays on the projects page
      video.src = window.matchMedia("(max-width: 800px)").matches ? SCREEN_VIDEO.mobile : SCREEN_VIDEO.desktop;

      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
      const target = new THREE.Vector3();

      // Camera keyframes: closed (high, looking down) → open (front) → zoomed into the display
      const camClosed = new THREE.Vector3(0, 6.2, 4.2);
      const lookClosed = new THREE.Vector3(0, 0, 0.1);
      // open: three-quarter view from the front-left, like a product shot
      const camOpen = new THREE.Vector3(-3.3, 2.6, 5.4);
      const lookOpen = new THREE.Vector3(-0.3, 0.75, -0.1);
      const camZoom = new THREE.Vector3();
      const lookZoom = new THREE.Vector3();

      const fitZoom = () => {
        // Display centre + normal in world space at the open angle
        const centre = new THREE.Vector3(0, DISPLAY_Y, 0.0024)
          .applyAxisAngle(new THREE.Vector3(1, 0, 0), OPEN_ANGLE)
          .add(lid.position);
        const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(1, 0, 0), OPEN_ANGLE);
        const vHalf = THREE.MathUtils.degToRad(FOV / 2);
        const distH = DISPLAY_H / 2 / Math.tan(vHalf);
        const distW = DISPLAY_W / 2 / (Math.tan(vHalf) * camera.aspect);
        // Cover the viewport with the display: the tighter fit wins, minus a hair so the bezel
        // edge never peeks in on any aspect ratio
        const dist = Math.min(distH, distW) * 0.985;
        lookZoom.copy(centre);
        camZoom.copy(centre).addScaledVector(normal, dist);
      };

      // Pull back on narrow screens so the whole laptop fits
      const fitScale = () => Math.max(1, 1.45 / camera.aspect);

      const tmp = new THREE.Vector3();


      // Render on demand: at most once per frame, and only while the stage is on screen
      let visible = false;
      let queued = 0;
      function requestRender() {
        if (!visible || queued) return;
        queued = requestAnimationFrame(() => {
          queued = 0;
          render();
        });
      }
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        syncVideo();
        requestRender();
      });
      io.observe(el);

      function render() {
        lid.rotation.x = s.lid;
        display.color.setScalar(s.power);
        // Glossy glass sells the product shot from afar; up close it only mirrors the studio's ceiling lights
        glass.envMapIntensity = glassShine * Math.max(0, 1 - s.zoom * 1.15);
        // on glossy glass even a dim key light leaves a sharp hotspot, so it fades out completely up close
        key.intensity = keyIntensity * Math.max(0, 1 - s.zoom * 1.15);
        screenTex.offset.y = (1 - screenTex.repeat.y) * (1 - s.scroll);

        const back = fitScale();
        tmp.copy(camClosed).multiplyScalar(back);
        camera.position.copy(tmp).lerp(tmp.copy(camOpen).multiplyScalar(back), s.open);
        target.copy(lookClosed).lerp(lookOpen, s.open);
        camera.position.lerp(camZoom, s.zoom);
        target.lerp(lookZoom, s.zoom);

        // gentle pointer parallax, fades out once we're inside the screen
        const sway = 1 - s.zoom;
        laptop.rotation.y = s.mx * 0.12 * sway;
        laptop.rotation.x = s.my * 0.05 * sway;

        camera.lookAt(target);
        renderer.render(scene, camera);
      }

      const resize = () => {
        const { width, height } = el.getBoundingClientRect();
        // Cap the drawing buffer to ~2.2 MP — a full-screen canvas at 2x DPR is 4x the work
        const budget = Math.sqrt(2_200_000 / Math.max(width * height, 1));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75, Math.max(1, budget)));
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        fitZoom();
        requestRender();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // Pointer parallax — one reusable tween per axis instead of a new tween per event
      const swayX = gsap.quickTo(s, "mx", { duration: 1.2, ease: "power3.out", onUpdate: requestRender });
      const swayY = gsap.quickTo(s, "my", { duration: 1.2, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        if (!visible) return;
        swayX(e.clientX / window.innerWidth - 0.5);
        swayY(e.clientY / window.innerHeight - 0.5);
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(`not ${REDUCED_MOTION}`, () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: () => {
            syncVideo();
            requestRender();
          },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=320%",
            pin: q("[data-stage]")[0],
            pinSpacing: true,
            scrub: 1,
          },
        });

        // Arriving from the hero: stickers and title tiles tumble in, the laptop rises
        const enter = { trigger: root.current, start: "top bottom", end: "top top", scrub: true };
        gsap.from(q("[data-sticker-in]"), {
          y: () => window.innerHeight * 0.45,
          rotate: (i) => [-30, 24, 36, -28, 18][i % 5],
          scale: 0.6,
          opacity: 0,
          ease: "power2.out",
          stagger: 0.04,
          scrollTrigger: enter,
        });
        gsap.from(q("[data-title-in]"), {
          y: 140,
          rotate: (i) => (i ? 10 : -12),
          opacity: 0,
          ease: "power2.out",
          stagger: 0.06,
          scrollTrigger: enter,
        });
        gsap.from(mount.current, { yPercent: 14, scale: 0.92, ease: "power2.out", scrollTrigger: enter });

        // Lid opening flings the stickers out to the edges
        q("[data-sticker]").forEach((el, i) => {
          const left = STICKERS[i].x < 50;
          tl.to(
            el,
            {
              x: () => (left ? -1 : 1) * window.innerWidth * 0.32,
              y: () => (STICKERS[i].y < 55 ? -1 : 1) * window.innerHeight * 0.22,
              rotate: (left ? -1 : 1) * 40,
              scale: 0.7,
              opacity: 0,
              duration: 0.26,
              ease: "power2.in",
            },
            0.02 + i * 0.015,
          );
        });

        tl.to(q("[data-intro]"), { opacity: 0, y: -60, duration: 0.18 }, 0)
          // lid opens + camera swings to the front
          .to(s, { lid: OPEN_ANGLE, duration: 0.4, ease: "power2.inOut" }, 0.02)
          .to(s, { open: 1, duration: 0.4, ease: "power2.inOut" }, 0.02)
          // screen wakes up
          .to(s, { power: 1, duration: 0.14, ease: "power1.out" }, 0.26)
          // dive into the display
          .to(s, { zoom: 1, duration: 0.2, ease: "power2.inOut" }, 0.44)
          .to(q("[data-caption]"), { opacity: 1, y: 0, duration: 0.08 }, 0.6)
          // scroll the projects page
          .to(s, { scroll: 1, duration: 0.34, ease: "power1.inOut" }, 0.64)
          .to(q("[data-caption]"), { opacity: 0, duration: 0.06 }, 0.94);
      });

      mm.add(REDUCED_MOTION, () => {
        // Static: open laptop, screen on
        Object.assign(s, { lid: OPEN_ANGLE, open: 1, power: 1 });
        requestRender();
      });

      return () => {
        mm.revert();
        playing = false;
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("pause", onExternalPause);
        document.removeEventListener("visibilitychange", onVisibility);
        video.pause();
        video.removeAttribute("src");
        video.load();
        screenTex.dispose(); // the display may be showing the video texture instead
        cancelAnimationFrame(queued);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((mat: THREE.Material & { map?: THREE.Texture | null }) => {
              mat.map?.dispose();
              mat.dispose();
            });
          }
        });
        scene.environment?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    },
    { scope: root },
  );

  return (
    <section id="showcase" ref={root} className={styles.showcase} aria-label="Discofrog projects on a laptop">
      <div className={styles.stage} data-stage>
        <div ref={mount} className={styles.canvas} aria-hidden />

        <div className={styles.stickers} aria-hidden>
          {STICKERS.map((st) => (
            <div
              key={st.src}
              className={styles.sticker}
              data-sticker
              style={{ left: `${st.x}%`, top: `${st.y}%`, "--s": st.s } as React.CSSProperties}
            >
              {/* layers: fly-out (GSAP) › tumble-in (GSAP) › resting tilt (CSS) */}
              <div className={styles.stickerIn} data-sticker-in>
                <div className={styles.stickerTilt} style={{ background: st.bg, transform: `rotate(${st.r}deg)` }}>
                  <Image
                    src={st.src}
                    alt=""
                    fill
                    sizes="160px"
                    className={st.photo ? styles.stickerPhoto : styles.stickerArt}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.intro} data-intro>
          <p className={styles.eyebrow}>(Scroll to open the studio laptop)</p>
          <h2 className={styles.title} aria-label="Our work, opened up.">
            <span data-title-in aria-hidden>
              <span className={`${styles.tile} ${styles.tileYellow}`}>Our work,</span>
            </span>
            <span data-title-in aria-hidden>
              <span className={`${styles.tile} ${styles.tileInk}`}>opened up.</span>
            </span>
          </h2>
        </div>

        <p className={styles.caption} data-caption>
          Selected work · 2024/2025 <ArrowDown size={14} strokeWidth={2.25} aria-hidden />
        </p>
      </div>
    </section>
  );
}
