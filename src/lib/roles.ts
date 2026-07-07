export type UserRole = "USER" | "TABLET" | "ADMIN" | "SUB_ADMIN";

export function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
    case "SUB_ADMIN":
      return "/admin";
    case "TABLET":
      return "/tablet";
    default:
      return "/reservations";
  }
}

export function isRoleAllowedOnPath(
  role: UserRole,
  pathname: string,
  isServerAdmin = false,
): boolean {
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN" && role !== "SUB_ADMIN") return false;
    const serverOnlyPaths = [
      "/admin/settings",
      "/admin/audit",
      "/admin/roles",
      "/admin/database",
    ];
    if (serverOnlyPaths.some((path) => pathname.startsWith(path))) {
      return isServerAdmin;
    }
    return true;
  }
  if (pathname.startsWith("/tablet")) return role === "TABLET";
  if (pathname.startsWith("/checkin")) return role === "USER";
  if (
    pathname.startsWith("/reservations") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/account")
  ) {
    return role === "USER";
  }
  if (pathname === "/") return true;
  if (pathname === "/login" || pathname === "/register" || pathname === "/find-account") {
    return true;
  }
  return role === "USER";
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "서버 관리자";
    case "SUB_ADMIN":
      return "부관리자";
    case "TABLET":
      return "태블릿";
    default:
      return "사용자";
  }
}
