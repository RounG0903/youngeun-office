"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";

type UserNavProps = {
  userName: string;
};

const MENU_LINKS = [
  { href: "/reservations/new", label: "예약하기" },
  { href: "/reservations", label: "내 예약" },
  { href: "/calendar", label: "예약 캘린더" },
  { href: "/history", label: "히스토리" },
  { href: "/account", label: "계정 설정" },
] as const;

export function UserNav({ userName }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
        aria-expanded={open}
        aria-controls="user-nav-menu"
      >
        <span className="max-w-[8rem] truncate font-semibold">{userName}</span>
        <span
          className={`text-xs text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {open ? (
        <nav
          id="user-nav-menu"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,12rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-white py-2 shadow-lg"
        >
          {MENU_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2.5 text-sm hover:bg-[var(--accent-light)] ${
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "font-semibold text-[var(--primary)]"
                  : ""
              }`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 border-t border-[var(--border)] px-4 py-2">
            <LogoutButton className="w-full" onLoggedOut={() => setOpen(false)} />
          </div>
        </nav>
      ) : null}
    </div>
  );
}

export function UserTopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {MENU_LINKS.slice(0, 4).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-3 py-2 whitespace-nowrap ${
            pathname === link.href || pathname.startsWith(`${link.href}/`)
              ? "nav-active"
              : "text-[var(--muted)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
