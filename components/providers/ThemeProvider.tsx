"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSettings, setSettings } from "@/db/settings";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Apply theme on initial load (before React hydration)
  useEffect(() => {
    // Initial theme application
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    const initialTheme = savedTheme || "system";
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  // Load theme from settings after mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const settings = await getSettings();
        const savedTheme = (settings.theme || "system") as Theme;
        setThemeState(savedTheme);
        applyTheme(savedTheme);
        localStorage.setItem('app-theme', savedTheme);
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }
    if (mounted) {
      loadTheme();
    }
  }, [mounted]);

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        const isDark = mediaQuery.matches;
        setEffectiveTheme(isDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", isDark);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setEffectiveTheme(isDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      setEffectiveTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    
    try {
      await setSettings({ theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
