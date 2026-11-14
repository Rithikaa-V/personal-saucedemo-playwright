import { test, expect } from '../../src/fixtures';
import { buildBooking } from '../../src/data/bookingFactory';

test.describe('API: negative & security cases', () => {
  test('GET unknown id -> 404', { tag: '@regression' }, async ({ bookingApi }) => {
    expect((await bookingApi.get(987_654_321)).status()).toBe(404);
  });

  // Each row omits one required field. The service has no validation layer
  // and answers 500; we assert that it never *accepts* (2xx) an invalid payload.
  const requiredFields = ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates'] as const;
  for (const field of requiredFields) {
    test(`create without "${field}" is rejected`, { tag: '@regression' }, async ({ bookingApi, db }) => {
      const payload: Record<string, unknown> = { ...buildBooking() };
      delete payload[field];
      const res = await bookingApi.create(payload);
      expect(res.ok(), `server accepted payload missing ${field}`).toBeFalsy();
      expect(db.activeBookingIds()).toEqual([]); // nothing was tracked => nothing to clean up
    });
  }

  test('create with malformed JSON body is rejected', { tag: '@regression' }, async ({ bookingApi }) => {
    const res = await bookingApi.create('{not-json');
    expect(res.ok()).toBeFalsy();
  });

  test.describe('authorisation', () => {
    test('PUT without token -> 403', { tag: '@smoke' }, async ({ booking, bookingApi }) => {
      const res = await bookingApi.update(booking.id, buildBooking(), null);
      expect(res.status()).toBe(403);
    });

    test('PATCH with forged token -> 403', { tag: '@regression' }, async ({ booking, bookingApi }) => {
      const res = await bookingApi.patch(booking.id, { firstname: 'Hax' }, 'forged-token');
      expect(res.status()).toBe(403);
    });

    test('DELETE without token -> 403 and booking survives', { tag: '@regression' }, async ({ booking, bookingApi }) => {
      expect((await bookingApi.remove(booking.id, null)).status()).toBe(403);
      expect((await bookingApi.get(booking.id)).status()).toBe(200);
    });
  });
});
