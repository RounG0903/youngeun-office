import { NextResponse } from "next/server";
import { clearSession, getSession, verifyPin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession();

  if (session?.role === "TABLET") {
    const body = await request.json().catch(() => ({}));
    const pin = typeof body.pin === "string" ? body.pin : "";

    if (!pin) {
      return NextResponse.json({ error: "PIN을 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !(await verifyPin(pin, user.pinHash))) {
      return NextResponse.json({ error: "PIN이 일치하지 않습니다." }, { status: 401 });
    }
  }

  await clearSession();
  return NextResponse.json({ ok: true });
}
