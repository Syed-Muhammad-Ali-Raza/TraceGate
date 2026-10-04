import Link from 'next/link';

import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-lede">Spins up your org and a default project automatically.</p>
        <RegisterForm />
        <p className="auth-footer">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
