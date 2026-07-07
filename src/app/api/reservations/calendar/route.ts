import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/admin";
import { getDayBounds, formatAppTimeRangeLabel } from "@/lib/reservation";
import { formatUserDisplayName } from "@/lib/user-number";

export async function GET(request: Request) {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

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
      include: { user: true },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return NextResponse.json({
    date,
    rooms: rooms.map((room) => {
      const roomReservations = reservations
        .filter((reservation) => reservation.roomId === room.id)
        .map((reservation) => {
          const isMine = reservation.userId === session.id;
          const userDisplayName =
            reservation.user.userNumber != null
              ? formatUserDisplayName(reservation.user.name, reservation.user.userNumber)
              : reservation.user.name;
          return {
            id: reservation.id,
            timeLabel: formatAppTimeRangeLabel(reservation.startTime, reservation.endTime),
            isMine,
            title: isMine ? reservation.title : null,
            userDisplayName,
          };
        });

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
