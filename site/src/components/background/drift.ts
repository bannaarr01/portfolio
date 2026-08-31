/**
 * LAYER 3 — the drift field. The only client JavaScript this component ships.
 *
 * Design rules this file exists to honour:
 *
 *   - One `requestAnimationFrame` loop drives every mote in every field.
 *   - Each frame computes *all* positions, then writes *all* transforms.
 *     No interleaved read/write, so no layout thrash.
 *   - Nothing but `transform` is ever written. Never `left`/`top`.
 *   - Anchors are derived arithmetically from numbers the server already put
 *     in the DOM, so an individual mote is never measured — not once, not on
 *     resize. The single `getBoundingClientRect()` per field is on the host.
 *   - Under `prefers-reduced-motion: reduce`, nothing below `build()` runs at
 *     all: no observers, no listeners, no loop. The motes keep the static pose
 *     the server rendered.
 */

/** Anchor inset from the field edge. Mirrors the `clamp()` in DriftLayer.astro. */
const EDGE = 0.04;
/** Steering starts well outside the quiet ellipse, so motes rarely reach it. */
const QUIET_OUTER = 1.38;
/** Steering authority, rad/s, scaled by each mote's own speed. */
const CENTRE_TURN = 1.15;
/** How hard a head-on approach is deflected sideways rather than shoved back. */
const SWIRL = 1.6;
const POINTER_R = 150;
const POINTER_TURN = 2.6;
/** Clamped so a backgrounded tab or a stall cannot teleport the field. */
const MAX_DT = 0.05;
const RESIZE_MS = 150;

interface Mote {
  el: HTMLElement;
  /** Anchor in quiet-zone multiples (wide) and width fractions (band mode). */
  ux: number;
  uy: number;
  hx: number;
  /** Velocity px/s, and the constant speed the steering preserves. */
  vx: number;
  vy: number;
  sp: number;
  rot: number;
  vr: number;
  /** Collision radius: the half-*diagonal*, since motes rotate. */
  r: number;
  /** Resolved anchor, px, relative to the field box. */
  ax: number;
  ay: number;
  /** Live position, px, relative to the field box. */
  x: number;
  y: number;
}

interface Field {
  host: HTMLElement;
  motes: Mote[];
  /** bp, rxPct, rxMin, ryPct, ryMin, bandRx — from `data-q`. */
  q: number[];
  w: number;
  h: number;
  /** Quiet-zone centre in px, resolved from `--focus-x` / `--focus-y`. */
  cx: number;
  cy: number;
  qx: number;
  qy: number;
  band: boolean;
  left: number;
  top: number;
  on: boolean;
}

const fields: Field[] = [];
let raf = 0;
let last = 0;
let built = false;
let paused = false;

let pointerOn = false;
let pointerX = 0;
let pointerY = 0;
let originDirty = false;

const clamp = (lo: number, v: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
/** Index safely, so this file typechecks under `noUncheckedIndexedAccess`. */
const at = (a: number[], i: number) => a[i] || 0;
const nums = (s: string | undefined) => (s || '').split(',').map(Number);
/** A `<percentage>` custom property, defaulting to dead centre. */
const pct = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 50;
};

/**
 * Resolve field bounds and every anchor. Called once at build and then only
 * on a debounced resize — the arithmetic below is a deliberate copy of the
 * `clamp()` expressions in DriftLayer.astro, which is what lets the layer
 * paint correctly before this script has even parsed.
 */
function measure(f: Field, first: boolean) {
  const rect = f.host.getBoundingClientRect();
  const pw = f.w;
  const ph = f.h;
  f.w = rect.width;
  f.h = rect.height;
  f.left = rect.left;
  f.top = rect.top;

  f.band = f.w <= at(f.q, 0);
  f.qx = f.band ? f.w * at(f.q, 5) : Math.max((f.w * at(f.q, 1)) / 100, at(f.q, 2));
  f.qy = Math.max((f.h * at(f.q, 3)) / 100, at(f.q, 4));

  // The quiet zone protects whatever the consumer centres its content on,
  // which is not always the middle of the field. Read here rather than baked
  // into `data-q` so a consumer stylesheet or media query can move it.
  const cs = getComputedStyle(f.host);
  f.cx = f.w * (pct(cs.getPropertyValue('--focus-x')) / 100);
  f.cy = f.h * (pct(cs.getPropertyValue('--focus-y')) / 100);

  // Hand the resolved radii back to CSS in plain pixels. The mask cannot use
  // `--qx` directly because it holds a `max()`, and Chromium rejects a math
  // function as a radial-gradient radius. Two writes per measure, never in the
  // loop, and it keeps `data-q` the single source of truth for both.
  f.host.style.setProperty('--qx-px', f.qx + 'px');
  f.host.style.setProperty('--qy-px', f.qy + 'px');

  for (const m of f.motes) {
    m.ax = f.band ? m.hx * f.w : clamp(EDGE * f.w, f.cx + m.ux * f.qx, (1 - EDGE) * f.w);
    m.ay = clamp(EDGE * f.h, f.cy + m.uy * f.qy, (1 - EDGE) * f.h);

    if (first) {
      m.x = m.ax;
      m.y = m.ay;
    } else {
      // Keep motes where they were, proportionally, across a resize.
      if (pw) m.x *= f.w / pw;
      if (ph) m.y *= f.h / ph;
    }

    m.x = clamp(m.r, m.x, f.w - m.r);
    m.y = clamp(m.r, m.y, f.h - m.r);
  }
}

