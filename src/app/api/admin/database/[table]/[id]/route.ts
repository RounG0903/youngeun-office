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

type RouteContext = {
  params: Promise<{ table: string; id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("database");
  if (auth.error) return auth.error;

  const { table, id } = await context.params;
  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: "허용되지 않은 테이블입니다." }, { status: 400 });
  }

  const body = await request.json();
  const data = body.data;

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "데이터가 올바르지 않습니다." }, { status: 400 });
  }

  let before: unknown;
  let record: unknown;

  switch (table) {
    case "User":
      before = await prisma.user.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      record = await prisma.user.update({ where: { id }, data });
      break;
    case "MeetingRoom":
      before = await prisma.meetingRoom.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      record = await prisma.meetingRoom.update({ where: { id }, data });
      break;
    case "Reservation":
      before = await prisma.reservation.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      record = await prisma.reservation.update({ where: { id }, data });
      break;
    case "SystemConfig":
      before = await prisma.systemConfig.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      record = await prisma.systemConfig.update({ where: { id }, data });
      break;
    case "PhoneVerification":
      before = await prisma.phoneVerification.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      record = await prisma.phoneVerification.update({ where: { id }, data });
      break;
    case "AuditLog":
      before = await prisma.auditLog.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      record = await prisma.auditLog.update({ where: { id }, data });
      break;
  }

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "database.update",
    entityType: table,
    entityId: id,
    details: { before, after: data },
  });

  return NextResponse.json({ record });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("database");
  if (auth.error) return auth.error;

  const { table, id } = await context.params;
  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: "허용되지 않은 테이블입니다." }, { status: 400 });
  }

  let before: unknown;

  switch (table) {
    case "User":
      before = await prisma.user.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      await prisma.user.delete({ where: { id } });
      break;
    case "MeetingRoom":
      before = await prisma.meetingRoom.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      await prisma.meetingRoom.delete({ where: { id } });
      break;
    case "Reservation":
      before = await prisma.reservation.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      await prisma.reservation.delete({ where: { id } });
      break;
    case "SystemConfig":
      before = await prisma.systemConfig.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      await prisma.systemConfig.delete({ where: { id } });
      break;
    case "PhoneVerification":
      before = await prisma.phoneVerification.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      await prisma.phoneVerification.delete({ where: { id } });
      break;
    case "AuditLog":
      before = await prisma.auditLog.findUnique({ where: { id } });
      if (!before) return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
      await prisma.auditLog.delete({ where: { id } });
      break;
  }

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "database.delete",
    entityType: table,
    entityId: id,
    details: { before },
  });

  return NextResponse.json({ message: "레코드가 삭제되었습니다." });
}
