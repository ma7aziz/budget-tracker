"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl
            border-2 transition-all active:scale-95 touch-manipulation
            ${theme === value
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"
            }
          `}
        >
          <Icon size={24} strokeWidth={theme === value ? 2.5 : 2} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
