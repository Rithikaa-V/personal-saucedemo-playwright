-- Test-data store. Two responsibilities:
--  1) checkout_customers : SQL-driven test data (drives data-driven UI tests)
--  2) booking_ledger     : audit of every record API tests create (isolation + cleanup proof)

CREATE TABLE IF NOT EXISTS checkout_customers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name     TEXT NOT NULL DEFAULT '',
  last_name      TEXT NOT NULL DEFAULT '',
  postal_code    TEXT NOT NULL DEFAULT '',
  scenario       TEXT NOT NULL,            -- 'valid' | 'missing_first' | ...
  expected_error TEXT                      -- NULL when checkout should succeed
);

CREATE TABLE IF NOT EXISTS booking_ledger (
  booking_id  INTEGER PRIMARY KEY,
  firstname   TEXT NOT NULL,
  lastname    TEXT NOT NULL,
  totalprice  INTEGER NOT NULL,
  created_by  TEXT NOT NULL,               -- test title path
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_ledger_active ON booking_ledger(deleted_at);

INSERT INTO checkout_customers (first_name, last_name, postal_code, scenario, expected_error)
SELECT * FROM (
  SELECT 'Ada',   'Lovelace', '560001', 'valid',         NULL
  UNION ALL SELECT 'Alan',  'Turing',   'CB2 1TN', 'valid',         NULL
  UNION ALL SELECT 'Grace', 'Hopper',   '10001',   'valid',         NULL
  UNION ALL SELECT '',      'Hopper',   '10001',   'missing_first', 'Error: First Name is required'
  UNION ALL SELECT 'Grace', '',         '10001',   'missing_last',  'Error: Last Name is required'
  UNION ALL SELECT 'Grace', 'Hopper',   '',        'missing_zip',   'Error: Postal Code is required'
) WHERE NOT EXISTS (SELECT 1 FROM checkout_customers);
