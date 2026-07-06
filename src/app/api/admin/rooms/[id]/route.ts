import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const room = await prisma.meetingRoom.findUnique({
    where: { id },
    include: {
      reservations: {
        where: { status: "ACTIVE", endTime: { gt: new Date() } },
        take: 1,
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "회의실을 찾을 수 없습니다." }, { status: 404 });
  }

  if (room.reservations.length > 0) {
    return NextResponse.json(
      { error: "예정된 예약이 있어 삭제할 수 없습니다." },
      { status: 400 },
    );
  }

  await prisma.user.deleteMany({ where: { roomId: id, role: "TABLET" } });
  await prisma.meetingRoom.delete({ where: { id } });
  return NextResponse.json({ message: "회의실이 삭제되었습니다." });
}
