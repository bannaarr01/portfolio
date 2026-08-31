/**
 * The scrolling technology marquee above the skills grid.
 *
 * Feeds: `components/home/StackStrip.astro`.
 *
 * ── HOW THE MARQUEE WORKS ────────────────────────────────────────────────
 * The component duplicates this list to produce a seamless loop. Author each
 * technology **once** here; do not paste a second copy in to make the strip
 * longer. The mockup's markup shows the doubled list because it is static
 * HTML, not because the data is doubled.
 *
 * Around twenty entries is the sweet spot: enough that the loop seam is not
 * obvious, few enough that the animation stays cheap. The strip is paused
 * entirely under `prefers-reduced-motion: reduce`.
 *
 * ── ICONS ────────────────────────────────────────────────────────────────
 * `icon` must be a valid `IconName`. Group 00's registry ships dedicated
 * brand glyphs for twelve of these; the rest reuse a generic glyph that
 * matches the category (`server`, `database`, `code`, `layers`, `activity`).
 * If you add a technology with no brand glyph, pick the closest generic one
 * rather than asking for a new icon.
 */

import type { StackItem } from '../types/portfolio';

export const stack = [
  { name: 'Go', icon: 'go' },
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'JavaScript', icon: 'code' },
  { name: 'Python', icon: 'python' },
  { name: 'Node.js', icon: 'server' },
  { name: 'NestJS', icon: 'server' },
  { name: 'AWS', icon: 'aws' },
  { name: 'Azure', icon: 'azure' },
  { name: 'Terraform', icon: 'terraform' },
  { name: 'Docker', icon: 'docker' },
  { name: 'Kubernetes', icon: 'kubernetes' },
  { name: 'GitHub Actions', icon: 'github' },
  { name: 'Kafka', icon: 'kafka' },
  { name: 'RabbitMQ', icon: 'layers' },
  { name: 'PostgreSQL', icon: 'postgres' },
  { name: 'MySQL', icon: 'database' },
  { name: 'MongoDB', icon: 'database' },
  { name: 'Prometheus', icon: 'prometheus' },
  { name: 'Grafana', icon: 'grafana' },
  { name: 'Datadog', icon: 'activity' },
] satisfies StackItem[];
