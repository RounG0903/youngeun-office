import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("audit");
  if ("error" in auth && auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({ logs, total });
}
