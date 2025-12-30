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

export function BottomNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[color:var(--surface)]/95 border-t border-[var(--border)] z-40 md:hidden safe-bottom backdrop-blur-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full gap-1
                transition-all active:scale-95 touch-manipulation
                ${isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
                }
              `}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-all"
              />
              <span className={`text-xs font-medium transition-all ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
