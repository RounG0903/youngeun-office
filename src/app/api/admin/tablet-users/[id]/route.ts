import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { hashPin } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("tablet");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ error: "태블릿 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  if (user.role !== "TABLET") {
    return NextResponse.json({ error: "태블릿 계정만 삭제할 수 있습니다." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "tablet.delete",
    entityType: "User",
    entityId: id,
    details: { targetName: user.name },
  });

  return NextResponse.json({ message: "태블릿 계정이 삭제되었습니다." });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("tablet");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const pin = typeof body.pin === "string" ? body.pin : "";

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN은 숫자 4자리여야 합니다." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "TABLET") {
    return NextResponse.json({ error: "태블릿 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      pinHash: await hashPin(pin),
      pinPlain: pin,
    },
  });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "tablet.update_pin",
    entityType: "User",
    entityId: id,
    details: { targetName: user.name },
  });

  return NextResponse.json({
    message: "태블릿 PIN이 변경되었습니다.",
    user: { id: updated.id, name: updated.name, pin: updated.pinPlain },
  });
}
