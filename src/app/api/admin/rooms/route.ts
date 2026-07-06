import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const rooms = await prisma.meetingRoom.findMany({
    include: { _count: { select: { reservations: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      reservationCount: room._count.reservations,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
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
  return NextResponse.json({ room }, { status: 201 });
}
