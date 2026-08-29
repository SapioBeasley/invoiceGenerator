import fs from 'node:fs';
import process from 'node:process';
import { neon } from '@neondatabase/serverless';

if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile('.env.local');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

const sql = neon(databaseUrl);
const clients = JSON.parse(fs.readFileSync('src/data/clients.json', 'utf8'));
const getConfiguredEmails = (value) => [...new Set((value ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean))];

await sql`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    uci_number TEXT NOT NULL DEFAULT '',
    dob DATE,
    address TEXT NOT NULL DEFAULT '',
    referral_source TEXT NOT NULL DEFAULT '',
    coordinator_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS signup_allowlist (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

for (const email of getConfiguredEmails(process.env.FULL_ACCESS_EMAILS)) {
  await sql`
    INSERT INTO signup_allowlist (email, role)
    VALUES (${email}, 'admin')
    ON CONFLICT (email) DO NOTHING
  `;
}

for (const email of getConfiguredEmails(process.env.APPROVED_SIGNUP_EMAILS)) {
  await sql`
    INSERT INTO signup_allowlist (email, role)
    VALUES (${email}, 'user')
    ON CONFLICT (email) DO NOTHING
  `;
}

await sql`
  CREATE TABLE IF NOT EXISTS client_goals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (client_id, name)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity TEXT NOT NULL DEFAULT '',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS activity_goal_values (
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    goal_name TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (activity_id, goal_name)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS schedule_entries (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    entry_time TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL DEFAULT '',
    client_input TEXT NOT NULL DEFAULT '',
    staff TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS grooming_entries (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    item_label TEXT NOT NULL,
    rating TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, entry_date, item_label)
  )
`;

await sql`CREATE INDEX IF NOT EXISTS activities_client_date_idx ON activities(client_id, activity_date)`;
await sql`CREATE INDEX IF NOT EXISTS activities_date_idx ON activities(activity_date)`;
await sql`CREATE INDEX IF NOT EXISTS schedule_entries_client_date_idx ON schedule_entries(client_id, entry_date)`;
await sql`CREATE INDEX IF NOT EXISTS grooming_entries_client_date_idx ON grooming_entries(client_id, entry_date)`;

for (const client of clients) {
  await sql`
    INSERT INTO clients (id, name, uci_number, dob, address, referral_source, coordinator_name)
    VALUES (
      ${client.id},
      ${client.name},
      ${client.uciNumber},
      ${client.dob || null},
      ${client.address},
      ${client.referralSource},
      ${client.cordinatorName}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      uci_number = EXCLUDED.uci_number,
      dob = EXCLUDED.dob,
      address = EXCLUDED.address,
      referral_source = EXCLUDED.referral_source,
      coordinator_name = EXCLUDED.coordinator_name
  `;

  for (const [sortOrder, goal] of (client.goals ?? []).entries()) {
    await sql`
      INSERT INTO client_goals (client_id, name, sort_order)
      VALUES (${client.id}, ${goal}, ${sortOrder})
      ON CONFLICT (client_id, name) DO NOTHING
    `;
  }
}

await sql`
  DELETE FROM activities
  WHERE activity_date < CURRENT_DATE - INTERVAL '1 year'
`;

await sql`
  DELETE FROM schedule_entries
  WHERE entry_date < CURRENT_DATE - INTERVAL '1 year'
`;

await sql`
  DELETE FROM grooming_entries
  WHERE entry_date < CURRENT_DATE - INTERVAL '1 year'
`;

console.log('Neon activity schema and seed data are ready.');