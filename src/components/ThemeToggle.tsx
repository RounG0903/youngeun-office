"use client";

import { useEffect, useState } from "react";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="4.25" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M12 2.5v2.75" />
        <path d="M12 18.75V21.5" />
        <path d="M4.22 4.22l1.94 1.94" />
        <path d="M17.84 17.84l1.94 1.94" />
        <path d="M2.5 12h2.75" />
        <path d="M18.75 12H21.5" />
        <path d="M4.22 19.78l1.94-1.94" />
        <path d="M17.84 6.16l1.94-1.94" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

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
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <span className="theme-toggle-label">화면 모드</span>
      <span className={`theme-toggle-track ${theme === "dark" ? "theme-toggle-track-dark" : ""}`}>
        <span className="theme-toggle-thumb" aria-hidden="true">
          <span className="theme-toggle-face theme-toggle-face-sun">
            <SunIcon />
          </span>
          <span className="theme-toggle-face theme-toggle-face-moon">
            <MoonIcon />
          </span>
        </span>
      </span>
    </button>
  );
}
