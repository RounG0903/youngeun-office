import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, isSmsDevMode, sendVerificationSms } from "@/lib/sms";
import { smsSendSchema } from "@/lib/validation";

const COOLDOWN_MS = 60_000;
const CODE_TTL_MS = 5 * 60_000;

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

  const recent = await prisma.phoneVerification.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "잠시 후 다시 요청해 주세요. (1분 대기)" },
      { status: 429 },
    );
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.phoneVerification.create({
    data: { phone, code, expiresAt },
  });

  try {
    await sendVerificationSms(phone, code);
  } catch {
    return NextResponse.json({ error: "문자 발송에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    message: "인증번호가 발송되었습니다.",
    ...(isSmsDevMode() ? { devCode: code } : {}),
  });
}
