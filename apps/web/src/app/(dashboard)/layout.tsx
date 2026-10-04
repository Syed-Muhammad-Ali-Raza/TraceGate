'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppFooter } from '@/components/common/AppFooter';
import { AppHeader } from '@/components/common/AppHeader';
import { AppSidebar } from '@/components/common/AppSidebar';
import { meRequest } from '@/features/auth/api';
import { useAuthStore } from '@/stores/useAuthStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await meRequest();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          router.replace('/login');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setUser]);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Checking session…
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-6 py-6">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
