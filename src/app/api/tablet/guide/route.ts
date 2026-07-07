import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireTabletSession } from "@/lib/admin";
import { getPublicLoginUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const auth = await requireTabletSession();
  if (auth.error) return auth.error;
  const siteUrl = getPublicLoginUrl(request);
  const qrDataUrl = await QRCode.toDataURL(siteUrl, { margin: 2, width: 480 });

  return NextResponse.json({
    siteUrl,
    qrDataUrl,
    title: "Youngeun Office",
    description: "교육관 회의실 예약 · 로그인",
  });
}
