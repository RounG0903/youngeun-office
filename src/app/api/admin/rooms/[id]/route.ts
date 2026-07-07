import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin";
import { isValidRoomColor } from "@/lib/room";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("rooms");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();

  const room = await prisma.meetingRoom.findUnique({ where: { id } });
  if (!room) {
    return NextResponse.json({ error: "회의실을 찾을 수 없습니다." }, { status: 404 });
  }

  const data: { locationDescription?: string; color?: string } = {};

  if (typeof body.locationDescription === "string") {
    data.locationDescription = body.locationDescription.trim();
  }

  if (typeof body.color === "string") {
    if (!isValidRoomColor(body.color)) {
      return NextResponse.json({ error: "색상 형식이 올바르지 않습니다." }, { status: 400 });
    }
    data.color = body.color;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
  }

  const updated = await prisma.meetingRoom.update({
    where: { id },
    data,
  });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "room.update",
    entityType: "MeetingRoom",
    entityId: id,
    details: { name: room.name, ...data },
  });

  return NextResponse.json({ room: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("rooms");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const room = await prisma.meetingRoom.findUnique({ where: { id } });

  if (!room) {
    return NextResponse.json({ error: "회의실을 찾을 수 없습니다." }, { status: 404 });
  }

  const blockingReservation = await prisma.reservation.findFirst({
    where: {
      roomId: id,
      status: "ACTIVE",
      endTime: { gt: new Date() },
    },
  });

  if (blockingReservation) {
    return NextResponse.json(
      { error: "예정된 예약이 있어 삭제할 수 없습니다." },
      { status: 400 },
    );
  }

  await prisma.reservation.deleteMany({
    where: { roomId: id, status: "CANCELLED" },
  });

  await prisma.user.deleteMany({ where: { roomId: id, role: "TABLET" } });
  await prisma.meetingRoom.delete({ where: { id } });

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "room.delete",
    entityType: "MeetingRoom",
    entityId: id,
    details: { name: room.name },
  });

  return NextResponse.json({ message: "회의실이 삭제되었습니다." });
}
