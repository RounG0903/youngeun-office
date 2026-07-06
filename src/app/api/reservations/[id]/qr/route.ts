import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCheckinUrl } from "@/lib/session";
import { requireAdminSession } from "@/lib/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { room: true },
  });

  if (!reservation || reservation.status !== "ACTIVE") {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const checkinUrl = await getCheckinUrl(reservation.id, origin);
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    margin: 2,
    width: 320,
  });

  return NextResponse.json({
    reservation: {
      id: reservation.id,
      title: reservation.title,
      roomName: reservation.room.name,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      checkedInAt: reservation.checkedInAt,
    },
    checkinUrl,
    qrDataUrl,
  });
}
