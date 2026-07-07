"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "./NavIcons";
import { USER_NAV_ITEMS } from "./nav-config";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="ig-bottom-nav" aria-label="하단 메뉴">
      {USER_NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.Icon;

        if (item.emphasize) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="ig-bottom-nav-create"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <PlusIcon className="h-5 w-5" />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ig-bottom-nav-item ${active ? "ig-bottom-nav-item-active" : ""}`}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-6 w-6" filled={active} />
          </Link>
        );
      })}
    </nav>
  );
}
