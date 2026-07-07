import type { PrismaClient } from "@prisma/client";

export const SERVER_ADMIN_USER_NUMBER = 999999;

export async function assignUserNumbersToExistingUsers(
  prisma: PrismaClient,
): Promise<void> {
  const primaryAdmin =
    (await prisma.user.findUnique({ where: { name: "Youngeun Admin" } })) ??
    (await prisma.user.findFirst({
      where: { isServerAdmin: true },
      orderBy: { createdAt: "asc" },
    }));

  if (primaryAdmin) {
    await prisma.user.update({
      where: { id: primaryAdmin.id },
      data: { userNumber: SERVER_ADMIN_USER_NUMBER },
    });
  }

  const users = await prisma.user.findMany({
    where: { userNumber: null },
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
