import { NextResponse } from "next/server";
import { clearSession, requireSession, verifyPin } from "@/lib/auth";
import { assertRecentPhoneVerification, PhoneVerificationError } from "@/lib/phone-verification";
import { prisma } from "@/lib/prisma";
import { deleteAccountSchema } from "@/lib/validation";

export async function DELETE(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (session.role !== "USER") {
    return NextResponse.json({ error: "탈퇴할 수 없는 계정입니다." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!user.phone) {
    return NextResponse.json(
      { error: "등록된 휴대폰 번호가 없어 탈퇴할 수 없습니다." },
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

  if (!(await verifyPin(parsed.data.currentPin, user.pinHash))) {
    return NextResponse.json({ error: "현재 PIN이 일치하지 않습니다." }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.phoneVerification.deleteMany({ where: { phone: user.phone } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  await clearSession();

  return NextResponse.json({ message: "회원 탈퇴가 완료되었습니다." });
}
