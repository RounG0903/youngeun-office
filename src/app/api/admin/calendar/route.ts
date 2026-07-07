import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin";
import { getDayBounds } from "@/lib/reservation";
import { formatUserDisplayName } from "@/lib/user-number";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("reservations");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "날짜는 필수입니다." }, { status: 400 });
  }

  const { dayStart, dayEnd } = getDayBounds(date);

  const [rooms, reservations] = await Promise.all([
    prisma.meetingRoom.findMany({ orderBy: { name: "asc" } }),
    prisma.reservation.findMany({
      where: {
        status: "ACTIVE",
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      include: { user: true, room: true },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const timeFmt = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return NextResponse.json({
    date,
    rooms: rooms.map((room) => {
      const roomReservations = reservations
        .filter((reservation) => reservation.roomId === room.id)
        .map((reservation) => ({
          id: reservation.id,
          title: reservation.title,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          timeLabel: `${timeFmt.format(reservation.startTime)} ~ ${timeFmt.format(reservation.endTime)}`,
          userDisplayName:
            reservation.user.userNumber != null
              ? formatUserDisplayName(reservation.user.name, reservation.user.userNumber)
              : reservation.user.name,
        }));

      return {
        id: room.id,
        name: room.name,
        color: room.color,
        locationDescription: room.locationDescription,
        reservations: roomReservations,
      };
    }),
    totalReservations: reservations.length,
  });
}
