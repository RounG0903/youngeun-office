import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { issuePhoneVerification, PhoneVerificationError } from "@/lib/phone-verification";
import { prisma } from "@/lib/prisma";

export async function POST() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (session.role !== "USER") {
    return NextResponse.json({ error: "일반 사용자만 인증번호를 요청할 수 있습니다." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { phone: true },
  });

  if (!user?.phone) {
    return NextResponse.json(
      { error: "등록된 휴대폰 번호가 없습니다. 관리자에게 문의해 주세요." },
      { status: 400 },
    );
  }

  try {
    const { code, devMode } = await issuePhoneVerification(user.phone);
    return NextResponse.json({
      message: "인증번호가 발송되었습니다.",
      phone: user.phone,
      maskedPhone: formatPhone(user.phone),
      ...(devMode ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "문자 발송에 실패했습니다." }, { status: 500 });
  }
}
