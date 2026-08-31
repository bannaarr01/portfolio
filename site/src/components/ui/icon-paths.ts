/**
 * The icon registry — the single source of truth for every glyph on the site.
 *
 * This lives in a `.ts` module rather than inside `Icon.astro` because an
 * `.astro` file can only export a component, and both `types/icons.ts` and
 * `content.config.ts` need to derive from these keys. Adding an icon here is
 * the only way to add an icon; `IconName` follows automatically, so a typo at
 * a call site is a compile error rather than an empty square.
 *
 * Every entry is the *inner* markup of a 24×24 viewBox drawn with
 * `stroke="currentColor"`, `stroke-width="2"`, round caps and joins, and no
 * fill. `Icon.astro` supplies the wrapping `<svg>`. Keeping the geometry
 * uniform is what makes a Lucide arrow and a hand-drawn Terraform mark read as
 * members of the same set.
 *
 * The stack glyphs at the bottom are deliberate line-art abstractions rather
 * than reproductions of the vendors' trademarks — they are atmosphere for the
 * background field and marquee, and they have to survive being drawn at 2px
 * stroke in a single colour.
 */
export const ICON_PATHS = {
  // --- Navigation & direction ---------------------------------------------
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'external-link':
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',

  // --- Contact & identity --------------------------------------------------
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'map-pin':
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-12h4v1.5A6 6 0 0 1 16 8z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  rss: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',

  // --- Theme ---------------------------------------------------------------
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',

  // --- Time & documents ----------------------------------------------------
  calendar:
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  'book-open':
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'book-check':
    '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/>',

  // --- Domain --------------------------------------------------------------
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  'cloud-cog':
    '<circle cx="12" cy="17" r="3"/><path d="M4.2 15.1A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="m15.7 18.4-.9-.3"/><path d="m9.2 15.9-.9-.3"/><path d="m10.6 20.7.3-.9"/><path d="m13.1 14.2.3-.9"/><path d="m13.6 20.7-.4-1"/><path d="m10.8 14.3-.4-1"/><path d="m8.3 18.6 1-.4"/><path d="m14.7 15.8 1-.4"/>',
  server:
    '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  layers:
    '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 10.37-3.5 1.59a1 1 0 0 0 0 1.83l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.6"/><path d="m6.08 15.37-3.5 1.59a1 1 0 0 0 0 1.83l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.6"/>',
  database:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  activity:
    '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  briefcase:
    '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  languages:
    '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  sparkles:
    '<path d="m12 3 1.9 5.6a2 2 0 0 0 1.5 1.5L21 12l-5.6 1.9a2 2 0 0 0-1.5 1.5L12 21l-1.9-5.6a2 2 0 0 0-1.5-1.5L3 12l5.6-1.9a2 2 0 0 0 1.5-1.5Z"/><path d="M19 3v4"/><path d="M21 5h-4"/><path d="M5 17v2"/><path d="M6 18H4"/>',
  'graduation-cap':
    '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.84l8.57 3.9a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  award:
    '<circle cx="12" cy="8" r="6"/><path d="m15.48 12.89 1.51 8.53a.5.5 0 0 1-.81.47l-3.58-2.69a1 1 0 0 0-1.2 0l-3.58 2.69a.5.5 0 0 1-.81-.47l1.51-8.53"/>',

  // --- Stack glyphs ---------------------------------------------------------
  // Line-art abstractions of the tooling, drawn to the same 24×24 / stroke-2
  // grammar as everything above so the marquee reads as one set.
  go: '<path d="M2 9h4"/><path d="M1 12h3.5"/><path d="M2.5 15h4"/><circle cx="14.5" cy="12" r="6.5"/><path d="M12 10.5h.01"/><path d="M17 10.5h.01"/><path d="M13 15.5h3"/>',
  aws: '<path d="M17.2 14H9a5 5 0 1 1 4.9-6h.6a4 4 0 0 1 2.7 6"/><path d="M3 18c5.6 3 12.4 3 18 0"/><path d="m19.4 16.4 1.6 1.6-1.6 1.6"/>',
  azure:
    '<path d="M9.5 3h4.8l6.7 16H14"/><path d="M9.5 3 3 19h5.5l4-9"/><path d="M8.5 19h11"/>',
  terraform:
    '<path d="M9.5 3.6 3.6 7v6.2l5.9 3.4Z"/><path d="M11 8.6 16.9 5.2v6.2L11 14.8Z"/><path d="M11 16.4 16.9 13v6.2L11 22.6Z"/>',
  docker:
    '<path d="M2.5 11.5h19c0 4.4-3 7.5-7.5 7.5H9a6.5 6.5 0 0 1-6.5-6.5Z"/><path d="M6 11.5V8h3.5v3.5"/><path d="M11.5 11.5V8H15v3.5"/><path d="M11.5 8V4.5H15V8"/><path d="M17.5 9c1.6-1.4 3.2-.2 3.2-.2"/>',
  kubernetes:
    '<path d="m12 2.4 8.2 4v7.2l-8.2 4-8.2-4V6.4Z"/><circle cx="12" cy="10" r="2.6"/><path d="M12 4.4V7.4"/><path d="m17.4 8-3.1 1.4"/><path d="m15.6 15-1.9-2.6"/><path d="m8.4 15 1.9-2.6"/><path d="M6.6 8l3.1 1.4"/>',
  postgres:
    '<path d="M4 10.5a8 8 0 0 1 16 0c0 3-1.4 5-3 6.1V21"/><path d="M6.8 16.4V21"/><path d="M11 21v-3.6"/><path d="M12.6 9.6c0 2.6 1 4.6 3 5.6"/><path d="M8.5 9h.01"/>',
  prometheus:
    '<circle cx="12" cy="12" r="9"/><path d="M7.5 15.5h9"/><path d="M8 12.8c0-3.2 4-3.6 4-8 3 3.2 4.5 5.2 4 8"/>',
  grafana:
    '<path d="M21 12a9 9 0 1 1-9-9"/><path d="M16.5 12A4.5 4.5 0 1 1 12 7.5"/><circle cx="12" cy="12" r="1"/><path d="m17 3 4 1 1 4"/>',
  typescript:
    '<rect width="18" height="18" x="3" y="3" rx="3"/><path d="M6.8 10.4h5.2"/><path d="M9.4 10.4V17"/><path d="M18.2 11a2.2 2.2 0 0 0-3.7 1.5c0 2.3 3.7 1.6 3.7 3.4A2.2 2.2 0 0 1 14.6 17"/>',
  python:
    '<path d="M12 2.5c-3 0-5 1-5 3v3.2h5V10H6.5c-2 0-3.5 1.5-3.5 3.5V15c0 2 1.5 3.5 3.5 3.5H8"/><path d="M12 21.5c3 0 5-1 5-3v-3.2h-5V14h5.5c2 0 3.5-1.5 3.5-3.5V9c0-2-1.5-3.5-3.5-3.5H16"/><path d="M9.5 5.5h.01"/><path d="M14.5 18.5h.01"/>',
} as const;

/**
 * Every registered icon name, as a literal union. Passing anything else to
 * `<Icon />` is a compile error.
 */
export type IconName = keyof typeof ICON_PATHS;

/** Runtime guard, used by the content schema to validate `heroGlyph`. */
export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && value in ICON_PATHS;
}
