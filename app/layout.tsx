import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PwaRegister } from "./pwa-register";
import { DemoSeed } from "./demo-seed";
import { SupabaseSyncListener } from "./supabase-sync";
import { AuthGate } from "./auth-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Offline-first personal budget tracker.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logos/logo.png",
    apple: "/logos/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0b0b",
};

const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const sansFont = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${sansFont.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('app-theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans text-[var(--ink)]">
        <ThemeProvider>
          <PwaRegister />
          <DemoSeed />
          <SupabaseSyncListener />
          <AuthGate>{children}</AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
