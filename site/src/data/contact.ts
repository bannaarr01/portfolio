/**
 * Contact section: the closing block on the --surface band.
 *
 * Feeds: `components/home/Contact.astro`.
 *
 * Email, phone, and socials come from `profile.ts`. The WhatsApp CTA is built
 * from the same phone number with the non-digits stripped, so there is one
 * number to keep correct rather than two.
 */

import type { ContactContent } from '../components/home/types';
import { profile } from './profile';

/** wa.me wants digits only — no '+', spaces, or dashes. */
const whatsappNumber = profile.phone.replace(/\D/g, '');

export const contact = {
  // 07, not 08 — the testimonials section is not rendering. See `sections.ts`.
  heading: { index: '07', lead: "Let's", accent: 'Connect' },

  lead: 'I’m open to discussing backend and cloud engineering roles, platform modernization, and technically ambitious projects.',

  primaryCta: { label: 'Email Me', href: `mailto:${profile.email}`, icon: 'mail' },
  secondaryCta: {
    label: 'WhatsApp Me',
    href: `https://wa.me/${whatsappNumber}`,
    icon: 'message-circle',
  },

  email: profile.email,
  phone: profile.phone,
  socials: profile.socials,
} satisfies ContactContent;
