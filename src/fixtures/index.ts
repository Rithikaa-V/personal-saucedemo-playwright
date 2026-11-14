import { test as base, expect } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import { CreateBookingResponseSchema, type Booking } from '../api/schemas';
import { env } from '../config/env';
import { buildBooking } from '../data/bookingFactory';
import { TestDataRepo } from '../db/TestDataRepo';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { parseContract } from '../utils/schema';

export interface CreatedBooking {
  id: number;
  payload: Booking;
}

type TestFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  bookingApi: BookingClient;
  /** Factory: creates via API, records in SQL ledger, auto-deletes at teardown. */
  createBooking: (overrides?: Partial<Booking>) => Promise<CreatedBooking>;
  /** Convenience: one ready-made booking. */
  booking: CreatedBooking;
};

type WorkerFixtures = {
  db: TestDataRepo;
  adminToken: string;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // ---------- worker scope: created once per worker process ----------
  db: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const repo = new TestDataRepo();
      await use(repo);
      repo.close();
    },
    { scope: 'worker' },
  ],

  adminToken: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
      const token = await new BookingClient(ctx).authenticate();
      await use(token);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  // ---------- test scope ----------
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),

  bookingApi: async ({ playwright, adminToken }, use) => {
    // Dedicated context: the built-in `request` fixture points at the UI baseURL.
    const ctx = await playwright.request.newContext({
      baseURL: env.apiBaseUrl,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
    await use(new BookingClient(ctx, adminToken));
    await ctx.dispose();
  },

  createBooking: async ({ bookingApi, db }, use, testInfo) => {
    const created: number[] = [];
    await use(async (overrides = {}) => {
      const payload = buildBooking(overrides);
      const res = await bookingApi.create(payload);
      expect(res.ok(), `create booking failed: HTTP ${res.status()}`).toBeTruthy();
      const body = parseContract(CreateBookingResponseSchema, await res.json(), 'POST /booking');
      db.recordBooking(body.bookingid, body.booking, testInfo.titlePath.join(' > '));
      created.push(body.bookingid);
      return { id: body.bookingid, payload: body.booking };
    });
    // Teardown runs even if the test failed. Never leave data behind.
    for (const id of created) {
      await bookingApi.remove(id).catch(() => undefined);
      db.markDeleted(id);
    }
  },

  booking: async ({ createBooking }, use) => use(await createBooking()),
});

export { expect };
