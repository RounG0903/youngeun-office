import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSessionUser, setSession, verifyPin } from "@/lib/auth";
import { getHomePathForRole, isRoleAllowedOnPath } from "@/lib/roles";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { name, pin } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { name },
  });

  if (!user || !(await verifyPin(pin, user.pinHash))) {
    return NextResponse.json(
      { error: "이름 또는 PIN이 일치하지 않습니다." },
      { status: 401 },
    );
  }

  const sessionUser = buildSessionUser(user);
  await setSession(sessionUser);

  const nextPath = typeof body.next === "string" ? body.next : null;
  const redirectTo =
    nextPath && nextPath.startsWith("/") && isRoleAllowedOnPath(user.role, nextPath)
      ? nextPath
      : getHomePathForRole(user.role);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    redirectTo,
  });
}
