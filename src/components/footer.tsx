"use client"

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, FlaskConical, Calculator,
  MessageSquare, Monitor, BookMarked, Mail, Heart,
  ExternalLink, Github
} from 'lucide-react';

const ContactDialog = dynamic(
  () => import('./ui/contact-dialog').then((mod) => mod.ContactDialog),
  { ssr: false }
);

const LINKS = [
  { href: '/lessons',        label: 'Leçons',        icon: <BookOpen className="h-3.5 w-3.5" /> },
  { href: '/exercises',      label: 'Exercices',     icon: <FlaskConical className="h-3.5 w-3.5" /> },
  { href: '/exams-controls', label: 'Examens',       icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { href: '/calculators',    label: 'Calculatrices', icon: <Calculator className="h-3.5 w-3.5" /> },
  { href: '/classrooms',     label: 'Classroom',     icon: <Monitor className="h-3.5 w-3.5" /> },
  { href: '/forum',          label: 'Forum',         icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { href: '/tutorials',      label: 'Tutoriels',     icon: <BookMarked className="h-3.5 w-3.5" /> },
];

export function Footer() {
  return (
    <footer className="border-t print:hidden" style={{ background: 'hsl(var(--muted)/0.3)' }}>

      {/* ── Main footer body ──────────────────────────────── */}
      <div className="container py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))',
                  boxShadow: '0 4px 12px hsl(var(--primary)/0.3)',
                }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span
                className="font-extrabold text-xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                MathSophos
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Plateforme éducative gratuite en mathématiques, conçue pour les élèves
              du collège et lycée au Maroc.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Conçue et gérée par{' '}
              <span className="font-semibold text-foreground/80">Prof. Mohamed Nagchi</span>
              {' '}— professeur de mathématiques 2ème cycle.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-foreground/90">Navigation</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <span className="text-muted-foreground/60 group-hover:text-primary transition-colors">
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / About column */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-foreground/90">À propos</h3>
            <ul className="space-y-2.5">
              <li>
                <ContactDialog>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group cursor-pointer">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Nous contacter
                  </button>
                </ContactDialog>
              </li>
              <li>
                <a
                  href="https://math-sophos.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  math-sophos.vercel.app
                </a>
              </li>
            </ul>

            {/* Mission statement */}
            <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-primary font-semibold">Mission :</span>{' '}
                Offrir aux élèves du monde entier le meilleur de l'éducation mathématique,
                gratuitement et sans publicité.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────── */}
      <div className="border-t border-border/50">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MathSophos. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Fait avec <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> pour les élèves du Maroc et du monde entier
          </p>
        </div>
      </div>
    </footer>
  );
}
