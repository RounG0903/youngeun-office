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

  await prisma.phoneVerification.update({
    where: { id: verification.id },
    data: { verified: true, verifiedAt: now },
  });

  return NextResponse.json({ message: "휴대폰 인증이 완료되었습니다.", phone });
}
