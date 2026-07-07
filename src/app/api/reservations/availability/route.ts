import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBookedSlots, getDayBounds } from "@/lib/reservation";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const date = searchParams.get("date");

  if (!roomId || !date) {
    return NextResponse.json(
      { error: "회의실과 날짜는 필수입니다." },
      { status: 400 },
    );
  }

  const room = await prisma.meetingRoom.findUnique({ where: { id: roomId } });
  if (!room) {
    return NextResponse.json({ error: "회의실을 찾을 수 없습니다." }, { status: 404 });
  }

  const { dayStart, dayEnd } = getDayBounds(date);

  const reservations = await prisma.reservation.findMany({
    where: {
      roomId,
      status: "ACTIVE",
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const bookedSlots = getBookedSlots(reservations);

  return NextResponse.json({
    bookedSlots,
    reservations: reservations.map((reservation) => ({
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
    })),
  });
}
