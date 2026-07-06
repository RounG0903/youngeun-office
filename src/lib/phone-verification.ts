import { prisma } from "./prisma";
import { generateVerificationCode, isSmsDevMode, sendVerificationSms } from "./sms";

const COOLDOWN_MS = 60_000;
const CODE_TTL_MS = 5 * 60_000;
export const VERIFICATION_WINDOW_MS = 30 * 60_000;

export async function assertRecentPhoneVerification(phone: string): Promise<void> {
  const verified = await prisma.phoneVerification.findFirst({
    where: {
      phone,
      verified: true,
      verifiedAt: { gte: new Date(Date.now() - VERIFICATION_WINDOW_MS) },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!verified) {
    throw new PhoneVerificationError("휴대폰 문자 인증을 완료해 주세요.", 400);
  }
}

export async function issuePhoneVerification(phone: string): Promise<{
  code: string;
  devMode: boolean;
}> {
  const recent = await prisma.phoneVerification.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < COOLDOWN_MS) {
    throw new PhoneVerificationError("잠시 후 다시 요청해 주세요. (1분 대기)", 429);
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.phoneVerification.create({
    data: { phone, code, expiresAt },
  });

  try {
    await sendVerificationSms(phone, code);
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : "문자 발송에 실패했습니다.";
    throw new PhoneVerificationError(message, 500);
  }

  return { code, devMode: isSmsDevMode() };
}

export class PhoneVerificationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PhoneVerificationError";
  }
}
