import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
// import { MathJaxRegistry } from "@/components/mathjax-registry"; // Removed MathJax
import "katex/dist/katex.min.css"; // Added KaTeX styles

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
  preload: true,
  fallback: ['system-ui', 'arial'],
});

import type { Metadata, Viewport } from "next";

// ... existing code ...

export const viewport: Viewport = {
  width: 1280,
  initialScale: 0.3,
  maximumScale: 5,
  userScalable: true,
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://math-sophos.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MathSophos - Plateforme Éducative Marocaine | Mathématiques",
    template: "%s | MathSophos",
  },
  description: "La première plateforme éducative interactive au Maroc pour les mathématiques, du collège à l'université. Cours, exercices corrigés et assistance IA.",
  keywords: ["Mathématiques", "Maroc", "Baccalauréat", "Université", "Soutien scolaire", "IA", "Éducation", "MathSophos"],
  authors: [{ name: "MathSophos Team" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://math-sophos.vercel.app/',
  },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: siteUrl,
    title: "MathSophos - Plateforme Éducative Marocaine",
    description: "Apprenez les mathématiques avec une approche moderne et interactive.",
    siteName: "MathSophos",
  },
  twitter: {
    card: "summary_large_image",
    title: "MathSophos - Plateforme Éducative Marocaine",
    description: "Révolutionnez votre apprentissage des maths.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MathSophos',
    alternateName: ['Math Sophos', 'MathSophos Platform'],
    url: siteUrl,
    description: "La première plateforme éducative interactive au Maroc pour les mathématiques, du collège à l'université.",
    inLanguage: 'fr-MA',
  };

  return (
    <html lang="fr" suppressHydrationWarning className={roboto.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className="antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950"
      >
        <Providers>

          <ThemeProvider>
            <Header />
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
