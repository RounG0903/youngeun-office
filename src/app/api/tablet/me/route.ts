import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTabletSession } from "@/lib/admin";
import { isTabletCheckinEnabled } from "@/lib/settings";

export async function GET() {
  const auth = await requireTabletSession();
  if (auth.error) return auth.error;

  const tabletUser = await prisma.user.findUnique({
    where: { id: auth.session.id },
    include: { room: true },
  });

  if (!tabletUser) {
    return NextResponse.json({ error: "태블릿 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  const tabletCheckinEnabled = await isTabletCheckinEnabled();

  return NextResponse.json({
    name: tabletUser.name,
    roomId: tabletUser.roomId,
    roomName: tabletUser.room?.name ?? null,
    tabletCheckinEnabled,
  });
}
