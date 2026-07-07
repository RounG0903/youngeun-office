"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { GUEST_PATHS } from "./nav-config";
import { SidebarNav } from "./SidebarNav";

export function UserAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGuest = GUEST_PATHS.has(pathname);

  if (isGuest) {
    return <div className="ig-guest-wrap">{children}</div>;
  }

  return (
    <div className="ig-app">
      <SidebarNav />
      <div className="ig-content">
        <div className="ig-feed">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
