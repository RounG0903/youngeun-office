import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import {
  combineDateAndTime,
  isFutureReservation,
  isSlotInBusinessHours,
  isUnderPenalty,
} from "@/lib/reservation";
import { ensurePenaltiesProcessed } from "@/lib/penalty";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  await ensurePenaltiesProcessed();

  const reservations = await prisma.reservation.findMany({
    include: {
      room: true,
      user: true,
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { title, userId, roomId, date, startTime, endTime } = body as {
    title?: string;
    userId?: string;
    roomId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  };

  if (!title?.trim() || !userId || !roomId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "모든 필드를 입력해 주세요." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (isUnderPenalty(user.penaltyUntil)) {
    return NextResponse.json({ error: "패널티 기간 중인 회원입니다." }, { status: 403 });
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
      userId,
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
