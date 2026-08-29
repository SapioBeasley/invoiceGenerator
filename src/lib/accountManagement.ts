import 'server-only';

import { sql } from '@/lib/neon';
import type { AccountRole } from '@/lib/accountManagementRules';

export interface ManagedAccount {
  email: string;
  name: string | null;
  status: 'pending' | 'created';
  accountType: AccountRole;
  allowedRole: AccountRole;
}

export const getManagedAccounts = async (): Promise<ManagedAccount[]> => {
  const rows = await sql`
    SELECT
      allowed.email,
      u.name,
      CASE WHEN u.id IS NULL THEN 'pending' ELSE 'created' END AS status,
      COALESCE(u.role, allowed.role) AS "accountType",
      allowed.role AS "allowedRole"
    FROM signup_allowlist allowed
    LEFT JOIN "user" u ON lower(u.email) = allowed.email
    ORDER BY allowed.email
  `;

  return rows as unknown as ManagedAccount[];
};

export const getAllowedSignupRole = async (email: string): Promise<AccountRole | null> => {
  const rows = await sql`
    SELECT role
    FROM signup_allowlist
    WHERE email = ${email}
  `;
  const role = (rows as unknown as { role?: string }[])[0]?.role;

  return role === 'admin' || role === 'user' ? role : null;
};

export const getAdminUserCount = async (): Promise<number> => {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM "user" WHERE role = 'admin'`;
  return Number((rows as unknown as { count: number }[])[0]?.count ?? 0);
};

export const upsertManagedAccount = async (email: string, role: AccountRole): Promise<void> => {
  await sql.transaction([
    sql`
      INSERT INTO signup_allowlist (email, role)
      VALUES (${email}, ${role})
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
    `,
    sql`
      UPDATE "user"
      SET role = ${role}
      WHERE lower(email) = ${email}
    `,
  ]);
};

export const removeManagedAccount = async (email: string): Promise<boolean> => {
  const rows = await sql`
    DELETE FROM signup_allowlist
    WHERE email = ${email}
    RETURNING email
  `;
  return rows.length > 0;
};