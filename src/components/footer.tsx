"use client"

import dynamic from 'next/dynamic';
import { dictionary } from '@/lib/i18n';

const ContactDialog = dynamic(
  () => import('./ui/contact-dialog').then((mod) => mod.ContactDialog),
  { ssr: false }
);

export function Footer() {
  const t = dictionary.fr;

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <span className="font-bold text-lg">MathSophos</span>
            <p className="text-sm text-muted-foreground italic max-w-md">
              Plateforme conçue et gérée par Mohamed Nagchi, professeur de mathématiques 2ème cycle au Maroc.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:underline">À propos</a>
            <ContactDialog>
              <button className="hover:underline cursor-pointer">
                Contact
              </button>
            </ContactDialog>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MathSophos. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
}
