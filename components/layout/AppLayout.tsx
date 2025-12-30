"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-[color:var(--surface)]/90 border-b border-[var(--border)] sticky top-0 z-30 safe-top backdrop-blur-lg">
          <div className="px-4 py-4">
            <h1 className="text-xl font-semibold font-display text-[var(--accent)]">Budget Tracker</h1>
          </div>
        </header>
        <main className="flex-1 pb-20 md:pb-0 smooth-scroll">
          <div className="container max-w-7xl mx-auto px-4 py-6 animate-fade-in">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
