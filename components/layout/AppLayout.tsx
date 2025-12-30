"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-primary-600">Budget Tracker</h1>
          </div>
        </header>
        <main className="flex-1 pb-20 md:pb-0">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
