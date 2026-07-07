"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavLink = {
  href: string;
  label: string;
};

type AdminNavProps = {
  links: AdminNavLink[];
};

export function AdminNav({ links }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="관리자 메뉴">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-nav-link ${active ? "admin-nav-link-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
