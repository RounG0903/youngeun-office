import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCheckinToken } from "@/lib/session";
import { requireUserSession } from "@/lib/admin";
import { isRoomCheckinEnabled } from "@/lib/settings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";

  if (!(await verifyCheckinToken(id, token))) {
    return NextResponse.json({ error: "유효하지 않은 체크인 QR입니다." }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { room: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!(await isRoomCheckinEnabled(reservation.roomId))) {
    return NextResponse.json(
      { error: "이 회의실은 태블릿 계정이 없어 체크인할 수 없습니다." },
      { status: 403 },
    );
  }

  if (reservation.userId !== session.id) {
    return NextResponse.json({ error: "본인 예약만 체크인할 수 있습니다." }, { status: 403 });
  }

  if (reservation.status !== "ACTIVE") {
    return NextResponse.json({ error: "체크인할 수 없는 예약입니다." }, { status: 400 });
  }

  if (reservation.checkedInAt) {
    return NextResponse.json({
      message: "이미 체크인되었습니다.",
      checkedInAt: reservation.checkedInAt,
    });
  }

  const now = new Date();
  const windowStart = new Date(reservation.startTime.getTime() - 15 * 60 * 1000);
  const windowEnd = new Date(reservation.endTime.getTime() + 15 * 60 * 1000);

  if (now < windowStart || now > windowEnd) {
    return NextResponse.json(
      { error: "체크인 가능 시간이 아닙니다. (예약 15분 전 ~ 종료 15분 후)" },
      { status: 400 },
    );
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { checkedInAt: now, status: "COMPLETED" },
    include: { room: true },
  });

  return NextResponse.json({
    message: "체크인이 완료되었습니다.",
    reservation: {
      id: updated.id,
      title: updated.title,
      roomName: updated.room.name,
      startTime: updated.startTime,
      endTime: updated.endTime,
      checkedInAt: updated.checkedInAt,
    },
  });
}
