import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { smsVerifySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = smsVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { phone, code } = parsed.data;
  const now = new Date();

  const verification = await prisma.phoneVerification.findFirst({
    where: {
      phone,
      verified: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification || verification.code !== code) {
    return NextResponse.json({ error: "인증번호가 올바르지 않습니다." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || user.role !== "USER") {
    return NextResponse.json({ error: "가입된 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.phoneVerification.update({
    where: { id: verification.id },
    data: { verified: true, verifiedAt: now },
  });

  if (!user.pinPlain) {
    return NextResponse.json({
      name: user.name,
      pin: null,
      message: "PIN 정보가 없습니다. 로그인 후 PIN 변경 메뉴에서 새 PIN을 설정해 주세요.",
    });
  }

  return NextResponse.json({
    name: user.name,
    pin: user.pinPlain,
    message: "계정 정보를 확인했습니다.",
  });
}
