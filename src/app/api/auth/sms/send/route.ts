import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issuePhoneVerification, PhoneVerificationError } from "@/lib/phone-verification";
import { smsSendSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = smsSendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { phone } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    return NextResponse.json(
      { error: "이미 가입된 휴대폰 번호입니다." },
      { status: 409 },
    );
  }

  try {
    const { code, devMode } = await issuePhoneVerification(phone);
    return NextResponse.json({
      message: "인증번호가 발송되었습니다.",
      ...(devMode ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "문자 발송에 실패했습니다." }, { status: 500 });
  }
}
