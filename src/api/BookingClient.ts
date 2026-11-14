import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
import { AuthResponseSchema, type Booking } from './schemas';
import { parseContract } from '../utils/schema';

/**
 * API "page object": one method per endpoint, returns the raw APIResponse so
 * tests decide what to assert (status, headers, body, negative cases).
 */
export class BookingClient {
  constructor(
    private readonly ctx: APIRequestContext,
    private readonly token?: string,
  ) {}

  private authHeaders(token = this.token): Record<string, string> {
    return token ? { Cookie: `token=${token}` } : {};
  }

  login(credentials: { username: string; password: string }): Promise<APIResponse> {
    return this.ctx.post('/auth', { data: credentials });
  }

  /** Happy-path helper used by worker fixtures. Throws if no token is issued. */
  async authenticate(username = env.apiUser, password = env.apiPassword): Promise<string> {
    const res = await this.login({ username, password });
    if (!res.ok()) throw new Error(`Auth failed: HTTP ${res.status()}`);
    return parseContract(AuthResponseSchema, await res.json(), 'POST /auth').token;
  }

  list(query?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get('/booking', { params: query });
  }
  get(id: number): Promise<APIResponse> {
    return this.ctx.get(`/booking/${id}`);
  }
  create(payload: unknown): Promise<APIResponse> {
    return this.ctx.post('/booking', { data: payload });
  }
  update(id: number, payload: Booking, token?: string | null): Promise<APIResponse> {
    return this.ctx.put(`/booking/${id}`, {
      data: payload,
      headers: token === null ? {} : this.authHeaders(token),
    });
  }
  patch(id: number, payload: Partial<Booking>, token?: string | null): Promise<APIResponse> {
    return this.ctx.patch(`/booking/${id}`, {
      data: payload,
      headers: token === null ? {} : this.authHeaders(token),
    });
  }
  remove(id: number, token?: string | null): Promise<APIResponse> {
    return this.ctx.delete(`/booking/${id}`, {
      headers: token === null ? {} : this.authHeaders(token),
    });
  }
  health(): Promise<APIResponse> {
    return this.ctx.get('/ping');
  }
}
