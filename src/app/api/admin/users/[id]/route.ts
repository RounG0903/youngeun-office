import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { applyPenalty } from "@/lib/penalty";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("users");
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (user.role !== "USER") {
    return NextResponse.json({ error: "일반 회원만 삭제할 수 있습니다." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "user.delete",
    entityType: "User",
    entityId: id,
    details: { targetName: user.name },
  });

  return NextResponse.json({ message: "회원이 삭제되었습니다." });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("users");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const action = body.action as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (user.role !== "USER") {
    return NextResponse.json({ error: "일반 회원만 관리할 수 있습니다." }, { status: 400 });
  }

  if (action === "apply_penalty") {
    const penaltyUntil = await applyPenalty(id);
    if (!penaltyUntil) {
      return NextResponse.json({ error: "패널티를 적용할 수 없는 회원입니다." }, { status: 400 });
    }

    await logAdminAction({
      actorId: auth.session.id,
      actorName: auth.session.name,
      actorRole: auth.session.role,
      action: "user.apply_penalty",
      entityType: "User",
      entityId: id,
      details: { targetName: user.name, penaltyUntil },
    });

    return NextResponse.json({ message: "패널티가 적용되었습니다.", penaltyUntil });
  }

  if (action === "clear_penalty") {
    await prisma.user.update({
      where: { id },
      data: { penaltyUntil: null },
    });

    await logAdminAction({
      actorId: auth.session.id,
      actorName: auth.session.name,
      actorRole: auth.session.role,
      action: "user.clear_penalty",
      entityType: "User",
      entityId: id,
      details: { targetName: user.name },
    });

    return NextResponse.json({ message: "패널티가 해제되었습니다." });
  }

  if (action === "toggle_checkin_required") {
    const updated = await prisma.user.update({
      where: { id },
      data: { checkinRequired: !user.checkinRequired },
    });

    await logAdminAction({
      actorId: auth.session.id,
      actorName: auth.session.name,
      actorRole: auth.session.role,
      action: "user.toggle_checkin",
      entityType: "User",
      entityId: id,
      details: {
        targetName: user.name,
        checkinRequired: updated.checkinRequired,
      },
    });

    return NextResponse.json({
      message: updated.checkinRequired
        ? "체크인이 필요하도록 설정되었습니다."
        : "체크인 없이 예약 가능하도록 설정되었습니다. (노쇼 패널티 없음)",
      checkinRequired: updated.checkinRequired,
    });
  }

  return NextResponse.json({ error: "알 수 없는 작업입니다." }, { status: 400 });
}
