'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningUp(true);
    setError('');

    try {
      const response = await fetch('/api/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'Unable to create the account.');
        return;
      }

      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/',
      });
      if (signInError) setError(signInError.message ?? 'Account created, but sign-in failed.');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50 p-6'>
      <div className='w-full max-w-md rounded-xl border bg-white p-8 shadow-sm'>
        <h1 className='text-2xl font-semibold text-gray-900'>Create an account</h1>
        <p className='mt-2 text-sm text-gray-600'>Only approved email addresses can create an account.</p>
        <form onSubmit={handleSignUp} className='mt-6 space-y-4'>
          <label className='block text-sm font-medium text-gray-700'>
            Name
            <input
              type='text'
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete='name'
              className='mt-1 w-full rounded-md border px-3 py-2 font-normal'
            />
          </label>
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
              minLength={8}
              autoComplete='new-password'
              className='mt-1 w-full rounded-md border px-3 py-2 font-normal'
            />
          </label>
          <button
            type='submit'
            disabled={isSigningUp}
            className='w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSigningUp ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className='mt-5 text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/sign-in' className='font-medium text-gray-900 underline'>
            Sign in
          </Link>
        </p>
        {error ? <p className='mt-4 text-sm text-red-600'>{error}</p> : null}
      </div>
    </main>
  );
}