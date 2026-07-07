"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { USER_NAV_ITEMS } from "./nav-config";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="ig-sidebar" aria-label="사이드 메뉴">
      <Link href="/reservations" className="ig-sidebar-logo ig-gradient-text">
        Youngeun Office
      </Link>

      <nav className="ig-sidebar-nav">
        {USER_NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.Icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`ig-sidebar-link ${active ? "ig-sidebar-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-6 w-6 shrink-0" filled={active} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ig-sidebar-footer">
        <LogoutButton className="ig-sidebar-logout w-full" />
      </div>
    </aside>
  );
}
