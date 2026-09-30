import type { Metadata } from "next";
import { Figtree, Heebo, Unbounded } from "next/font/google";

import { BoutonInstagram } from "@/components/bouton-instagram";
import { LangueProvider } from "@/components/i18n/langue-provider";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { direction } from "@/lib/i18n";
import { obtenirDico, obtenirLangue } from "@/lib/i18n/serveur";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

// Police pour l'hébreu (Figtree et Unbounded n'ont pas les lettres hébraïques)
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenirDico();
  return {
    title: t.meta.titre,
    description: t.meta.description,
    // Ouverte depuis l'écran d'accueil, l'application s'affiche en plein écran
    appleWebApp: { capable: true, title: "Mivtsa Now", statusBarStyle: "default" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const langue = await obtenirLangue();
  return (
    <html
      lang={langue}
      dir={direction(langue)}
      suppressHydrationWarning
      className={`${figtree.variable} ${unbounded.variable} ${heebo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LangueProvider langue={langue}>
            <SiteHeader />
            {children}
            <BoutonInstagram />
            <Toaster position="top-center" richColors closeButton dir={direction(langue)} />
          </LangueProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
