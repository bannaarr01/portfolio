/**
 * The "Education & Credentials" section. Two exports, two columns.
 *
 * Feeds: `components/home/Education.astro`.
 *
 * ── EVERY FIELD HERE IS A PLACEHOLDER ────────────────────────────────────
 * Qualifications, institutions, dates, and grades are all verifiable claims.
 * Nothing in this file is real. Replace it before the site goes anywhere
 * public, or drop the entries you do not have.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────
 * `degrees` renders newest first with a `graduation-cap` icon; `notes` is a
 * bulleted list under each entry and may be empty. `certifications` renders
 * with an `award` icon, each row linking out via `url`.
 *
 * The two degree entries have different `notes` lengths on purpose: one note
 * versus three is the case that proves the column does not assume a fixed
 * card height.
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
    period: '04/2018 – 04/2022',
    location: 'Sepang, Malaysia',
    qualification: 'Bachelor of Engineering in Software Engineering (Honours)',
    institution: 'Xiamen University Malaysia',
    notes: ['Cumulative GPA: 3.05/4.00'],
  },
  {
    period: '01/2012 – 12/2017',
    location: 'Kuala Lumpur, Malaysia',
    qualification: 'Malaysia Independent Chinese Secondary School Unified Exam (UEC)',
    institution: 'Tsun Jin High School',
    notes: [
      'UEC results: 2As and 4Bs',
      'Volleyball Club Team Leader',
      'Student Representative for Malay Subject',
    ],
  },
] satisfies Degree[];

/**
 * Titles and issuers are real; the verification links are not yet known — the
 * mockup left every one of them as `#`.
 *
 * An empty `url` renders as plain text rather than a link. That is deliberate:
 * a credential row that looks clickable and goes nowhere is worse than one
 * that does not look clickable, and a `href="#"` on a verification claim
 * invites exactly the click it cannot honour. Paste the Credly or issuer URL
 * in and the row becomes a link with no other change.
 */
export const certifications = [
  {
    title: 'Node.js Application Developer',
    issuer: 'OpenJS Foundation · 2024',
    url: '',
  },
  {
    title: 'AWS Digital Badge Portfolio',
    issuer: 'AWS / Credly',
    url: '',
  },
  {
    title: 'Certified Associate in Back-end Development',
    issuer: 'TalentLabs',
    url: '',
  },
  {
    title: 'Certified Associate in Front-end Development',
    issuer: 'TalentLabs',
    url: '',
  },
] satisfies Certification[];
