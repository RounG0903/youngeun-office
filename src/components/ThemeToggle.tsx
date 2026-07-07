"use client";

import { useEffect, useState } from "react";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function handleToggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-pressed={theme === "dark"}
    >
      <span className="theme-toggle-label">다크 모드</span>
      <span className={`theme-toggle-switch ${theme === "dark" ? "theme-toggle-switch-on" : ""}`}>
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
