export type CategoryId = 'cut' | 'colour' | 'treatment' | 'styling';

export interface Service {
  id: string;
  name: string;
  category: CategoryId;
  /** Minutes, always a multiple of 15. */
  duration: number;
  /** Rand. */
  price: number;
  description: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string[];
  /** Days of the week they work, Sunday = 0. */
  workDays: number[];
  services: string[];
  /** Used to colour their column and appointments on the dashboard. */
  color: string;
}

export type BookingStatus = 'booked' | 'completed' | 'cancelled' | 'no-show';

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  /** Short reference the customer sees, e.g. LM-7KQ2P. Unique. */
  ref: string;
  serviceId: string;
  stylistId: string;
  /** Salon-local date, YYYY-MM-DD. */
  date: string;
  /** Minutes after midnight, salon time. */
  start: number;
  end: number;
  customer: Customer;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}
