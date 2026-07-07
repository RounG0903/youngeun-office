import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import {
  combineDateAndTime,
  isFutureReservation,
  isSlotInBusinessHours,
} from "@/lib/reservation";
import { formatUserDisplayName } from "@/lib/user-number";
import { ensurePenaltiesProcessed } from "@/lib/penalty";

export async function GET() {
  const auth = await requireAdminPermission("reservations");
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

  return NextResponse.json({
    reservations: reservations.map((reservation) => ({
      ...reservation,
      user: {
        ...reservation.user,
        displayName:
          reservation.user.userNumber != null
            ? formatUserDisplayName(reservation.user.name, reservation.user.userNumber)
            : reservation.user.name,
      },
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("reservations");
  if (auth.error) return auth.error;

  const body = await request.json();
  const { title, roomId, date, startTime, endTime } = body as {
    title?: string;
    roomId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  };

  if (!title?.trim() || !roomId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "모든 필드를 입력해 주세요." }, { status: 400 });
  }

  const adminUser = await prisma.user.findUnique({ where: { id: auth.session.id } });
  if (!adminUser || !isAdminRole(adminUser.role)) {
    return NextResponse.json({ error: "관리자 계정을 찾을 수 없습니다." }, { status: 404 });
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
      userId: adminUser.id,
      roomId,
      startTime: start,
      endTime: end,
    },
    include: {
      room: true,
      user: true,
    },
  });

  const userDisplayName =
    reservation.user.userNumber != null
      ? formatUserDisplayName(reservation.user.name, reservation.user.userNumber)
      : reservation.user.name;

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "reservation.create",
    entityType: "Reservation",
    entityId: reservation.id,
    details: {
      title: reservation.title,
      userName: userDisplayName,
      roomName: reservation.room.name,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    },
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
