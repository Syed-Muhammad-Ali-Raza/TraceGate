'use client';

import { NavLink } from '@/components/common/NavLink';
import { useUiStore } from '@/stores/useUiStore';
import { cn } from '@/utils/cn';

const links = [
  { href: '/overview', label: 'Overview' },
  { href: '/requests', label: 'Requests' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/experiments', label: 'Experiments' },
  { href: '/evals', label: 'Evals' },
  { href: '/api-keys', label: 'API Keys' },
  { href: '/settings', label: 'Settings' },
];

export function AppSidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        'min-h-screen bg-sidebar text-sidebar-foreground transition-all',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      <div className="px-4 py-5 text-sm font-semibold tracking-wide">
        {sidebarOpen ? 'LLM Gateway' : 'LG'}
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href}>
            {sidebarOpen ? link.label : link.label.slice(0, 1)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
