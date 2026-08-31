/**
 * Single source of truth for primary navigation.
 *
 * Header renders this twice — desktop bar and mobile panel — and the two must
 * never drift, so the list lives here rather than being written out twice.
 */

/** Drives `aria-current="page"` and the accent treatment. PLAN.md §6. */
export type NavKey = 'about' | 'experience' | 'projects' | 'skills' | 'education' | 'blog';

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'about', label: 'About', href: '/#about' },
  { key: 'experience', label: 'Experience', href: '/#experience' },
  { key: 'projects', label: 'Projects', href: '/#projects' },
  { key: 'skills', label: 'Skills', href: '/#skills' },
  { key: 'education', label: 'Education', href: '/#education' },
  { key: 'blog', label: 'Blog', href: '/blog/' },
];

export const CONTACT_HREF = '/#contact';

/** Wordmark and copyright line. Matches the initials engraved in ui/Logo. */
export const SITE_OWNER = 'Boluwaji Joshua Adedigba';
