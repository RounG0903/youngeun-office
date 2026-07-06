import { prisma } from "@/lib/prisma";
import { addPenaltyDays } from "@/lib/reservation";
import { isTabletCheckinEnabled } from "@/lib/settings";

async function isPenaltyEligibleUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "USER";
}

async function shouldApplyNoShowPenalty(userId: string): Promise<boolean> {
  if (!(await isTabletCheckinEnabled())) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, checkinRequired: true },
  });
  return user?.role === "USER" && user.checkinRequired;
}

export async function applyPenalty(userId: string, from = new Date()) {
  if (!(await isPenaltyEligibleUser(userId))) {
    return null;
  }

  const penaltyUntil = addPenaltyDays(from);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newUntil =
    user?.penaltyUntil && user.penaltyUntil > penaltyUntil ? user.penaltyUntil : penaltyUntil;

  await prisma.user.update({
    where: { id: userId },
    data: { penaltyUntil: newUntil },
  });
  return newUntil;
}

export async function processNoShowPenalties(userId?: string) {
  const now = new Date();
  const globalCheckinEnabled = await isTabletCheckinEnabled();

  const missed = await prisma.reservation.findMany({
    where: {
      status: "ACTIVE",
      checkedInAt: null,
      endTime: { lt: now },
      noShowProcessed: false,
      user: { role: "USER" },
      ...(userId ? { userId } : {}),
    },
    select: {
      id: true,
      userId: true,
      user: { select: { checkinRequired: true } },
    },
  });

  for (const reservation of missed) {
    if (!globalCheckinEnabled || !reservation.user.checkinRequired) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "COMPLETED", noShowProcessed: true },
      });
      continue;
    }

    if (!(await shouldApplyNoShowPenalty(reservation.userId))) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "NO_SHOW", noShowProcessed: true },
      });
      continue;
    }

    const penaltyUntil = addPenaltyDays(now);
    const user = await prisma.user.findUnique({ where: { id: reservation.userId } });
    const newUntil =
      user?.penaltyUntil && user.penaltyUntil > penaltyUntil ? user.penaltyUntil : penaltyUntil;

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "NO_SHOW", noShowProcessed: true },
      }),
      prisma.user.update({
        where: { id: reservation.userId },
        data: { penaltyUntil: newUntil },
      }),
    ]);
  }

  return missed.length;
}

export async function ensurePenaltiesProcessed(userId?: string) {
  await processNoShowPenalties(userId);
}
