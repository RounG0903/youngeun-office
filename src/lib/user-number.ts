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

export async function assignUserNumbersToExistingUsers(): Promise<void> {
  await prisma.user.updateMany({
    where: { isServerAdmin: true },
    data: { userNumber: SERVER_ADMIN_USER_NUMBER },
  });

  const users = await prisma.user.findMany({
    where: {
      isServerAdmin: false,
      userNumber: null,
    },
    orderBy: { createdAt: "asc" },
  });

  const taken = new Set(
    (
      await prisma.user.findMany({
        where: { userNumber: { not: null } },
        select: { userNumber: true },
      })
    ).map((user) => user.userNumber!),
  );

  let candidate = 1;
  for (const user of users) {
    while (taken.has(candidate) || candidate === SERVER_ADMIN_USER_NUMBER) {
      candidate++;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { userNumber: candidate },
    });
    taken.add(candidate);
    candidate++;
  }
}