/** Force accumulator for the mote currently being stepped. Module-scoped so
 *  `push()` costs no allocation. */
let fx = 0;
let fy = 0;

/**
 * Accumulate a repulsion from a source, given the outward unit vector
 * (`ux`, `uy`) and a strength `k`.
 *
 * The tangential term is the reason this works. A purely radial force cannot
 * turn a mote aimed *exactly* at the source: the push is anti-parallel to the
 * velocity, so it only shortens the vector, and the speed re-normalisation
 * immediately undoes that — the mote sails straight through. So the more
 * head-on the approach, the more the force is rotated into the perpendicular,
 * chosen to match the way the mote is already leaning. Glancing approaches are
 * pushed out; head-on ones are curved around.
 */
function push(m: Mote, ux: number, uy: number, k: number) {
  const swirl = Math.max(0, -(m.vx * ux + m.vy * uy) / m.sp);
  let tx = -uy;
  let ty = ux;
  if (m.vx * tx + m.vy * ty < 0) {
    tx = -tx;
    ty = -ty;
  }
  const radial = 1 - swirl;
  fx += (ux * radial + tx * swirl * SWIRL) * k;
  fy += (uy * radial + ty * swirl * SWIRL) * k;
}

function step(f: Field, dt: number) {
  const cx = f.cx;
  const cy = f.cy;
  const px = pointerX - f.left;
  const py = pointerY - f.top;

  for (const m of f.motes) {
    fx = 0;
    fy = 0;

    // The quiet zone around the headline. A steering field rather than a wall:
    // trajectories curve around the H1 instead of bouncing off nothing.
    const nx = (m.x - cx) / f.qx;
    const ny = (m.y - cy) / f.qy;
    const nd = Math.hypot(nx, ny);
    if (nd < QUIET_OUTER) {
      const inv = 1 / (nd || 1e-3);
      push(m, nx * inv, ny * inv, ((QUIET_OUTER - nd) / QUIET_OUTER) * m.sp * CENTRE_TURN);
    }

    // The cursor parts the field. Same maths, shorter radius, eased falloff.
    if (pointerOn) {
      const dx = m.x - px;
      const dy = m.y - py;
      const pd = Math.hypot(dx, dy);
      if (pd < POINTER_R) {
        const k = 1 - pd / POINTER_R;
        const inv = 1 / (pd || 1e-3);
        push(m, dx * inv, dy * inv, k * k * m.sp * POINTER_TURN);
      }
    }

    if (fx || fy) {
      // Steering only — nudge the heading, then restore the mote's own speed.
      // Acceleration can never accumulate, so the field cannot run away.
      const vx = m.vx + fx * dt;
      const vy = m.vy + fy * dt;
      const s = Math.hypot(vx, vy) || 1e-3;
      m.vx = (vx / s) * m.sp;
      m.vy = (vy / s) * m.sp;
    }

    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.rot = (m.rot + m.vr * dt) % 360;

    // Hard backstop on the quiet ellipse. The steering above is what actually
    // shapes the motion; this only guarantees the invariant the design depends
    // on — no mote is ever inside the ellipse, which is exactly the region the
    // mask renders at zero alpha. So "an icon never overlaps the headline" is
    // structural rather than tuned, and a correction here can never be seen.
    const bx = (m.x - cx) / f.qx;
    const by = (m.y - cy) / f.qy;
    const bd = Math.hypot(bx, by);
    if (bd < 1) {
      const s = 1 / (bd || 1e-3);
      m.x = cx + (bx || 1e-3) * s * f.qx;
      m.y = cy + by * s * f.qy;
    }

    const r = m.r;
    if (m.x < r) {
      m.x = r;
      m.vx = Math.abs(m.vx);
    } else if (m.x > f.w - r) {
      m.x = f.w - r;
      m.vx = -Math.abs(m.vx);
    }
    if (m.y < r) {
      m.y = r;
      m.vy = Math.abs(m.vy);
    } else if (m.y > f.h - r) {
      m.y = f.h - r;
      m.vy = -Math.abs(m.vy);
    }
  }
}

