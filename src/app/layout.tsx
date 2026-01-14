import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
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

export const metadata: Metadata = {
  title: {
    default: "MathSophos - Plateforme Éducative Marocaine",
    template: "%s | MathSophos",
  },
  description: "La première plateforme éducative interactive au Maroc pour les mathématiques, du collège à l'université. Cours, exercices et assistance IA.",
  keywords: ["Mathématiques", "Maroc", "Baccalauréat", "Université", "Soutien scolaire", "IA", "Éducation"],
  authors: [{ name: "MathSophos Team" }],
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://mathsophos.com",
    title: "MathSophos - Excellence en Mathématiques",
    description: "Apprenez les mathématiques avec une approche moderne et interactive.",
    siteName: "MathSophos",
  },
  twitter: {
    card: "summary_large_image",
    title: "MathSophos - Plateforme Éducative",
    description: "Révolutionnez votre apprentissage des maths.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={roboto.variable}>
      <body
        suppressHydrationWarning={true}
        className="antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950"
      >
        <Providers>

          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
