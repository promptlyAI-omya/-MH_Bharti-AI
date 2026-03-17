"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Run once on mount to check local storage
    const savedTheme = localStorage.getItem("mh_bharti_theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // default is dark, already set in state
      applyTheme("dark");
    }
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    // Add/remove a global class to the <html> or <body> element. 
    // Since globals.css uses dark text for light mode in .light-theme class.
    if (newTheme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("mh_bharti_theme", newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration errors by not rendering children until mounted.
  // Although for ThemeProvider wrapping the whole app, it's safe to just 
  // render children, but wait... if we return nothing = hydration issues.
  // Instead, we just don't render children until mounted
  // BUT wrapping whole app in mounted check flash-bangs. 
  // Next.js standard is render, and let effect catch up.
  if(!mounted) {
    return <div className="invisible">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
