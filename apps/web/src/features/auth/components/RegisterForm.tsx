'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { registerRequest } from '@/features/auth/api';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await registerRequest(email, password, name || undefined);
      setUser(data.user);
      router.push('/overview');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return <p className="auth-lede">Loading form…</p>;
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <div className="auth-field">
        <label htmlFor="name">Organization name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="password">Password (min 10 chars)</label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? 'Please wait…' : 'Create account'}
      </button>
    </form>
  );
}
