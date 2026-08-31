/**
 * Build-time seeding for the drift layer (LAYER 3).
 *
 * Everything here runs in Astro frontmatter and is inlined into the emitted
 * HTML. None of it reaches the browser, so it costs zero client bytes.
 *
 * Positions are emitted as *unitless multiples of the quiet-zone radii*
 * rather than as fixed percentages. That single decision buys three things:
 *
 *   1. First paint is already correct with no JavaScript at all.
 *   2. The layout adapts to any viewport, because the quiet zone itself is
 *      `max(<pct>, <px>)` and the anchor is derived from it in plain CSS.
 *   3. `drift.ts` reproduces the exact same anchor arithmetic from the same
 *      numbers, so JS never has to measure an individual element.
 */

import type { IconName } from '../../types/icons';

/**
 * The quiet zone is the ellipse around the hero headline that icons are
 * placed outside of, steered away from, and masked out inside of. Its radii
 * are `max(<pct> of the field, <min> px)` so a narrow phone viewport still
 * gets a zone wide enough to clear a wrapped H1.
 *
 * `bp` is the point below which the field switches to *band mode*: the zone
 * becomes a full-width horizontal band, icons spread edge to edge, and they
 * drift in the sky above and the ground below the headline. On a 375px hero
 * there is genuinely no room beside the text, and pretending otherwise is
 * what makes this kind of background look broken.
 *
 * These numbers are the single source of truth. `DriftLayer.astro` renders
 * them into CSS `max()` expressions, and hands the same values to `drift.ts`
 * through `data-q` so the mask, the anchors and the steering field can never
 * drift out of agreement.
 */
export const QUIET = {
  bp: 720,
  rxPct: 30,
  rxMin: 150,
  ryPct: 27,
  ryMin: 168,
  /** Band-mode x radius, as a multiple of field width. Large enough that the
   *  ellipse has no meaningful horizontal falloff — i.e. it is a band. */
  bandRx: 4,
} as const;

/** Anchor inset from the field edge. Mirrored by the `clamp()` in the CSS. */
export const EDGE_PCT = 4;

/** The plan's default set: the stack this site is actually about. */
export const DEFAULT_ICONS: IconName[] = [
  'go',
  'aws',
  'kubernetes',
  'terraform',
  'docker',
  'postgres',
  'prometheus',
  'typescript',
  'azure',
];

export interface MoteSeed {
  name: IconName;
  /** Horizontal anchor, in multiples of the quiet-zone x radius. */
  ux: number;
  /** Vertical anchor, in multiples of the quiet-zone y radius. */
  uy: number;
  /** Horizontal anchor as a 0–1 fraction of field width, used in band mode. */
  hx: number;
  /** Velocity, px/s. */
  vx: number;
  vy: number;
  /** Rotation, deg, and rotation rate, deg/s. */
  rot: number;
  vr: number;
  size: number;
  opacity: number;
  /** 0 for the near plane, up to ~1.8px for the far plane. */
  blur: number;
  /** Percentage of --accent-strong in the accent-strong/accent-2 mix. */
  tint: number;
}

const TAU = Math.PI * 2;
/** Golden angle — spreads N points around a ring with no visible banding. */
const GOLDEN = 2.399963229728653;

/** mulberry32: 4 lines, excellent distribution, fully deterministic. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * n stratified samples of 0–1, shuffled. Pure random sampling clumps at these
 * counts; stratifying guarantees the near, mid and far planes of the field are
 * all actually represented, and the shuffle keeps depth uncorrelated with the
 * icon's position in the list.
 */
function strata(n: number, rnd: () => number): number[] {
  const xs = Array.from({ length: n }, (_, i) => (i + rnd()) / n);
  for (let i = n - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t = xs[i] ?? 0;
    xs[i] = xs[j] ?? 0;
    xs[j] = t;
  }
  return xs;
}

const round = (v: number, p = 2) => Math.round(v * 10 ** p) / 10 ** p;

/**
 * Lay out one field. Deterministic for a given icon list and seed, so the
 * build output is stable and diffs stay readable.
 */
export function seedField(icons: readonly IconName[], seed = 0x9e3779b9): MoteSeed[] {
  const rnd = mulberry32(seed);
  const n = icons.length;

  const depths = strata(n, rnd);
  const spread = strata(n, rnd);

  return icons.map((name, i) => {
    const depth = depths[i] ?? 0;

    // Golden-angle ring in quiet-zone space. Radius > 1 means "outside the
    // ellipse", so every icon starts clear of the headline by construction.
    const angle = i * GOLDEN + rnd() * 0.4;
    const radius = 1.18 + rnd() * 0.62;

    // Near plane: larger, sharper, faster, more opaque, more cyan.
    // Far plane: smaller, blurred, slower, fainter, more teal.
    const speed = 8 + depth * 14;
    const dir = rnd() * TAU;

    return {
      name,
      ux: round(Math.cos(angle) * radius, 3),
      uy: round(Math.sin(angle) * radius, 3),
      hx: round(0.04 + (spread[i] ?? 0) * 0.92, 3),
      vx: round(Math.cos(dir) * speed),
      vy: round(Math.sin(dir) * speed),
      rot: Math.round((rnd() * 2 - 1) * 22),
      vr: round((rnd() * 2 - 1) * 6),
      size: Math.round(26 + depth * 20),
      opacity: round(0.1 + depth * 0.12, 3),
      blur: round((1 - depth) * 1.8, 2),
      tint: Math.round(25 + depth * 60),
    };
  });
}
