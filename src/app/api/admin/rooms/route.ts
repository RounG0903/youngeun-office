import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { isTabletCheckinEnabled } from "@/lib/settings";
import { pickRoomColorByIndex } from "@/lib/room";

function mapRoom(
  room: {
    id: string;
    name: string;
    locationDescription: string;
    color: string;
    _count: { reservations: number };
    tabletUser: { id: string } | null;
  },
  globalCheckinEnabled: boolean,
) {
  return {
    id: room.id,
    name: room.name,
    locationDescription: room.locationDescription,
    color: room.color,
    reservationCount: room._count.reservations,
    hasTabletAccount: Boolean(room.tabletUser),
    checkinEnabled: globalCheckinEnabled && Boolean(room.tabletUser),
  };
}

export async function GET() {
  const auth = await requireAdminPermission("rooms");
  if (auth.error) return auth.error;

  const rooms = await prisma.meetingRoom.findMany({
    include: {
      _count: {
        select: {
          reservations: {
            where: { status: { not: "CANCELLED" } },
          },
        },
      },
      tabletUser: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const globalCheckinEnabled = await isTabletCheckinEnabled();

  return NextResponse.json({
    rooms: rooms.map((room) => mapRoom(room, globalCheckinEnabled)),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("rooms");
  if (auth.error) return auth.error;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const locationDescription =
    typeof body.locationDescription === "string" ? body.locationDescription.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "회의실명을 입력해 주세요." }, { status: 400 });
  }

  const existing = await prisma.meetingRoom.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 회의실입니다." }, { status: 409 });
  }

  const roomCount = await prisma.meetingRoom.count();
  const room = await prisma.meetingRoom.create({
    data: {
      name,
      locationDescription,
      color: pickRoomColorByIndex(roomCount),
    },
  });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "room.create",
    entityType: "MeetingRoom",
    entityId: room.id,
    details: { name, locationDescription },
  });

  return NextResponse.json({ room }, { status: 201 });
}
