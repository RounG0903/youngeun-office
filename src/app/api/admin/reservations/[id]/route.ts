import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { canCancelReservation } from "@/lib/reservation";
import { formatUserDisplayName } from "@/lib/user-number";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("reservations");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { user: true, room: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  if (reservation.status !== "ACTIVE") {
    return NextResponse.json({ error: "이미 종료되었거나 취소된 예약입니다." }, { status: 400 });
  }

  const now = new Date();
  await prisma.reservation.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
    },
  });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "reservation.cancel",
    entityType: "Reservation",
    entityId: id,
    details: {
      title: reservation.title,
      userName:
        reservation.user.userNumber != null
          ? formatUserDisplayName(reservation.user.name, reservation.user.userNumber)
          : reservation.user.name,
      roomName: reservation.room.name,
    },
  });

  return NextResponse.json({
    message: canCancelReservation(reservation.startTime, now)
      ? "예약이 취소되었습니다."
      : "예약이 취소되었습니다. (시작 30분 이내 취소)",
  });
}
