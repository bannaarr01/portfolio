/**
 * The theme bootstrap.
 *
 * This runs before the first stylesheet, synchronously, in `<head>`. Anything
 * deferred or external produces a visible flash of the wrong theme, which is
 * the whole failure mode it exists to prevent.
 *
 * Resolution order (PLAN.md §4.5):
 *   1. `localStorage.theme` — 'light' or 'dark' if the visitor has chosen
 *   2. otherwise dark
 *
 * Dark is the absence of the attribute, so the script only ever *adds*
 * `data-theme="light"`. The try/catch is for private-mode browsers, where
 * touching `localStorage` throws.
 *
 * ── Stability warning ────────────────────────────────────────────────────
 * Group 09 pins this string's SHA-256 in the CSP `script-src`. Editing it —
 * including whitespace — invalidates that hash and blocks the script, which
 * means every visitor sees dark regardless of their choice. Change it only
 * deliberately, and tell group 09.
 *
 * ── Honouring the OS preference instead ──────────────────────────────────
 * `prefers-color-scheme: light` is deliberately not consulted. To honour it
 * when nothing is stored, this is the only line that changes — replace the
 * condition inside the try block with:
 *
 *   var t=localStorage.theme;
 *   if(t==='light'||(!t&&matchMedia('(prefers-color-scheme: light)').matches))
 */

/** Embed with `<script is:inline set:html={THEME_INIT_SCRIPT} />`. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.theme==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

/** The `localStorage` key. `ThemeToggle` (group 01) writes it; nothing else. */
export const THEME_STORAGE_KEY = 'theme';

export type Theme = 'dark' | 'light';
