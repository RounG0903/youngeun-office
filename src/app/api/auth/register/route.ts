import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, setSession, buildSessionUser } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

const VERIFICATION_WINDOW_MS = 30 * 60_000;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { name, phone, pin } = parsed.data;

  const verified = await prisma.phoneVerification.findFirst({
    where: {
      phone,
      verified: true,
      verifiedAt: { gte: new Date(Date.now() - VERIFICATION_WINDOW_MS) },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!verified) {
    return NextResponse.json(
      { error: "휴대폰 문자 인증을 완료해 주세요." },
      { status: 400 },
    );
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return NextResponse.json(
      { error: "이미 가입된 휴대폰 번호입니다." },
      { status: 409 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { name },
  });

  if (existing) {
    if (existing.role === "TABLET") {
      return NextResponse.json(
        { error: "태블릿 계정은 관리자가 등록합니다." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "이미 가입된 이름입니다. 로그인해 주세요." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      pinHash: await hashPin(pin),
      pinPlain: pin,
      role: "USER",
    },
  });

  await prisma.phoneVerification.deleteMany({ where: { phone } });
  await setSession(buildSessionUser(user));

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
      },
    },
    { status: 201 },
  );
}
