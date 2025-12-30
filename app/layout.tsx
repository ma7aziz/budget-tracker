import type { Metadata } from "next";
import { PwaRegister } from "./pwa-register";
import { DemoSeed } from "./demo-seed";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Offline-first personal budget tracker.",
  manifest: "/manifest.json",
  themeColor: "#0f6b5a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        <DemoSeed />
        {children}
      </body>
    </html>
  );
}
