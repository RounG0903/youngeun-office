import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/admin";
import { getDayBounds } from "@/lib/reservation";

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
      select: {
        id: true,
        title: true,
        roomId: true,
        userId: true,
        startTime: true,
        endTime: true,
      },
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
        .map((reservation) => {
          const isMine = reservation.userId === session.id;
          return {
            id: reservation.id,
            timeLabel: `${timeFmt.format(reservation.startTime)} ~ ${timeFmt.format(reservation.endTime)}`,
            isMine,
            title: isMine ? reservation.title : null,
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
