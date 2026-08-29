import process from 'node:process';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile('.env.local');
}

const email = (process.env.ADMIN_EMAIL ?? 'andreas@sapioweb.com').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = (process.env.ADMIN_NAME ?? 'Andreas').trim();

if (!password) {
  throw new Error('ADMIN_PASSWORD is required. Provide it at runtime; it is never stored by this script.');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

const auth = betterAuth({
  database: new Pool({ connectionString: databaseUrl, max: 5 }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : [],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
  ],
});

try {
  const result = await auth.api.createUser({
    body: {
      email,
      name,
      password,
      role: 'admin',
    },
  });

  console.log(`Created admin account for ${result.user.email}.`);
} catch {
  throw new Error('Unable to create the admin account. It may already exist, or the auth schema may need migration.');
}