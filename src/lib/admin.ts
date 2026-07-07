import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminPermission } from "@/lib/permissions";
import { hasAdminPermission, isAdminRole } from "@/lib/permissions";
import type { UserRole } from "@/lib/roles";

type AdminSession = {
  id: string;
  name: string;
  role: UserRole;
  isServerAdmin: boolean;
};

export type AdminAuthResult =
  | { session: AdminSession; error?: undefined }
  | { error: NextResponse; session?: undefined };

async function loadAdminSession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  if (!isAdminRole(session.role)) {
    return { error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }

  if (session.role === "ADMIN" && session.isServerAdmin) {
    return {
      session: {
        id: session.id,
        name: session.name,
        role: session.role,
        isServerAdmin: true,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { isServerAdmin: true },
  });

  return {
    session: {
      id: session.id,
      name: session.name,
      role: session.role,
      isServerAdmin: user?.isServerAdmin ?? false,
    },
  };
}

export async function requireAdminSession(): Promise<
  AdminAuthResult | { error: NextResponse }
> {
  return loadAdminSession();
}

export async function requireServerAdminSession(): Promise<
  AdminAuthResult | { error: NextResponse }
> {
  const auth = await loadAdminSession();
  if ("error" in auth && auth.error) return auth;
  if (!auth.session.isServerAdmin) {
    return {
      error: NextResponse.json({ error: "서버 관리자 권한이 필요합니다." }, { status: 403 }),
    };
  }
  return auth;
}

export async function requireAdminPermission(
  permission: AdminPermission,
): Promise<AdminAuthResult | { error: NextResponse }> {
  const auth = await loadAdminSession();
  if ("error" in auth && auth.error) return auth;
  if (
    !hasAdminPermission(auth.session.role, permission, auth.session.isServerAdmin)
  ) {
    return { error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };
  }
  return auth;
}

export async function requireUserSession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  if (session.role !== "USER") {
    return { error: NextResponse.json({ error: "사용자 권한이 필요합니다." }, { status: 403 }) };
  }
  return { session };
}

export async function requireTabletSession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  if (session.role !== "TABLET") {
    return { error: NextResponse.json({ error: "태블릿 권한이 필요합니다." }, { status: 403 }) };
  }
  return { session };
}

export async function requireRoleSession(role: UserRole) {
  switch (role) {
    case "ADMIN":
    case "SUB_ADMIN":
      return requireAdminSession();
    case "TABLET":
      return requireTabletSession();
    default:
      return requireUserSession();
  }
}
