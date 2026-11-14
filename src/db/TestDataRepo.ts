import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import type { Booking } from '../api/schemas';

export interface CheckoutCustomer {
  id: number;
  first_name: string;
  last_name: string;
  postal_code: string;
  scenario: string;
  expected_error: string | null;
}

export interface LedgerRow {
  booking_id: number;
  firstname: string;
  lastname: string;
  totalprice: number;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
}

/** node:sqlite returns null-prototype rows; normalise to plain objects for assertions. */
const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;

/**
 * Thin repository over SQLite. Every method uses prepared, parameterised
 * statements. Uses Node's built-in node:sqlite (no native build). Swap for pg/mysql2 to point at a real DB: only
 * this class changes, tests keep calling the same methods.
 */
export class TestDataRepo {
  private readonly db: DatabaseSync;

  constructor(file: string = env.dbPath) {
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  }

  close(): void {
    this.db.close();
  }

  // ---- SQL-driven test data ----
  customers(scenarioLike = '%'): CheckoutCustomer[] {
    return this.db
      .prepare('SELECT * FROM checkout_customers WHERE scenario LIKE ? ORDER BY id')
      .all(scenarioLike)
      .map((r) => plain<CheckoutCustomer>(r));
  }

  // ---- Ledger of API-created data ----
  recordBooking(id: number, b: Booking, createdBy: string): void {
    this.db
      .prepare(
        `INSERT INTO booking_ledger (booking_id, firstname, lastname, totalprice, created_by)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, b.firstname, b.lastname, b.totalprice, createdBy);
  }

  markDeleted(id: number): void {
    this.db
      .prepare(`UPDATE booking_ledger SET deleted_at = datetime('now') WHERE booking_id = ? AND deleted_at IS NULL`)
      .run(id);
  }

  getLedgerEntry(id: number): LedgerRow | undefined {
    const row = this.db.prepare('SELECT * FROM booking_ledger WHERE booking_id = ?').get(id);
    return row ? plain<LedgerRow>(row) : undefined;
  }

  activeBookingIds(): number[] {
    return (
      this.db
        .prepare('SELECT booking_id FROM booking_ledger WHERE deleted_at IS NULL ORDER BY booking_id')
        .all() as unknown as { booking_id: number }[]
    ).map((r) => r.booking_id);
  }

  sumActivePrice(): number {
    const row = this.db
      .prepare('SELECT COALESCE(SUM(totalprice), 0) AS total FROM booking_ledger WHERE deleted_at IS NULL')
      .get() as unknown as { total: number };
    return row.total;
  }

  findByLastname(lastname: string): LedgerRow[] {
    return this.db
      .prepare('SELECT * FROM booking_ledger WHERE lastname = ? ORDER BY booking_id')
      .all(lastname)
      .map((r) => plain<LedgerRow>(r));
  }
}

/** Collection-time helper: data-driven tests need rows before any fixture exists. */
export function loadCheckoutCustomers(scenarioLike = '%'): CheckoutCustomer[] {
  const repo = new TestDataRepo(':memory:');
  try {
    return repo.customers(scenarioLike);
  } finally {
    repo.close();
  }
}
