import type { Customer } from '../types';

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** South African numbers: 0XX XXX XXXX or +27 XX XXX XXXX, spaces and dashes allowed. */
const PHONE_RE = /^(\+27|0)[1-9]\d{8}$/;

export function validateCustomer(c: Customer): CustomerErrors {
  const errors: CustomerErrors = {};
  if (c.name.trim().length < 2) errors.name = 'Please enter your name.';

  const email = c.email.trim();
  if (!email) errors.email = "We'll send your confirmation here, so we need an email.";
  else if (!EMAIL_RE.test(email)) errors.email = "That email address doesn't look right.";

  const phone = c.phone.replace(/[\s()-]/g, '');
  if (!phone) errors.phone = 'We text a reminder the day before, so we need a mobile number.';
  else if (!PHONE_RE.test(phone)) errors.phone = 'Use a South African number, for example 082 123 4567.';

  return errors;
}
