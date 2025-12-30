"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, PieChart, DollarSign, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/budgets", label: "Budgets", icon: DollarSign },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-[var(--surface)] border-r border-[var(--border)] h-screen sticky top-0">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-semibold font-display text-[var(--accent)]">Budget Tracker</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all font-medium
                ${isActive
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--shadow-soft)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
                }
              `}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
