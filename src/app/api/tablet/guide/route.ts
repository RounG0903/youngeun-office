import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireTabletSession } from "@/lib/admin";

export async function GET(request: Request) {
  const auth = await requireTabletSession();
  if (auth.error) return auth.error;
  const origin = new URL(request.url).origin;
  const siteUrl = `${origin}/login`;
  const qrDataUrl = await QRCode.toDataURL(siteUrl, { margin: 2, width: 480 });

  return NextResponse.json({
    siteUrl,
    qrDataUrl,
    title: "Youngeun Office",
    description: "교육관 회의실 예약 · 로그인",
  });
}
