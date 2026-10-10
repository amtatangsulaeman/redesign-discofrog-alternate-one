/**
 * DOM-driven 2D physics (matter-js), as on wildishandco.co.uk.
 * Every `[data-body]` inside the stage is laid out by CSS first, then measured and
 * turned into a rigid body; the engine moves the real elements, so text stays
 * selectable by assistive tech and links stay links.
 */
import Matter from "matter-js";

const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Sleeping } = Matter;

type Item = { el: HTMLElement; body: Matter.Body; w: number; h: number };
/** The DOM listeners matter-js attaches to the mouse element (not in its typings) */
type MouseHandlers = Record<"mousemove" | "mousedown" | "mouseup" | "mousewheel", EventListener>;

const PHYSICS_PROPS = ["position", "left", "top", "width", "height", "margin", "transform"];

type Options = {
  interactive: boolean;
  /** called after every frame that moved something (e.g. to keep a label on a body) */
  onSync?: () => void;
  /** a hopping body touched down on something below it */
  onLand?: (el: HTMLElement) => void;
};

export function createGravityStage(stage: HTMLElement, { interactive, onSync, onLand }: Options) {
  const engine = Engine.create({ enableSleeping: true, gravity: { x: 0, y: 0 } });
  let items: Item[] = [];
  let walls: Matter.Body[] = [];
  let dropped = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let width = 0;

  const els = () => Array.from(stage.querySelectorAll<HTMLElement>("[data-body]"));

  function build() {
    // remove only our bodies — the mouse constraint stays in the world
    Composite.remove(engine.world, [...items.map((i) => i.body), ...walls]);
    items = [];

    // back to CSS layout so we can measure where everything "wants" to be
    els().forEach((el) => PHYSICS_PROPS.forEach((p) => el.style.removeProperty(p)));
    const sr = stage.getBoundingClientRect();
    // the stage may be scaled (hero exit animation) — measure in its own, unscaled pixels
    const k = stage.offsetWidth / (sr.width || 1);
    width = stage.offsetWidth;
    const rects = els().map((el) => ({ el, r: el.getBoundingClientRect(), radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 }));

    rects.forEach(({ el, r, radius }) => {
      const w = r.width * k;
      const h = r.height * k;
      // hidden / not-yet-laid-out element: no body (a 0-size chamfered body crashes matter-js)
      if (w < 2 || h < 2) return;
      const cx = (r.left - sr.left) * k + w / 2;
      const cy = (r.top - sr.top) * k + h / 2;
      const props = { restitution: 0.18, friction: 0.5, frictionAir: 0.012, density: 0.0016 };
      // a frog (no sticker box) is a round body that always stays upright, like a frog sitting
      const upright = el.dataset.shape === "frog";
      const body = upright
        ? Bodies.circle(cx, cy, Math.min(w, h) * 0.46, { ...props, friction: 0.8, restitution: 0.05 })
        : Bodies.rectangle(cx, cy, w, h, {
            ...props,
            chamfer: { radius: Math.max(0, Math.min(radius, h / 2 - 0.5, w / 2 - 0.5)) },
          });
      if (upright) Body.setInertia(body, Infinity);
      Object.assign(el.style, { position: "absolute", left: "0px", top: "0px", width: `${w}px`, height: `${h}px`, margin: "0" });
      items.push({ el, body, w, h });
    });

    // floor, side walls and a high ceiling so nothing can be thrown out of the hero
    const W = stage.offsetWidth;
    const H = stage.offsetHeight;
    const t = 200;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2, t, H * 6, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2, t, H * 6, { isStatic: true }),
      Bodies.rectangle(W / 2, -H * 2 - t / 2, W * 3, t, { isStatic: true }),
    ];
    Composite.add(engine.world, [...items.map((i) => i.body), ...walls]);
    sync(true);
    onSync?.();
    if (dropped) drop();
  }

  function sync(force = false) {
    items.forEach(({ el, body, w, h }) => {
      if (!force && body.isSleeping) return;
      el.style.transform = `translate3d(${body.position.x - w / 2}px, ${body.position.y - h / 2}px, 0) rotate(${body.angle}rad)`;
    });
  }

  // Fixed 60 Hz physics steps (what matter-js expects); slow frames run a few catch-up steps
  const STEP = 1000 / 60;
  let acc = 0;
  function frame(now: number) {
    raf = 0;
    if (!visible) return;
    acc += Math.min(now - (last || now - STEP), STEP * 4);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      Engine.update(engine, STEP);
      acc -= STEP;
      steps++;
    }
    if (steps) {
      sync();
      onSync?.();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  /** Switch gravity on — everything tumbles into a pile at the bottom of the stage */
  function drop() {
    dropped = true;
    // a little stronger than default: snappier falls and hops (hop power is tuned to it)
    engine.gravity.y = 1.6;
    items.forEach(({ body }) => {
      Sleeping.set(body, false);
      if (body.inertia !== Infinity) Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: Math.random() * 2 });
    });
    start();
  }

  /** Kick every body upward (scroll energy) — strength ≈ px per tick */
  function nudge(strength: number) {
    if (!dropped) return;
    items.forEach(({ body }) => {
      Sleeping.set(body, false);
      Body.setVelocity(body, {
        x: body.velocity.x + (Math.random() - 0.5) * strength * 0.6,
        y: body.velocity.y - strength * (0.5 + Math.random() * 0.7),
      });
      if (body.inertia !== Infinity) Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.08);
    });
    start();
  }

  /**
   * One body hops forward: an up-and-across kick, either way unless it is near an edge (then
   * back towards the middle). Returns the direction (-1 / 1), or 0 if it could not hop.
   * Upright bodies (frogs) report their landing through onLand.
   */
  const airborne = new Set<Matter.Body>();
  function hop(el: HTMLElement, power = 12) {
    const item = items.find((i) => i.el === el);
    if (!item || !dropped || !visible) return 0;
    const { body } = item;
    const x = body.position.x / (width || 1);
    const dir = x < 0.2 ? 1 : x > 0.8 ? -1 : Math.random() < 0.5 ? -1 : 1;
    Sleeping.set(body, false);
    Body.setVelocity(body, { x: dir * (2.2 + Math.random() * 2.2), y: -power });
    if (body.inertia !== Infinity) {
      // a tumbled sticker spins back upright over the jump
      const a = Math.atan2(Math.sin(body.angle), Math.cos(body.angle));
      Body.setAngle(body, a);
      Body.setAngularVelocity(body, -a * 0.035);
    }
    airborne.add(body);
    start();
    return dir;
  }

  // touch-down: a hopping body, on its way down, hits something underneath it
  Events.on(engine, "collisionStart", (e) => {
    for (const { bodyA, bodyB } of e.pairs) {
      for (const [b, other] of [
        [bodyA, bodyB],
        [bodyB, bodyA],
      ]) {
        if (!airborne.has(b) || b.velocity.y < 0.5 || other.position.y < b.position.y) continue;
        airborne.delete(b);
        const item = items.find((i) => i.body === b);
        if (item) onLand?.(item.el);
      }
    }
  });

  /** Where a body is right now, in stage pixels (centre, size, angle) */
  function placeOf(el: HTMLElement) {
    const item = items.find((i) => i.el === el);
    if (!item) return null;
    return { x: item.body.position.x, y: item.body.position.y, w: item.w, h: item.h, angle: item.body.angle, resting: item.body.isSleeping || item.body.speed < 0.3 };
  }

  // ——— Drag (mouse only — touch keeps scrolling the page) ———
  // A press that travelled is a drag, not a click — measured from DOM events because
  // matter-js only reports the end of a drag on its next engine tick
  let downAt = { x: 0, y: 0 };
  const onPointerDown = (e: PointerEvent) => {
    downAt = { x: e.clientX, y: e.clientY };
  };
  const onClickCapture = (e: MouseEvent) => {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) <= 6) return;
    e.preventDefault();
    e.stopPropagation();
  };
  let mouse: Matter.Mouse | null = null;
  let handlers: MouseHandlers | null = null;
  if (interactive) {
    mouse = Mouse.create(stage);
    const h = mouse as unknown as MouseHandlers;
    handlers = h;
    // matter-js calls preventDefault on wheel/touch, which would block page scrolling
    stage.removeEventListener("wheel", h.mousewheel);
    stage.removeEventListener("touchstart", h.mousedown);
    stage.removeEventListener("touchmove", h.mousemove);
    stage.removeEventListener("touchend", h.mouseup);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
    Composite.add(engine.world, mc);
    Events.on(mc, "startdrag", () => {
      stage.dataset.dragging = "true";
      start();
    });
    Events.on(mc, "enddrag", () => delete stage.dataset.dragging);
    stage.addEventListener("pointerdown", onPointerDown, true);
    stage.addEventListener("click", onClickCapture, true);
    stage.addEventListener("mousedown", start);
  }

  // Only simulate while on screen
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && dropped) start();
  });
  io.observe(stage);

  // Re-layout on width changes (rotation, resizing the window)
  const ro = new ResizeObserver(() => {
    // offsetWidth ignores transforms — the hero exit scale must not trigger a rebuild
    if (Math.abs(stage.offsetWidth - width) > 1) build();
  });

  build();
  ro.observe(stage);

  return {
    drop,
    nudge,
    hop,
    placeOf,
    /** true while simulating on screen (after the drop), i.e. when a hop would be seen */
    live: () => dropped && visible && stage.dataset.dragging !== "true",
    width: () => width,
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener("pointerdown", onPointerDown, true);
      stage.removeEventListener("click", onClickCapture, true);
      stage.removeEventListener("mousedown", start);
      if (handlers) {
        stage.removeEventListener("mousemove", handlers.mousemove);
        stage.removeEventListener("mousedown", handlers.mousedown);
        stage.removeEventListener("mouseup", handlers.mouseup);
      }
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      delete stage.dataset.dragging;
      els().forEach((el) => PHYSICS_PROPS.forEach((p) => el.style.removeProperty(p)));
    },
  };
}
