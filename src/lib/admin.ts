import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

export async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  if (session.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }
  return { session };
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
      return requireAdminSession();
    case "TABLET":
      return requireTabletSession();
    default:
      return requireUserSession();
  }
}
