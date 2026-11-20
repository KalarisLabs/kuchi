// Shared facts for the legal pages (privacy, terms, legal notice, analytics preferences).
// Only facts the operator publishes on kalarislabs.com belong here. Do not add a postal
// address, registration number or court venue until the owner supplies one.
export const LEGAL_UPDATED = '2026-11-20';
export const LEGAL_UPDATED_LABEL = '20 November 2026';
export const SITE = 'https://kuchi.kalarislabs.com';
export const CONTACT_EMAIL = 'hello@kalarislabs.com';
export const FOUNDER_EMAIL = 'sayan@kalarislabs.com';

export const PUBLISHER = {
  '@type': 'Organization',
  '@id': 'https://kalarislabs.com/#organization',
  name: 'Kalaris Labs',
  url: 'https://kalarislabs.com',
  email: CONTACT_EMAIL,
  founder: { '@type': 'Person', name: 'Sayan Chowdhury', url: 'https://kalarislabs.com/team/sayan-chowdhury' },
  areaServed: 'Worldwide',
  location: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'IN' } },
};

/** JSON-LD for one legal page. */
export function legalPage(type: 'WebPage' | 'AboutPage', path: string, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${SITE}${path}#webpage`,
    url: `${SITE}${path}`,
    name,
    description,
    inLanguage: 'en',
    dateModified: LEGAL_UPDATED,
    isPartOf: { '@type': 'WebSite', name: 'Kuchi', url: `${SITE}/` },
    publisher: PUBLISHER,
    ...(type === 'AboutPage' ? { about: PUBLISHER } : {}),
  };
}
