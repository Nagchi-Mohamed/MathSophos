"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { GraduationCap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { HeaderAuth } from './auth/header-auth';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NotificationBell = dynamic(
  () => import('./notifications/notification-bell').then((mod) => mod.NotificationBell),
  { ssr: false }
);

import { GoogleTranslate } from './google-translate';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  pathname: string;
}

function NavLink({ href, children, pathname }: NavLinkProps) {
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors px-1 py-0.5",
        isActive
          ? "text-primary"
          : "text-foreground/70 hover:text-foreground"
      )}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-primary rounded-full" />
      )}
    </Link>
  );
}

export function Header() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();

  const canAccessFiches = session?.user?.role && ['TEACHER', 'EDITOR', 'ADMIN'].includes(session.user.role);

  return (
    <header
      className="border-b sticky top-0 z-50 print:hidden"
      style={{
        background: 'hsl(var(--background)/0.9)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        boxShadow: '0 1px 24px rgba(0,0,0,0.07)',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            {/* Logo */}
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: 'hsl(var(--primary))',
                boxShadow: '0 4px 12px hsl(var(--primary)/0.3)',
              }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              MathSophos
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            <NavLink href="/lessons" pathname={pathname}>{t.nav.lessons}</NavLink>
            <NavLink href="/exercises" pathname={pathname}>{t.nav.exercises}</NavLink>
            <NavLink href="/exams-controls" pathname={pathname}>Examens</NavLink>
            <NavLink href="/classrooms" pathname={pathname}>{t.nav.classrooms}</NavLink>
            <NavLink href="/calculators" pathname={pathname}>{t.nav.calculators}</NavLink>
            <NavLink href="/forum" pathname={pathname}>{t.nav.forum}</NavLink>
            {canAccessFiches && (
              <NavLink href="/fiches" pathname={pathname}>Fiches Péd.</NavLink>
            )}
            <NavLink href="/tutorials" pathname={pathname}>Tutoriels</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <GoogleTranslate />
          <NotificationBell />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
