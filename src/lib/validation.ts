import { z } from "zod";
import { normalizePhone } from "./phone";

const phoneSchema = z
  .string()
  .min(1, "휴대폰 번호를 입력해 주세요.")
  .refine((value) => normalizePhone(value) !== null, {
    message: "올바른 휴대폰 번호를 입력해 주세요. (예: 01012345678)",
  })
  .transform((value) => normalizePhone(value)!);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상이어야 합니다.").max(50),
  phone: phoneSchema,
  pin: z.string().regex(/^\d{4}$/, "PIN은 숫자 4자리여야 합니다."),
});

export const loginSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  pin: z.string().min(4, "PIN을 입력해 주세요."),
});

export const smsSendSchema = z.object({
  phone: phoneSchema,
});

export const smsVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, "인증번호는 6자리입니다."),
});

export const changePinSchema = z.object({
  currentPin: z.string().min(4, "현재 PIN을 입력해 주세요."),
  newPin: z.string().regex(/^\d{4}$/, "새 PIN은 숫자 4자리여야 합니다."),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "닉네임은 2자 이상이어야 합니다.").max(50),
});

export const deleteAccountSchema = z.object({
  currentPin: z.string().min(4, "현재 PIN을 입력해 주세요."),
});

export const reservationSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(100),
  roomId: z.string().min(1, "회의실을 선택해 주세요."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "시작 시간을 선택해 주세요."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "종료 시간을 선택해 주세요."),
});
