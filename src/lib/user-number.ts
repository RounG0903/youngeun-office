import { prisma } from "@/lib/prisma";

export const SERVER_ADMIN_USER_NUMBER = 999999;

export function formatUserNumber(userNumber: number): string {
  return String(userNumber).padStart(6, "0");
}

export function formatUserDisplayName(name: string, userNumber: number): string {
  return `${name}#${formatUserNumber(userNumber)}`;
}

export async function getNextUserNumber(): Promise<number> {
  const assigned = await prisma.user.findMany({
    where: { userNumber: { not: null } },
    select: { userNumber: true },
  });

  const taken = new Set(assigned.map((user) => user.userNumber!));
  let candidate = 1;

  while (taken.has(candidate) || candidate === SERVER_ADMIN_USER_NUMBER) {
    candidate++;
  }

  if (candidate > 999998) {
    throw new Error("사용자 고유번호를 더 이상 발급할 수 없습니다.");
  }

  return candidate;
}
