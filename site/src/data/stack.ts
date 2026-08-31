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
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Resume-only (revision 01/2026). Terraform, Kafka, Prometheus, Grafana and
 * Datadog were dropped when this was rebuilt from the resume — none of them
 * appears in it. See the note in `skills.ts`.
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
  { name: 'Golang Gin', icon: 'go' },
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'JavaScript', icon: 'code' },
  { name: 'Python', icon: 'python' },
  { name: 'PHP', icon: 'code' },
  { name: 'Node.js', icon: 'server' },
  { name: 'NestJS', icon: 'server' },
  { name: 'Express.js', icon: 'server' },
  { name: 'AWS', icon: 'aws' },
  { name: 'Azure', icon: 'azure' },
  { name: 'Docker', icon: 'docker' },
  { name: 'Kubernetes', icon: 'kubernetes' },
  { name: 'OpenShift', icon: 'kubernetes' },
  { name: 'PostgreSQL', icon: 'postgres' },
  { name: 'MySQL', icon: 'database' },
  { name: 'MongoDB', icon: 'database' },
  { name: 'Redis', icon: 'database' },
  { name: 'RabbitMQ', icon: 'layers' },
  { name: 'gRPC', icon: 'layers' },
  { name: 'Casdoor', icon: 'shield' },
  { name: 'React', icon: 'code' },
] satisfies StackItem[];
