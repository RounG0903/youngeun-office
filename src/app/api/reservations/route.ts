import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  combineDateAndTime,
  isFutureReservation,
  isSlotInBusinessHours,
  isUnderPenalty,
} from "@/lib/reservation";
import { requireUserSession } from "@/lib/admin";
import { ensurePenaltiesProcessed } from "@/lib/penalty";

export async function GET() {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  await ensurePenaltiesProcessed(session.id);

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  if (isUnderPenalty(user.penaltyUntil)) {
    return NextResponse.json(
      {
        error: "패널티 기간 중에는 예약할 수 없습니다.",
        penaltyUntil: user.penaltyUntil,
      },
      { status: 403 },
    );
  }

  const rooms = await prisma.meetingRoom.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      locationDescription: room.locationDescription,
      color: room.color,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const body = await request.json();
  const { title, roomId, date, startTime, endTime } = body as {
    title?: string;
    roomId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  };

  if (!title?.trim() || !roomId || !date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "제목, 회의실, 예약 시간은 필수입니다." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  if (isUnderPenalty(user.penaltyUntil)) {
    return NextResponse.json(
      { error: "패널티 기간 중에는 예약할 수 없습니다." },
      { status: 403 },
    );
  }

  const start = combineDateAndTime(date, startTime);
  const end = combineDateAndTime(date, endTime);
  const now = new Date();

  if (!isFutureReservation(start, now)) {
    return NextResponse.json({ error: "과거 시간은 예약할 수 없습니다." }, { status: 400 });
  }

  if (!isSlotInBusinessHours(start, end)) {
    return NextResponse.json(
      { error: "예약 시간은 06:00~22:00, 30분 단위여야 합니다." },
      { status: 400 },
    );
  }

  const room = await prisma.meetingRoom.findUnique({ where: { id: roomId } });
  if (!room) {
    return NextResponse.json({ error: "회의실을 찾을 수 없습니다." }, { status: 404 });
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      roomId,
      status: "ACTIVE",
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "해당 시간에 이미 예약이 있습니다." }, { status: 409 });
  }

  const reservation = await prisma.reservation.create({
    data: {
      title: title.trim(),
      userId: session.id,
      roomId,
      startTime: start,
      endTime: end,
    },
    include: {
      room: true,
      user: true,
    },
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
