'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { loginRequest } from '@/features/auth/api';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Renders a stable SSR placeholder, then the real form after mount.
 * Avoids hydration mismatches from browser password autofill.
 */
export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('demo@llmgateway.local');
  const [password, setPassword] = useState('DemoPass123!');
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
      const data = await loginRequest(email, password);
      setUser(data.user);
      router.push('/overview');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
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
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? 'Please wait…' : 'Sign in'}
      </button>
    </form>
  );
}
