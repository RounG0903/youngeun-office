import type { PrismaClient } from "@prisma/client";
import {
  LEGACY_SERVER_ADMIN_USER_NUMBER,
  MAX_REGULAR_USER_NUMBER,
  SERVER_ADMIN_USER_NUMBER,
} from "../src/lib/user-number-constants";

export {
  LEGACY_SERVER_ADMIN_USER_NUMBER,
  MAX_REGULAR_USER_NUMBER,
  SERVER_ADMIN_USER_NUMBER,
} from "../src/lib/user-number-constants";

async function migrateLegacyAdminUserNumber(prisma: PrismaClient): Promise<void> {
  await prisma.user.updateMany({
    where: { userNumber: LEGACY_SERVER_ADMIN_USER_NUMBER },
    data: { userNumber: SERVER_ADMIN_USER_NUMBER },
  });
}

export async function assignUserNumbersToExistingUsers(
  prisma: PrismaClient,
): Promise<void> {
  await migrateLegacyAdminUserNumber(prisma);

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

    await prisma.user.update({
      where: { id: user.id },
      data: { userNumber: candidate },
    });
    taken.add(candidate);
    candidate++;
  }
}
