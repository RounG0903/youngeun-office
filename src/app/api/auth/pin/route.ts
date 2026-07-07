import { NextResponse } from "next/server";
import { hashPin, requireSession, verifyPin } from "@/lib/auth";
import { assertRecentPhoneVerification, PhoneVerificationError } from "@/lib/phone-verification";
import { prisma } from "@/lib/prisma";
import { changePinSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (session.role !== "USER" && session.role !== "ADMIN" && session.role !== "SUB_ADMIN") {
    return NextResponse.json({ error: "PIN을 변경할 수 없는 계정입니다." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = changePinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { currentPin, newPin } = parsed.data;

  if (currentPin === newPin) {
    return NextResponse.json({ error: "새 PIN은 현재 PIN과 달라야 합니다." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!(await verifyPin(currentPin, user.pinHash))) {
    return NextResponse.json({ error: "현재 PIN이 일치하지 않습니다." }, { status: 401 });
  }

  if (session.role === "USER") {
    if (!user.phone) {
      return NextResponse.json(
        { error: "등록된 휴대폰 번호가 없어 PIN을 변경할 수 없습니다." },
        { status: 400 },
      );
    }

    try {
      await assertRecentPhoneVerification(user.phone);
    } catch (error) {
      if (error instanceof PhoneVerificationError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      return NextResponse.json({ error: "휴대폰 인증이 필요합니다." }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      pinHash: await hashPin(newPin),
      pinPlain: session.role === "USER" ? null : newPin,
    },
  });

  if (session.role === "ADMIN" || session.role === "SUB_ADMIN") {
    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: "admin.update_pin",
      entityType: "User",
      entityId: session.id,
    });
  }

  return NextResponse.json({ message: "PIN이 변경되었습니다." });
}
