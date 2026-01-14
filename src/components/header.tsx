"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { dictionary } from '@/lib/i18n';
import { useLanguage } from '@/contexts/language-context';
import { GraduationCap, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { HeaderAuth } from './auth/header-auth';
import { useSession } from 'next-auth/react';

const NotificationBell = dynamic(
  () => import('./notifications/notification-bell').then((mod) => mod.NotificationBell),
  { ssr: false }
);

import { GoogleTranslate } from './google-translate';

export function Header() {
  const { t } = useLanguage();
  const { data: session } = useSession();

  // Check if user can access Fiches Pédagogiques
  const canAccessFiches = session?.user?.role && ['TEACHER', 'EDITOR', 'ADMIN'].includes(session.user.role);

  return (
    <header className="border-b sticky top-0 z-50 backdrop-blur-xl bg-opacity-100" style={{
      background: 'var(--background)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-3">
            {/* Logo */}
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{
              background: 'rgb(var(--primary))',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
            }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {/* Title with gradient */}
            <span className="font-bold text-xl gradient-text">
              MathSophos
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/lessons"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              {t.nav.lessons}
            </Link>
            <Link
              href="/exercises"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              {t.nav.exercises}
            </Link>
            <Link
              href="/exams-controls"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              Examens et Contrôle
            </Link>
            <Link
              href="/classrooms"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              {t.nav.classrooms}
            </Link>
            <Link
              href="/calculators"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              {t.nav.calculators}
            </Link>
            <Link
              href="/forum"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              {t.nav.forum}
            </Link>
            {canAccessFiches && (
              <Link
                href="/fiches"
                className="transition-colors hover:text-primary text-foreground/80"
              >
                Fiches Pédagogiques
              </Link>
            )}
            <Link
              href="/tutorials"
              className="transition-colors hover:text-primary text-foreground/80"
            >
              Tutoriels
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Smart Stealth Language Toggle */}
          <GoogleTranslate />
          {/* Notifications */}
          <NotificationBell />
          {/* Header Auth Dropdown */}
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

