import { test, expect } from '../../src/fixtures';
import { BookingIdListSchema, BookingSchema } from '../../src/api/schemas';
import { buildBooking } from '../../src/data/bookingFactory';
import { parseContract } from '../../src/utils/schema';

test.describe('API: booking lifecycle', () => {
  test('create -> read back; API response matches SQL ledger', { tag: '@smoke' }, async ({ createBooking, bookingApi, db }) => {
    const { id, payload } = await createBooking();

    // 1. read-back through the API and validate the contract
    const res = await bookingApi.get(id);
    expect(res.status()).toBe(200);
    const fetched = parseContract(BookingSchema, await res.json(), `GET /booking/${id}`);
    expect(fetched).toMatchObject(payload);

    // 2. SQL check: what we recorded equals what the server returned
    const row = db.getLedgerEntry(id);
    expect(row, 'ledger row exists').toBeDefined();
    expect(row).toMatchObject({
      booking_id: id,
      firstname: fetched.firstname,
      lastname: fetched.lastname,
      totalprice: fetched.totalprice,
      deleted_at: null,
    });

    // 3. SQL isolation check: tests in one worker run serially, so exactly this booking is active
    expect(db.activeBookingIds()).toEqual([id]);
  });

  test('list endpoint honours lastname filter', { tag: '@regression' }, async ({ createBooking, bookingApi, db }) => {
    const { id, payload } = await createBooking();
    const res = await bookingApi.list({ lastname: payload.lastname });
    expect(res.status()).toBe(200);
    const ids = parseContract(BookingIdListSchema, await res.json(), 'GET /booking').map((b) => b.bookingid);
    expect(ids).toContain(id);
    expect(db.findByLastname(payload.lastname).map((r) => r.booking_id)).toEqual([id]);
  });

  test('full update (PUT) replaces every field', { tag: '@regression' }, async ({ booking, bookingApi }) => {
    const replacement = buildBooking({ firstname: 'Replaced', totalprice: 4242, depositpaid: false });
    const res = await bookingApi.update(booking.id, replacement);
    expect(res.status()).toBe(200);
    expect(parseContract(BookingSchema, await res.json(), 'PUT')).toMatchObject(replacement);
  });

  test('partial update (PATCH) changes only supplied fields', { tag: '@regression' }, async ({ booking, bookingApi }) => {
    const res = await bookingApi.patch(booking.id, { firstname: 'Patched', totalprice: 999 });
    expect(res.status()).toBe(200);
    const body = parseContract(BookingSchema, await res.json(), 'PATCH');
    expect(body.firstname).toBe('Patched');
    expect(body.totalprice).toBe(999);
    expect(body.lastname).toBe(booking.payload.lastname); // untouched
  });

  test('delete removes the booking; SQL ledger reflects cleanup', { tag: '@smoke' }, async ({ booking, bookingApi, db }) => {
    const del = await bookingApi.remove(booking.id);
    expect(del.status()).toBe(201); // Restful-Booker quirk: DELETE answers 201
    db.markDeleted(booking.id);

    expect((await bookingApi.get(booking.id)).status()).toBe(404);
    expect(db.getLedgerEntry(booking.id)?.deleted_at).not.toBeNull();
    expect(db.activeBookingIds()).toEqual([]);
  });

  test('aggregate SQL check across several bookings', { tag: '@regression' }, async ({ createBooking, db }) => {
    const prices = [100, 250, 650];
    for (const totalprice of prices) await createBooking({ totalprice });
    expect(db.activeBookingIds()).toHaveLength(prices.length);
    expect(db.sumActivePrice()).toBe(prices.reduce((a, b) => a + b, 0));
  });
});
