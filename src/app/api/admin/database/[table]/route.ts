import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin";

const ALLOWED_TABLES = [
  "User",
  "MeetingRoom",
  "Reservation",
  "SystemConfig",
  "PhoneVerification",
  "AuditLog",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

type RouteContext = {
  params: Promise<{ table: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("database");
  if (auth.error) return auth.error;

  const { table } = await context.params;
  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: "허용되지 않은 테이블입니다." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  let records: unknown[];
  let total: number;

  switch (table) {
    case "User":
      [records, total] = await Promise.all([
        prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
        prisma.user.count(),
      ]);
      break;
    case "MeetingRoom":
      [records, total] = await Promise.all([
        prisma.meetingRoom.findMany({ orderBy: { name: "asc" }, take: limit, skip: offset }),
        prisma.meetingRoom.count(),
      ]);
      break;
    case "Reservation":
      [records, total] = await Promise.all([
        prisma.reservation.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
        prisma.reservation.count(),
      ]);
      break;
    case "SystemConfig":
      [records, total] = await Promise.all([
        prisma.systemConfig.findMany({ take: limit, skip: offset }),
        prisma.systemConfig.count(),
      ]);
      break;
    case "PhoneVerification":
      [records, total] = await Promise.all([
        prisma.phoneVerification.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
        prisma.phoneVerification.count(),
      ]);
      break;
    case "AuditLog":
      [records, total] = await Promise.all([
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
        prisma.auditLog.count(),
      ]);
      break;
  }

  return NextResponse.json({ records, total });
}
