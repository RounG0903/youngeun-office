import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePenaltiesProcessed } from "@/lib/penalty";
import { requireUserSession } from "@/lib/admin";

export async function GET() {
  const auth = await requireUserSession();
  if (auth.error) return auth.error;
  const session = auth.session!;

  await ensurePenaltiesProcessed(session.id);

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.id },
    include: { room: true },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({ reservations });
}
