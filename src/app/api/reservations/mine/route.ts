import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePenaltiesProcessed } from "@/lib/penalty";
import { requireUserSession } from "@/lib/admin";

export async function GET() {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  await ensurePenaltiesProcessed(session.id);

  const now = new Date();
  const reservations = await prisma.reservation.findMany({
    where: {
      userId: session.id,
      status: "ACTIVE",
      startTime: { gt: now },
    },
    include: { room: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ reservations });
}
