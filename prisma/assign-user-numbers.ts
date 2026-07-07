import type { PrismaClient } from "@prisma/client";

export const SERVER_ADMIN_USER_NUMBER = 999999;

export async function assignUserNumbersToExistingUsers(
  prisma: PrismaClient,
): Promise<void> {
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
    select: { id: true },
  });

  if (users.length === 0) return;

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
