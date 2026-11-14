import { test, expect } from '../../src/fixtures';
import { AuthResponseSchema, BadCredentialsSchema } from '../../src/api/schemas';
import { env } from '../../src/config/env';
import { parseContract } from '../../src/utils/schema';

test.describe('API: authentication', () => {
  test('health check responds 201', { tag: '@smoke' }, async ({ bookingApi }) => {
    expect((await bookingApi.health()).status()).toBe(201);
  });

  test('valid credentials return a token matching the contract', { tag: '@smoke' }, async ({ bookingApi }) => {
    const res = await bookingApi.login({ username: env.apiUser, password: env.apiPassword });
    expect(res.status()).toBe(200);
    parseContract(AuthResponseSchema, await res.json(), 'POST /auth');
  });

  // NOTE: this API reports bad credentials as HTTP 200 + {reason}. We pin that
  // behaviour so an unexpected change (e.g. a switch to 401) is noticed.
  const bad = [
    { name: 'wrong password', username: env.apiUser, password: 'wrong' },
    { name: 'unknown user', username: 'nobody', password: env.apiPassword },
    { name: 'empty credentials', username: '', password: '' },
  ];
  for (const c of bad) {
    test(`rejects ${c.name}`, { tag: '@regression' }, async ({ bookingApi }) => {
      const res = await bookingApi.login({ username: c.username, password: c.password });
      const body = await res.json();
      expect(body).not.toHaveProperty('token');
      parseContract(BadCredentialsSchema, body, 'POST /auth (bad creds)');
    });
  }
});
