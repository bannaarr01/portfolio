/**
 * The "Education & Credentials" section. Two exports, two columns.
 *
 * Feeds: `components/home/Education.astro`.
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Everything here comes from `Boluwaji_Joshua_Adedigba_resume.pdf` (revision
 * dated 01/2026). The file it replaced was placeholder data — a Xiamen
 * University degree and a Tsun Jin UEC record, neither of which was real.
 *
 * Two things the resume does NOT provide, and which are therefore absent
 * rather than guessed:
 *
 *   - **Degree dates.** The resume lists no start or graduation year for
 *     either qualification, so `period` is empty. `Education.astro` joins
 *     `period` and `location` on a filtered array, so an empty period prints
 *     just the location instead of a dangling separator. Fill the years in
 *     and the meta line picks them up with no other change.
 *   - **Grades.** No GPA or classification is stated, so `notes` is empty on
 *     both entries. Do not add one that isn't on the transcript.
 *
 * The two degrees are the Coventry/INTI dual-award route — the local
 * qualification and the UK-awarded one for the same programme — which is why
 * both read as Software Engineering and neither supersedes the other.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────
 * `degrees` renders newest first with a `graduation-cap` icon; `notes` is a
 * bulleted list under each entry and may be empty. `certifications` renders
 * with an `award` icon, each row linking out via `url`.
 */

import type { EducationCardCopy } from '../components/home/types';
import type { Certification, Degree } from '../types/portfolio';

/** Header for the left card. `icon` must be a valid `IconName`. */
export const degreesCard = {
  kicker: 'Academic background',
  title: 'Education',
  icon: 'graduation-cap',
} satisfies EducationCardCopy;

/** Header for the right card. */
export const certificationsCard = {
  kicker: 'Professional development',
  title: 'Certifications',
  icon: 'award',
} satisfies EducationCardCopy;

export const degrees = [
  {
    period: '',
    location: 'Coventry, United Kingdom',
    qualification: 'Bachelor of Science with Honours, Software Engineering',
    institution: 'Coventry University',
    notes: [],
  },
  {
    period: '',
    location: 'Nilai, Malaysia',
    qualification: 'Bachelor of Computer Science (Hons), Software Engineering',
    institution: 'INTI International University',
    notes: [],
  },
] satisfies Degree[];

/**
 * Two of the four carry Credly verification links, taken from the hyperlinks
 * embedded in the resume PDF. The two IBM credentials are listed there as
 * plain text with no badge URL, so their `url` is empty.
 *
 * An empty `url` renders as plain text rather than a link. That is deliberate:
 * a credential row that looks clickable and goes nowhere is worse than one
 * that does not look clickable, and a `href="#"` on a verification claim
 * invites exactly the click it cannot honour. Paste the Credly or issuer URL
 * in and the row becomes a link with no other change.
 *
 * ── TITLES COME FROM THE BADGES, NOT THE RESUME ───────────────────────────
 * Both linked badges were fetched and their own titles used verbatim, because
 * the resume's shorthand overstates both of them and these rows are
 * verifiable — a visitor can click through and read the real name.
 *
 *   - The resume says "CCNA Cisco Certified". The badge is **CCNA:
 *     Introduction to Networks**, which is the first course of the Cisco
 *     Networking Academy CCNA series, *not* the proctored CCNA certification.
 *     Publishing it as "Cisco Certified Network Associate" would claim a
 *     credential the badge does not evidence.
 *   - The resume says "JSNAD Certified Node.js Developer" and implies OpenJS
 *     as issuer. The badge is issued by **The Linux Foundation** and is marked
 *     **Expired**. An expired certification presented as current is a live
 *     claim that does not hold, so the expiry is on the face of the row.
 *
 * If JSNAD gets renewed, drop the "· Expired" suffix. If the full CCNA is
 * earned, replace the row with that badge rather than editing this title.
 */
export const certifications = [
  {
    title: 'JSNAD: OpenJS Node.js Application Developer',
    issuer: 'The Linux Foundation · Expired',
    url: 'https://www.credly.com/badges/c8d36fc6-baf3-4c8f-bfe2-2bc037bd2a5e',
  },
  {
    title: 'CCNA: Introduction to Networks',
    issuer: 'Cisco Networking Academy',
    url: 'https://www.credly.com/badges/5143d6b4-faf2-482a-89de-7dbd745799a9/public_url',
  },
  {
    title: 'IBM Business Analytics',
    issuer: 'IBM',
    url: '',
  },
  {
    title: 'IBM IT Infrastructure',
    issuer: 'IBM',
    url: '',
  },
] satisfies Certification[];
