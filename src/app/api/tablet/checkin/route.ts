import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCheckinUrl } from "@/lib/session";
import { ensurePenaltiesProcessed } from "@/lib/penalty";
import { requireTabletSession } from "@/lib/admin";
import { isRoomCheckinEnabled } from "@/lib/settings";
import { formatUserDisplayName } from "@/lib/user-number";
import { getPublicSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const auth = await requireTabletSession();
  if (auth.error) return auth.error;

  const tabletUser = await prisma.user.findUnique({
    where: { id: auth.session.id },
    include: { room: true },
  });

  if (!tabletUser?.roomId) {
    return NextResponse.json({
      checkinEnabled: false,
      reservation: null,
      message: "연결된 회의실이 없는 태블릿 계정입니다.",
    });
  }

  const checkinEnabled = await isRoomCheckinEnabled(tabletUser.roomId);
  if (!checkinEnabled) {
    return NextResponse.json({
      checkinEnabled: false,
      reservation: null,
      message: "태블릿 체크인이 비활성화되어 있습니다.",
    });
  }

  await ensurePenaltiesProcessed();

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  const reservation = await prisma.reservation.findFirst({
    where: {
      status: "ACTIVE",
      checkedInAt: null,
      roomId: tabletUser.roomId,
      startTime: { lte: windowEnd },
      endTime: { gt: now },
    },
    include: {
      room: true,
      user: true,
    },
    orderBy: { startTime: "asc" },
  });

  if (!reservation) {
    return NextResponse.json({
      checkinEnabled: true,
      roomName: tabletUser.room?.name,
      reservation: null,
      message: "현재 체크인 대기 중인 예약이 없습니다.",
    });
  }

  const siteUrl = getPublicSiteUrl(request);
  const checkinUrl = await getCheckinUrl(reservation.id, siteUrl);
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, { margin: 2, width: 480 });

  return NextResponse.json({
    checkinEnabled: true,
    roomName: tabletUser.room?.name,
    reservation: {
      id: reservation.id,
      title: reservation.title,
      roomName: reservation.room.name,
      userName:
        reservation.user.userNumber != null
          ? formatUserDisplayName(reservation.user.name, reservation.user.userNumber)
          : reservation.user.name,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    },
    checkinUrl,
    qrDataUrl,
  });
}
