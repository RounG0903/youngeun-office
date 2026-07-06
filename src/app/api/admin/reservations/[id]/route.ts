import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { canCancelReservation } from "@/lib/reservation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });

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

  return NextResponse.json({
    message: canCancelReservation(reservation.startTime, now)
      ? "예약이 취소되었습니다."
      : "예약이 취소되었습니다. (시작 30분 이내 취소)",
  });
}
