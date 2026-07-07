import type { ComponentType } from "react";
import {
  CalendarIcon,
  HistoryIcon,
  HomeIcon,
  PlusIcon,
  ProfileIcon,
} from "./NavIcons";

export type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; filled?: boolean }>;
  isActive: (pathname: string) => boolean;
  emphasize?: boolean;
};

export const USER_NAV_ITEMS: NavItem[] = [
  {
    href: "/reservations",
    label: "홈",
    Icon: HomeIcon,
    isActive: (pathname) =>
      pathname === "/reservations" ||
      (pathname.startsWith("/reservations/") && !pathname.startsWith("/reservations/new")),
  },
  {
    href: "/calendar",
    label: "캘린더",
    Icon: CalendarIcon,
    isActive: (pathname) => pathname === "/calendar" || pathname.startsWith("/calendar/"),
  },
  {
    href: "/reservations/new",
    label: "예약",
    Icon: PlusIcon,
    isActive: (pathname) => pathname === "/reservations/new",
    emphasize: true,
  },
  {
    href: "/history",
    label: "히스토리",
    Icon: HistoryIcon,
    isActive: (pathname) => pathname === "/history" || pathname.startsWith("/history/"),
  },
  {
    href: "/account",
    label: "프로필",
    Icon: ProfileIcon,
    isActive: (pathname) => pathname === "/account" || pathname.startsWith("/account/"),
  },
];

export const GUEST_PATHS = new Set(["/", "/login", "/register", "/find-account"]);
