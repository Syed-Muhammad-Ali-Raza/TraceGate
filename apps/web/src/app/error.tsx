'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: '1rem' }}>
      <h1>Something went wrong</h1>
      <p style={{ color: '#666' }}>{error.message}</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
