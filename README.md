This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication

The app uses Better Auth with email/password authentication. Signup is disabled in Better Auth's public API and is available only through the app's approved-email signup route. Add these variables to `.env.local` and to the deployment environment:

- `BETTER_AUTH_URL` — the app URL, such as `http://localhost:3000` locally
- `BETTER_AUTH_SECRET` — a long random secret used to sign sessions
- `APPROVED_SIGNUP_EMAILS` — comma-separated email addresses allowed to create accounts
- `FULL_ACCESS_EMAILS` — comma-separated email addresses whose new accounts should be created as administrators
- `DATABASE_URL` — the existing Neon PostgreSQL connection string

After configuring the environment, create or update the Better Auth tables in the existing database:

```bash
yarn auth:migrate
```

Create the first administrator account by providing its password at runtime. The password is not stored in the repository or by the script:

```bash
ADMIN_EMAIL=andreas@sapioweb.com ADMIN_PASSWORD='your-password' yarn auth:bootstrap-admin
```

The initial administrator can access every module. Regular users created from an approved email can access the Grooming Checklist, Weekly Schedule, and Activity Data Summary. The other modules are restricted server-side, and the activity API requires an authenticated session for every method.

There is no invitation email or email delivery step. The initial environment allowlists are imported into the database when you run `yarn db:migrate`; after that, administrators can use the Account Access module to add allowed emails without editing environment variables. An allowed address can be marked as a regular user or administrator, and administrators can review whether the account has been created and its current account type. Approved users then visit `/sign-up` and choose their own password. The Better Auth `/api/auth/sign-up/email` endpoint remains disabled so the database allowlist cannot be bypassed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
