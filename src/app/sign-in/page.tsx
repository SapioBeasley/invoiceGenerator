'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/',
    });

    if (signInError) {
      setError(signInError.message ?? 'Unable to sign in.');
      setIsSigningIn(false);
    }
  };

  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50 p-6'>
      <div className='w-full max-w-md rounded-xl border bg-white p-8 shadow-sm'>
        <h1 className='text-2xl font-semibold text-gray-900'>Sign in</h1>
        <p className='mt-2 text-sm text-gray-600'>Use your email and password to access the dashboard.</p>
        <form onSubmit={handleSignIn} className='mt-6 space-y-4'>
          <label className='block text-sm font-medium text-gray-700'>
            Email
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete='email'
              className='mt-1 w-full rounded-md border px-3 py-2 font-normal'
            />
          </label>
          <label className='block text-sm font-medium text-gray-700'>
            Password
            <input
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete='current-password'
              className='mt-1 w-full rounded-md border px-3 py-2 font-normal'
            />
          </label>
          <button
            type='submit'
            disabled={isSigningIn}
            className='w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className='mt-5 text-center text-sm text-gray-600'>
          Have an approved email?{' '}
          <a href='/sign-up' className='font-medium text-gray-900 underline'>
            Create an account
          </a>
        </p>
        {error ? <p className='mt-4 text-sm text-red-600'>{error}</p> : null}
      </div>
    </main>
  );
}