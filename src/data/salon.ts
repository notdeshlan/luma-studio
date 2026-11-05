import type { CategoryId, Service, Stylist } from '../types';

export const SALON = {
  name: 'Luma Hair Studio',
  street: '8 Jacaranda Lane',
  area: 'Morningside, Durban 4001',
  phone: '031 555 0187',
  phoneHref: 'tel:+27315550187',
  email: 'hello@lumastudio.example',
};

/** Salon opening hours by day of the week, Sunday = 0. */
export const OPENING: ReadonlyArray<{ open: string; close: string } | null> = [
  null, // Sunday
  null, // Monday
  { open: '09:00', close: '18:00' },
  { open: '09:00', close: '18:00' },
  { open: '09:00', close: '19:00' }, // Late night Thursday
  { open: '09:00', close: '18:00' },
  { open: '08:00', close: '15:00' },
];

/** Everyone takes a half-hour lunch at 13:00. */
export const BREAK = { start: '13:00', duration: 30 };

export const CATEGORIES: ReadonlyArray<{ id: CategoryId; label: string }> = [
  { id: 'cut', label: 'Cuts' },
  { id: 'colour', label: 'Colour' },
  { id: 'treatment', label: 'Treatments' },
  { id: 'styling', label: 'Styling' },
];

export const SERVICES: ReadonlyArray<Service> = [
  { id: 'cut-blowdry', name: 'Cut & blow-dry', category: 'cut', duration: 60, price: 450, description: 'Consultation, wash, precision cut and a finished blow-dry.' },
  { id: 'mens-cut', name: "Men's cut", category: 'cut', duration: 30, price: 220, description: 'Clipper or scissor cut, washed and styled.' },
  { id: 'kids-cut', name: "Kids' cut", category: 'cut', duration: 30, price: 160, description: 'For under-12s. Patience and a lollipop included.' },
  { id: 'fringe', name: 'Fringe trim', category: 'cut', duration: 15, price: 80, description: 'A quick tidy between full cuts.' },

  { id: 'roots', name: 'Root touch-up', category: 'colour', duration: 90, price: 650, description: 'Permanent colour on up to 3 cm of regrowth.' },
  { id: 'full-colour', name: 'Full colour', category: 'colour', duration: 120, price: 850, description: 'All-over permanent or semi-permanent colour.' },
  { id: 'balayage', name: 'Balayage', category: 'colour', duration: 180, price: 1650, description: 'Hand-painted, soft, lived-in highlights with a toner.' },
  { id: 'toner', name: 'Toner & gloss', category: 'colour', duration: 45, price: 380, description: 'Refreshes tone and adds shine between colours.' },

  { id: 'keratin', name: 'Keratin smoothing', category: 'treatment', duration: 150, price: 1450, description: 'Cuts frizz and drying time for up to four months.' },
  { id: 'deep-condition', name: 'Deep-conditioning treatment', category: 'treatment', duration: 30, price: 250, description: 'Intensive moisture for dry or colour-treated hair.' },
  { id: 'scalp', name: 'Scalp therapy', category: 'treatment', duration: 45, price: 320, description: 'Exfoliating treatment and massage for a calm, healthy scalp.' },

  { id: 'blowdry', name: 'Blow-dry', category: 'styling', duration: 45, price: 280, description: 'Wash and blow-dry: sleek, bouncy or beachy.' },
  { id: 'event', name: 'Event styling', category: 'styling', duration: 60, price: 550, description: 'Updos, braids and curls for weddings, matric dances and parties.' },
  { id: 'bridal-trial', name: 'Bridal trial', category: 'styling', duration: 90, price: 900, description: 'Try your wedding look with your stylist before the big day.' },
];

export const STYLISTS: ReadonlyArray<Stylist> = [
  {
    id: 'ayesha',
    name: 'Ayesha Patel',
    role: 'Senior stylist & colourist',
    bio: 'Fourteen years behind the chair and our go-to for balayage and big colour changes.',
    specialties: ['Balayage', 'Colour correction', 'Bridal'],
    workDays: [2, 3, 4, 5, 6],
    services: ['cut-blowdry', 'fringe', 'roots', 'full-colour', 'balayage', 'toner', 'keratin', 'blowdry', 'event', 'bridal-trial'],
    color: '#c0587a',
  },
  {
    id: 'lerato',
    name: 'Lerato Dlamini',
    role: 'Stylist, curls & natural hair',
    bio: 'Curl-trained and passionate about healthy natural hair, from twist-outs to silk presses.',
    specialties: ['Curly cuts', 'Natural hair', 'Treatments'],
    workDays: [2, 3, 4, 6],
    services: ['cut-blowdry', 'kids-cut', 'fringe', 'keratin', 'deep-condition', 'scalp', 'blowdry', 'event'],
    color: '#2f7d6b',
  },
  {
    id: 'jordan',
    name: 'Jordan Naidoo',
    role: 'Barber & stylist',
    bio: 'Sharp fades, classic scissor cuts and a scalp treatment that people book just to relax.',
    specialties: ['Fades', "Men's grooming", 'Scalp care'],
    workDays: [3, 4, 5, 6],
    services: ['mens-cut', 'kids-cut', 'fringe', 'scalp', 'blowdry'],
    color: '#3f6fb5',
  },
  {
    id: 'mia',
    name: 'Mia van Wyk',
    role: 'Junior stylist',
    bio: 'Our rising star. Brilliant blow-dries and the friendliest chair in the studio.',
    specialties: ['Blow-dries', 'Toners', 'Kids'],
    workDays: [2, 3, 4, 5],
    services: ['cut-blowdry', 'kids-cut', 'fringe', 'toner', 'deep-condition', 'blowdry'],
    color: '#b97a1f',
  },
];

export const getService = (id: string) => SERVICES.find((s) => s.id === id);
export const getStylist = (id: string) => STYLISTS.find((s) => s.id === id);
export const stylistsForService = (serviceId: string) => STYLISTS.filter((s) => s.services.includes(serviceId));
