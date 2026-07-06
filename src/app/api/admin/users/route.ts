import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { ensurePenaltiesProcessed } from "@/lib/penalty";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  await ensurePenaltiesProcessed();

  const users = await prisma.user.findMany({
    where: { role: { notIn: ["ADMIN", "TABLET"] } },
    include: {
      _count: { select: { reservations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      checkinRequired: user.checkinRequired,
      penaltyUntil: user.penaltyUntil,
      reservationCount: user._count.reservations,
      createdAt: user.createdAt,
    })),
  });
}
