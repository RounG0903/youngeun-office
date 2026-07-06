import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTabletSession } from "@/lib/admin";

export async function GET() {
  const auth = await requireTabletSession();
  if (auth.error) return auth.error;
  const rooms = await prisma.meetingRoom.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json({ rooms });
}
