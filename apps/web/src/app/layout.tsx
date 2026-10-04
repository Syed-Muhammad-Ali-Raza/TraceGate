import type { Metadata } from 'next';

import { APP_NAME } from '@llm-gateway/shared';

import '../styles/globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'LLM Gateway & Observability Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
