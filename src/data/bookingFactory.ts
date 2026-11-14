import { randomUUID } from 'node:crypto';
import type { Booking } from '../api/schemas';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

/** Builder with sensible random defaults; override only what the test cares about. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const tag = randomUUID().slice(0, 8);
  return {
    firstname: `Auto${tag}`,
    lastname: `Tester${tag}`,
    totalprice: 100 + Math.floor(Math.random() * 900),
    depositpaid: true,
    bookingdates: { checkin: iso(daysFromNow(7)), checkout: iso(daysFromNow(10)) },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
