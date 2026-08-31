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
    period: 'TODO: 04/2018 – 04/2022',
    location: 'TODO: City, Country',
    qualification: 'TODO: Bachelor of ... (Honours)',
    institution: 'TODO: University name',
    notes: ['TODO: GPA, classification, or thesis title'],
  },
  {
    period: 'TODO: 01/2012 – 12/2017',
    location: 'TODO: City, Country',
    qualification: 'TODO: Secondary qualification',
    institution: 'TODO: School name',
    notes: [
      'TODO: results summary',
      'TODO: a leadership or club role',
      'TODO: anything else worth one line',
    ],
  },
] satisfies Degree[];

export const certifications = [
  {
    title: 'TODO: Certification name',
    issuer: 'TODO: Issuing body · Year',
    url: 'TODO: https://verification-url',
  },
  {
    title: 'TODO: Certification name',
    issuer: 'TODO: Issuing body · Year',
    url: 'TODO: https://verification-url',
  },
  {
    title: 'TODO: Certification name',
    issuer: 'TODO: Issuing body · Year',
    url: 'TODO: https://verification-url',
  },
  {
    title: 'TODO: Certification name',
    issuer: 'TODO: Issuing body · Year',
    url: 'TODO: https://verification-url',
  },
] satisfies Certification[];
