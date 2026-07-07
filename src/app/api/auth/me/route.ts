import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePenaltiesProcessed } from "@/lib/penalty";
import { isUnderPenalty } from "@/lib/reservation";
import { formatUserDisplayName } from "@/lib/user-number";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  if (session.role === "USER") {
    await ensurePenaltiesProcessed(session.id);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const displayName =
    user.userNumber != null
      ? formatUserDisplayName(user.name, user.userNumber)
      : user.name;

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      userNumber: user.userNumber,
      displayName,
      role: user.role,
      penaltyUntil: user.penaltyUntil,
      isUnderPenalty: isUnderPenalty(user.penaltyUntil),
    },
  });
}
