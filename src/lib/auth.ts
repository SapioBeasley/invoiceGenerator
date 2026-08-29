import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const configuredBaseURL = process.env.BETTER_AUTH_URL;
const trustedOrigins = [
  configuredBaseURL,
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001']),
].filter((origin): origin is string => Boolean(origin));

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

export const auth = betterAuth({
  database: new Pool({ connectionString: databaseUrl, max: 5 }),
  baseURL: configuredBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
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