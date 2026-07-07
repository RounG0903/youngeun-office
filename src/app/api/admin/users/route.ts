import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin";
import { ensurePenaltiesProcessed } from "@/lib/penalty";
import { formatUserDisplayName } from "@/lib/user-number";

export async function GET() {
  const auth = await requireAdminPermission("users");
  if (auth.error) return auth.error;

  await ensurePenaltiesProcessed();

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    include: {
      _count: { select: { reservations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      userNumber: user.userNumber,
      displayName:
        user.userNumber != null
          ? formatUserDisplayName(user.name, user.userNumber)
          : user.name,
      phone: user.phone,
      role: user.role,
      checkinRequired: user.checkinRequired,
      penaltyUntil: user.penaltyUntil,
      reservationCount: user._count.reservations,
      createdAt: user.createdAt,
    })),
  });
}
