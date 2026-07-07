import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canCancelReservation } from "@/lib/reservation";
import { ensurePenaltiesProcessed } from "@/lib/penalty";
import { requireUserSession } from "@/lib/admin";
import { isRoomCheckinEnabled } from "@/lib/settings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  await ensurePenaltiesProcessed(session.id);

  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { room: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  if (reservation.userId !== session.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const now = new Date();
  const canCancel =
    reservation.status === "ACTIVE" && canCancelReservation(reservation.startTime, now);
  const tabletCheckinEnabled = await isRoomCheckinEnabled(reservation.roomId);

  return NextResponse.json({
    reservation: {
      id: reservation.id,
      title: reservation.title,
      roomName: reservation.room.name,
      roomLocationDescription: reservation.room.locationDescription,
      roomColor: reservation.room.color,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      checkedInAt: reservation.checkedInAt,
      status: reservation.status,
      cancelledAt: reservation.cancelledAt,
      canCancel,
      tabletCheckinEnabled,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  if (reservation.userId !== session.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const now = new Date();

  if (reservation.status === "ACTIVE") {
    if (!canCancelReservation(reservation.startTime, now)) {
      return NextResponse.json(
        { error: "예약 시작 30분 전까지만 취소할 수 있습니다." },
        { status: 400 },
      );
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: now },
    });

    return NextResponse.json({ message: "예약이 취소되었습니다." });
  }

  await prisma.reservation.delete({ where: { id } });

  return NextResponse.json({ message: "내역이 삭제되었습니다." });
}
