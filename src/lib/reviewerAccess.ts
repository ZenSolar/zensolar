// Reviewer access — allowlist of NDA-signed reviewers who get bonus links
// to founder-only pitch pages (without being granted the full `founder` role).
//
// Add an email here once they've signed the NDA on /demo. The check passes if
// the saved NDA email in localStorage matches an allowlist entry.

export const GREG_REVIEWER_CODE = 'GILI2026';
export const GREG_REVIEWER_EMAIL = 'limitedonlybyvision@gmail.com';

const REVIEWER_ALLOWLIST: ReadonlyArray<string> = [
  GREG_REVIEWER_EMAIL, // Active reviewer test link
];

const NDA_EMAIL_KEY = 'zen_nda_email';
const DEMO_ACCESS_KEY = 'zen_demo_access';

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function getSavedNdaEmail(): string | null {
  const raw = readStored(NDA_EMAIL_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email?: string };
    if (parsed?.email) return parsed.email.toLowerCase().trim();
  } catch {
    /* legacy plain-string */
  }
  return raw.toLowerCase().trim();
}

function hasDemoAccess(): boolean {
  const raw = readStored(DEMO_ACCESS_KEY);
  if (!raw) return false;
  try {
    const { ts, ndaSigned } = JSON.parse(raw);
    return ndaSigned === true && Date.now() - ts < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function getReviewerEmail(): string | null {
  const email = getSavedNdaEmail();
  if (!email) return null;
  return REVIEWER_ALLOWLIST.includes(email) ? email : null;
}

export function getReviewerInviteFromUrl(): { code: string; email: string } | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || params.get('access_code') || '').trim().toUpperCase();
  const email = (params.get('email') || '').trim().toLowerCase();

  if (code === GREG_REVIEWER_CODE && email === GREG_REVIEWER_EMAIL) {
    return { code, email };
  }

  return null;
}

export function isGregReviewerCode(code: string | null | undefined): boolean {
  return (code || '').trim().toUpperCase() === GREG_REVIEWER_CODE;
}

/** True if the visitor has signed the NDA, holds demo access, AND is on the reviewer allowlist. */
export function isAuthorizedReviewer(): boolean {
  return !!getReviewerEmail() && hasDemoAccess();
}

export const REVIEWER_PAGES = [
  {
    title: 'Seed Pitch',
    description: 'The full investor narrative: catalyst, flywheel, moat, capital plan, and 24-month milestone path.',
    path: '/founders/seed-pitch-greg',
  },
  {
    title: 'Companion Pitch Deck',
    description: '12-slide visual deck mirroring the seed pitch — clean, scannable, investor-grade.',
    path: '/founders/seed-pitch-companion-deck',
  },
] as const;
