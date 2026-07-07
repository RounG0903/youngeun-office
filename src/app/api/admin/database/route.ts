import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
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

export async function GET() {
  const auth = await requireAdminPermission("database");
  if (auth.error) return auth.error;

  return NextResponse.json({ tables: ALLOWED_TABLES });
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("database");
  if (auth.error) return auth.error;

  const body = await request.json();
  const table = typeof body.table === "string" ? body.table : "";
  const data = body.data;

  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: "허용되지 않은 테이블입니다." }, { status: 400 });
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "데이터가 올바르지 않습니다." }, { status: 400 });
  }

  let record: { id: string };

  switch (table) {
    case "User":
      record = await prisma.user.create({ data });
      break;
    case "MeetingRoom":
      record = await prisma.meetingRoom.create({ data });
      break;
    case "Reservation":
      record = await prisma.reservation.create({ data });
      break;
    case "SystemConfig":
      record = await prisma.systemConfig.create({ data });
      break;
    case "PhoneVerification":
      record = await prisma.phoneVerification.create({ data });
      break;
    case "AuditLog":
      record = await prisma.auditLog.create({ data });
      break;
  }

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "database.create",
    entityType: table,
    entityId: record.id,
    details: { data },
  });

  return NextResponse.json({ record }, { status: 201 });
}
