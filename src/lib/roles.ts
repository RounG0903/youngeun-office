export type UserRole = "USER" | "TABLET" | "ADMIN";

export function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TABLET":
      return "/tablet";
    default:
      return "/reservations";
  }
}

export function isRoleAllowedOnPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/tablet")) return role === "TABLET";
  if (pathname.startsWith("/checkin")) return role === "USER";
  if (
    pathname.startsWith("/reservations") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/account")
  ) {
    return role === "USER";
  }
  if (pathname === "/") return true;
  if (pathname === "/login" || pathname === "/register" || pathname === "/find-account") return true;
  return role === "USER";
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "관리자";
    case "TABLET":
      return "태블릿";
    default:
      return "사용자";
  }
}
