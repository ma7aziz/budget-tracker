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
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-600">Budget Tracker</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors font-medium
                ${isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
