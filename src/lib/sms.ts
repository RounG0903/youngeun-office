import { formatPhone } from "./phone";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export { generateCode as generateVerificationCode };

export async function sendVerificationSms(phone: string, code: string): Promise<void> {
  const message = `[Youngeun Office] 인증번호는 ${code}입니다. 5분 내에 입력해 주세요.`;
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (apiUrl && apiKey) {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: phone,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error("SMS 발송에 실패했습니다.");
    }
    return;
  }

  console.log(`[SMS DEV] ${formatPhone(phone)} → ${code}`);
}

export function isSmsDevMode(): boolean {
  return !process.env.SMS_API_URL || !process.env.SMS_API_KEY;
}
