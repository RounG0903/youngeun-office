import { SolapiMessageService } from "solapi";
import { formatPhone } from "./phone";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export { generateCode as generateVerificationCode };

type SmsProvider = "solapi" | "http" | "dev";

function resolveProvider(): SmsProvider {
  const configured = process.env.SMS_PROVIDER?.toLowerCase();
  if (configured === "solapi") return "solapi";
  if (configured === "http") return "http";

  if (process.env.SMS_API_KEY && process.env.SMS_API_SECRET && process.env.SMS_FROM) {
    return "solapi";
  }
  if (process.env.SMS_API_URL && process.env.SMS_API_KEY) {
    return "http";
  }
  return "dev";
}

function buildVerificationMessage(code: string): string {
  return `[Youngeun Office] 인증번호는 ${code}입니다. 5분 내에 입력해 주세요.`;
}

async function sendViaSolapi(phone: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY;
  const apiSecret = process.env.SMS_API_SECRET;
  const from = process.env.SMS_FROM;

  if (!apiKey || !apiSecret || !from) {
    throw new Error("Solapi 설정이 올바르지 않습니다. SMS_API_KEY, SMS_API_SECRET, SMS_FROM을 확인해 주세요.");
  }

  const messageService = new SolapiMessageService(apiKey, apiSecret);
  await messageService.send({
    to: phone,
    from,
    text: message,
  });
}

async function sendViaHttp(phone: string, message: string): Promise<void> {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("HTTP SMS 설정이 올바르지 않습니다. SMS_API_URL, SMS_API_KEY를 확인해 주세요.");
  }

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
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "SMS 발송에 실패했습니다.");
  }
}

export async function sendVerificationSms(phone: string, code: string): Promise<void> {
  const message = buildVerificationMessage(code);
  const provider = resolveProvider();

  if (provider === "solapi") {
    await sendViaSolapi(phone, message);
    return;
  }

  if (provider === "http") {
    await sendViaHttp(phone, message);
    return;
  }

  console.log(`[SMS DEV] ${formatPhone(phone)} → ${code}`);
}

export function isSmsDevMode(): boolean {
  return resolveProvider() === "dev";
}

export function getSmsProvider(): SmsProvider {
  return resolveProvider();
}
