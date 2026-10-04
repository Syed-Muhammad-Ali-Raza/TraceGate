'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-md px-3 py-2 text-sm transition',
        active
          ? 'bg-white/10 text-sidebar-foreground'
          : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
      )}
    >
      {children}
    </Link>
  );
}