function draw(f: Field) {
  for (const m of f.motes) {
    m.el.style.transform =
      'translate3d(' +
      (m.x - m.ax).toFixed(1) +
      'px,' +
      (m.y - m.ay).toFixed(1) +
      'px,0) rotate(' +
      m.rot.toFixed(1) +
      'deg)';
  }
}

function tick(ts: number) {
  raf = requestAnimationFrame(tick);

  const dt = last ? Math.min((ts - last) / 1000, MAX_DT) : 0;
  last = ts;

  // The only DOM read in the loop, and only after a scroll or resize has
  // invalidated the host's viewport origin. Reads happen before any write.
  if (originDirty) {
    originDirty = false;
    for (const f of fields) {
      const rect = f.host.getBoundingClientRect();
      f.left = rect.left;
      f.top = rect.top;
    }
  }

  if (!dt) return;
  for (const f of fields) if (f.on) step(f, dt);
  for (const f of fields) if (f.on) draw(f);
}

function sync() {
  const want = !paused && !document.hidden && fields.some((f) => f.on);
  if (want && !raf) {
    last = 0;
    raf = requestAnimationFrame(tick);
  } else if (!want && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

function build(hosts: NodeListOf<HTMLElement>) {
  built = true;

  hosts.forEach((host) => {
    const motes: Mote[] = [];
    host.querySelectorAll<HTMLElement>('[data-m]').forEach((el) => {
      const p = nums(el.dataset.m);
      const vx = at(p, 3);
      const vy = at(p, 4);
      motes.push({
        el,
        ux: at(p, 0),
        uy: at(p, 1),
        hx: at(p, 2),
        vx,
        vy,
        sp: Math.hypot(vx, vy) || 1,
        vr: at(p, 5),
        rot: at(p, 6),
        // Half-diagonal, not half-width: a rotating square sweeps a box up to
        // √2 wider than itself, and bouncing on the half-width lets a corner
        // hang outside the field.
        r: (at(p, 7) * Math.SQRT2) / 2,
        ax: 0,
        ay: 0,
        x: 0,
        y: 0,
      });
    });

    const f: Field = {
      host,
      motes,
      q: nums(host.dataset.q),
      w: 0,
      h: 0,
      cx: 0,
      cy: 0,
      qx: 1,
      qy: 1,
      band: false,
      left: 0,
      top: 0,
      on: false,
    };
    fields.push(f);
    measure(f, true);
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const f = fields.find((c) => c.host === e.target);
        if (f) f.on = e.isIntersecting;
      }
      sync();
    },
    { rootMargin: '120px' }
  );
  for (const f of fields) io.observe(f.host);

  document.addEventListener('visibilitychange', sync);

  let rt: ReturnType<typeof setTimeout> | undefined;
  addEventListener(
    'resize',
    () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        for (const f of fields) measure(f, false);
      }, RESIZE_MS);
    },
    { passive: true }
  );

  // Pointer repulsion, on precise pointers only.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener(
      'pointermove',
      (e) => {
        pointerX = e.clientX;
        pointerY = e.clientY;
        pointerOn = true;
      },
      { passive: true }
    );
    const drop = () => {
      pointerOn = false;
    };
    document.addEventListener('pointerleave', drop);
    addEventListener('blur', drop);
    addEventListener('scroll', () => (originDirty = true), { passive: true });
  }
}

export function initDrift(): void {
  const hosts = document.querySelectorAll<HTMLElement>('[data-drift]');
  if (!hosts.length) return;

  const rm = matchMedia('(prefers-reduced-motion: reduce)');

  const apply = () => {
    paused = rm.matches;
    // Guarded at initialisation: under reduced motion `build()` never runs,
    // so the loop is never started rather than started and cancelled.
    if (!paused && !built) build(hosts);
    for (const f of fields) f.host.toggleAttribute('data-frozen', paused);
    sync();
  };

  rm.addEventListener('change', apply);
  apply();
}
