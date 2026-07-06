import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { hashPin } from "@/lib/auth";

const DEFAULT_TABLET_PIN = "0000";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    where: { role: "TABLET" },
    include: { room: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      pin: user.pinPlain,
      roomId: user.roomId,
      roomName: user.room?.name ?? null,
      createdAt: user.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const body = await request.json();
  const roomId = typeof body.roomId === "string" ? body.roomId : "";

  if (!roomId) {
    return NextResponse.json({ error: "회의실을 선택해 주세요." }, { status: 400 });
  }

  const room = await prisma.meetingRoom.findUnique({ where: { id: roomId } });
  if (!room) {
    return NextResponse.json({ error: "회의실을 찾을 수 없습니다." }, { status: 404 });
  }

  const existingTablet = await prisma.user.findUnique({ where: { roomId } });
  if (existingTablet) {
    return NextResponse.json({ error: "이 회의실에 이미 태블릿 계정이 있습니다." }, { status: 409 });
  }

  const existingName = await prisma.user.findUnique({ where: { name: room.name } });
  if (existingName) {
    return NextResponse.json(
      { error: "회의실 이름과 동일한 계정이 이미 존재합니다." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name: room.name,
      pinHash: await hashPin(DEFAULT_TABLET_PIN),
      pinPlain: DEFAULT_TABLET_PIN,
      role: "TABLET",
      roomId: room.id,
    },
    include: { room: true },
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        pin: user.pinPlain,
        roomId: user.roomId,
        roomName: user.room?.name ?? null,
      },
    },
    { status: 201 },
  );
}
