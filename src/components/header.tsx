"use client"

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import {
  GraduationCap, Menu, X, BookOpen, Calculator, MessageSquare,
  FlaskConical, GraduationCap as ExamIcon, Monitor, FileText,
  BookMarked, Search, ChevronDown
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { HeaderAuth } from './auth/header-auth';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { GoogleTranslate } from './google-translate';

const NotificationBell = dynamic(
  () => import('./notifications/notification-bell').then((mod) => mod.NotificationBell),
  { ssr: false }
);

/* ── Types ─────────────────────────────────────────────────── */
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  adminOnly?: boolean;
}

/* ── Nav map ────────────────────────────────────────────────── */
const NAV_ITEMS: NavItem[] = [
  { href: '/lessons',       label: 'Leçons',         icon: <BookOpen className="h-4 w-4" />,    description: 'Cours & chapitres' },
  { href: '/exercises',     label: 'Exercices',      icon: <FlaskConical className="h-4 w-4" />, description: 'Séries & problèmes' },
  { href: '/exams-controls',label: 'Examens',        icon: <ExamIcon className="h-4 w-4" />,    description: 'Contrôles & épreuves' },
  { href: '/classrooms',    label: 'Classroom',      icon: <Monitor className="h-4 w-4" />,      description: 'Classes en direct' },
  { href: '/calculators',   label: 'Calculatrices',  icon: <Calculator className="h-4 w-4" />,  description: 'Outils mathématiques' },
  { href: '/forum',         label: 'Forum',          icon: <MessageSquare className="h-4 w-4" />,description: 'Questions & réponses' },
  { href: '/fiches',        label: 'Fiches Péd.',    icon: <FileText className="h-4 w-4" />,    description: 'Ressources enseignants', adminOnly: true },
  { href: '/tutorials',     label: 'Tutoriels',      icon: <BookMarked className="h-4 w-4" />,  description: 'Guides pratiques' },
];

/* ── Desktop NavLink ────────────────────────────────────────── */
function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      className={cn(
        "relative text-sm font-medium transition-all duration-200 px-1 py-1 group",
        isActive ? "text-primary" : "text-foreground/65 hover:text-foreground"
      )}
    >
      {item.label}
      {/* Active underline */}
      <span className={cn(
        "absolute -bottom-[1px] left-0 h-[2px] rounded-full bg-primary transition-all duration-300",
        isActive ? "w-full" : "w-0 group-hover:w-full opacity-50"
      )} />
    </Link>
  );
}

/* ── Main Header ────────────────────────────────────────────── */
export function Header() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  const canAccessFiches = session?.user?.role &&
    ['TEACHER', 'EDITOR', 'ADMIN'].includes(session.user.role);

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || canAccessFiches);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Close mobile menu on outside click */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 print:hidden transition-all duration-300",
          scrolled
            ? "shadow-lg shadow-black/10 border-b border-border/80"
            : "border-b border-border/40"
        )}
        style={{
          background: 'hsl(var(--background)/0.92)',
          backdropFilter: 'blur(20px) saturate(200%)',
          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        }}
      >
        <div className="container flex h-16 items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'hsl(var(--primary))',
                boxShadow: '0 4px 14px hsl(var(--primary)/0.35)',
              }}
            >
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="notranslate font-extrabold text-xl tracking-tight text-primary hover:text-primary/90 transition-colors">
              MathSophos
            </span>
          </Link>

          {/* ── Desktop Nav ───────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {visibleItems.map(item => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          {/* ── Right controls ────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">
            <GoogleTranslate />
            <NotificationBell />
            <HeaderAuth />

            {/* Mobile burger */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen
                ? <X className="h-4 w-4" />
                : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ──────────────────────────── */}
        {mobileOpen && (
          <div
            ref={mobileRef}
            className="lg:hidden border-t border-border/60 animate-in slide-in-from-top-2 duration-200"
            style={{ background: 'hsl(var(--background)/0.98)' }}
          >
            <nav className="container py-4 grid grid-cols-2 gap-1.5">
              {visibleItems.map(item => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/70 text-foreground/80"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 p-1.5 rounded-lg",
                      isActive ? "bg-primary/20" : "bg-muted"
                    )}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile bottom bar */}
            <div className="container pb-4 pt-1 border-t border-border/40">
              <p className="text-xs text-muted-foreground text-center">
                Plateforme gratuite — Prof. Mohamed Nagchi
              </p>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
