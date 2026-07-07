import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdminPermission("roles");
  if (auth.error) return auth.error;

  const [subAdmins, candidates] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SUB_ADMIN" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ subAdmins, candidates });
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("roles");
  if (auth.error) return auth.error;

  const body = await request.json();
  const userId = typeof body.userId === "string" ? body.userId : "";

  if (!userId) {
    return NextResponse.json({ error: "회원을 선택해 주세요." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (user.role !== "USER") {
    return NextResponse.json({ error: "일반 회원만 부관리자로 지정할 수 있습니다." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: "SUB_ADMIN" },
    select: { id: true, name: true, role: true, createdAt: true },
  });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "role.grant_sub_admin",
    entityType: "User",
    entityId: userId,
    details: { targetName: user.name },
  });

  return NextResponse.json({ message: "부관리자 권한이 부여되었습니다.", user: updated });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermission("roles");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (user.role !== "SUB_ADMIN") {
    return NextResponse.json({ error: "부관리자만 회수할 수 있습니다." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "USER" },
  });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "role.revoke_sub_admin",
    entityType: "User",
    entityId: userId,
    details: { targetName: user.name },
  });

  return NextResponse.json({ message: "부관리자 권한이 회수되었습니다." });
}
