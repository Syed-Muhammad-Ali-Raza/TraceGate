'use client';

import { AppButton } from '@/components/common/AppButton';
import { logoutRequest } from '@/features/auth/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUiStore } from '@/stores/useUiStore';

export function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  async function onLogout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <AppButton variant="ghost" type="button" onClick={toggleSidebar}>
          Menu
        </AppButton>
        <p className="text-sm text-muted-foreground">Observability dashboard</p>
      </div>
      <div className="flex items-center gap-3">
        <AppButton
          variant="secondary"
          type="button"
          onClick={() => {
            const next = theme === 'light' ? 'dark' : 'light';
            setTheme(next);
            document.documentElement.classList.toggle('dark', next === 'dark');
          }}
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </AppButton>
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <AppButton variant="secondary" type="button" onClick={() => void onLogout()}>
          Log out
        </AppButton>
      </div>
    </header>
  );
}
