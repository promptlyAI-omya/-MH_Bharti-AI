"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-300 ${
        theme === "dark"
          ? "bg-dark-card border-dark-border text-gray-400 hover:text-white"
          : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm"
      }`}
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
