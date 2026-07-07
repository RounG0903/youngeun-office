import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { isTabletCheckinEnabled } from "@/lib/settings";

export async function GET() {
  const auth = await requireAdminPermission("rooms");
  if (auth.error) return auth.error;

  const rooms = await prisma.meetingRoom.findMany({
    include: {
      _count: { select: { reservations: true } },
      tabletUser: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const globalCheckinEnabled = await isTabletCheckinEnabled();

  return NextResponse.json({
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      reservationCount: room._count.reservations,
      hasTabletAccount: Boolean(room.tabletUser),
      checkinEnabled: globalCheckinEnabled && Boolean(room.tabletUser),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("rooms");
  if (auth.error) return auth.error;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "회의실명을 입력해 주세요." }, { status: 400 });
  }

  const existing = await prisma.meetingRoom.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 회의실입니다." }, { status: 409 });
  }

  const room = await prisma.meetingRoom.create({ data: { name } });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "room.create",
    entityType: "MeetingRoom",
    entityId: room.id,
    details: { name },
  });

  return NextResponse.json({ room }, { status: 201 });
}
