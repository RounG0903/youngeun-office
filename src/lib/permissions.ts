import type { UserRole } from "./roles";

export type AdminPermission =
  | "users"
  | "rooms"
  | "reservations"
  | "tablet"
  | "settings"
  | "audit"
  | "roles"
  | "database";

const SUB_ADMIN_PERMISSIONS: AdminPermission[] = [
  "users",
  "rooms",
  "reservations",
  "tablet",
];

const SERVER_ADMIN_ONLY_PERMISSIONS: AdminPermission[] = [
  "settings",
  "audit",
  "roles",
  "database",
];

const SERVER_ADMIN_ONLY_PATHS = [
  "/admin/settings",
  "/admin/audit",
  "/admin/roles",
  "/admin/database",
];

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUB_ADMIN";
}

export function hasAdminPermission(
  role: UserRole,
  permission: AdminPermission,
  isServerAdmin = false,
): boolean {
  if (isServerAdmin) return true;
  if (role === "ADMIN" && !isServerAdmin) return false;
  if (role === "SUB_ADMIN") {
    return SUB_ADMIN_PERMISSIONS.includes(permission);
  }
  return false;
}

export function isServerAdminOnlyPath(pathname: string): boolean {
  return SERVER_ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
}

export function canAccessAdminPath(
  role: UserRole,
  pathname: string,
  isServerAdmin = false,
): boolean {
  if (!isAdminRole(role)) return false;
  if (isServerAdminOnlyPath(pathname)) {
    return isServerAdmin;
  }
  return true;
}

export function getPermissionsForRole(
  role: UserRole,
  isServerAdmin = false,
): AdminPermission[] {
  if (isServerAdmin) {
    return [...SUB_ADMIN_PERMISSIONS, ...SERVER_ADMIN_ONLY_PERMISSIONS];
  }
  if (role === "SUB_ADMIN") return SUB_ADMIN_PERMISSIONS;
  return [];
}
