import Link from 'next/link';

import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="auth-lede">Use the seeded demo account or your own credentials.</p>
        <LoginForm />
        <p className="auth-footer">
          No account? <Link href="/register">Register</Link>
        </p>
      </div>
    </main>
  );
}
