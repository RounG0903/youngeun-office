import { prisma } from "@/lib/prisma";
import {
  LEGACY_SERVER_ADMIN_USER_NUMBER,
  MAX_REGULAR_USER_NUMBER,
  SERVER_ADMIN_USER_NUMBER,
  USER_NUMBER_DIGITS,
} from "@/lib/user-number-constants";

export {
  LEGACY_SERVER_ADMIN_USER_NUMBER,
  MAX_REGULAR_USER_NUMBER,
  SERVER_ADMIN_USER_NUMBER,
  USER_NUMBER_DIGITS,
} from "@/lib/user-number-constants";

export function formatUserNumber(userNumber: number): string {
  return String(userNumber).padStart(USER_NUMBER_DIGITS, "0");
}

export function formatUserDisplayName(name: string, userNumber: number): string {
  return `${name}#${formatUserNumber(userNumber)}`;
}

let legacyMigrationPromise: Promise<void> | null = null;

export async function migrateLegacyUserNumbersIfNeeded(): Promise<void> {
  if (!legacyMigrationPromise) {
    legacyMigrationPromise = prisma.user
      .updateMany({
        where: { userNumber: LEGACY_SERVER_ADMIN_USER_NUMBER },
        data: { userNumber: SERVER_ADMIN_USER_NUMBER },
      })
      .then(() => undefined);
  }

  await legacyMigrationPromise;
}

export async function getNextUserNumber(): Promise<number> {
  await migrateLegacyUserNumbersIfNeeded();
  const assigned = await prisma.user.findMany({
    where: { userNumber: { not: null } },
    select: { userNumber: true },
  });

  const taken = new Set(assigned.map((user) => user.userNumber!));
  let candidate = 1;

  while (
    taken.has(candidate) ||
    candidate === SERVER_ADMIN_USER_NUMBER ||
    candidate === LEGACY_SERVER_ADMIN_USER_NUMBER
  ) {
    candidate++;
  }

  if (candidate > MAX_REGULAR_USER_NUMBER) {
    throw new Error("사용자 고유번호를 더 이상 발급할 수 없습니다.");
  }

  return candidate;
}
