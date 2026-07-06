"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";

type UserNavProps = {
  userName: string;
};

export function UserNav({ userName }: UserNavProps) {
  const [open, setOpen] = useState(false);

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
          className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--border)] bg-white py-2 shadow-lg"
        >
          <Link
            href="/reservations/new"
            className="block px-4 py-2.5 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            예약하기
          </Link>
          <Link
            href="/reservations"
            className="block px-4 py-2.5 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            내 예약
          </Link>
          <Link
            href="/history"
            className="block px-4 py-2.5 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            히스토리
          </Link>
          <Link
            href="/account"
            className="block px-4 py-2.5 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            계정 설정
          </Link>
          <div className="my-1 border-t border-[var(--border)] px-4 py-2">
            <LogoutButton className="w-full" onLoggedOut={() => setOpen(false)} />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
