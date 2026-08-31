/**
 * `IconName` is derived from the icon registry, not hand-maintained.
 *
 * The registry itself lives at `components/ui/icon-paths.ts` because an
 * `.astro` file cannot export values. Import `IconName` from here — it is the
 * published contract; the registry module is an implementation detail of
 * group 00.
 */
export type { IconName } from '../components/ui/icon-paths';
export { isIconName } from '../components/ui/icon-paths';
