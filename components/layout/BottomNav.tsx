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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full gap-1
                transition-colors
                ${isActive
                  ? "text-primary-600"
                  : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
