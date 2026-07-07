import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin";
import { logAdminAction } from "@/lib/audit";
import { getSystemConfig, setTabletCheckinEnabled } from "@/lib/settings";

export async function GET() {
  const auth = await requireAdminPermission("settings");
  if (auth.error) return auth.error;

  const config = await getSystemConfig();
  return NextResponse.json({
    tabletCheckinEnabled: config.tabletCheckinEnabled,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminPermission("settings");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (typeof body.tabletCheckinEnabled !== "boolean") {
    return NextResponse.json({ error: "설정 값이 올바르지 않습니다." }, { status: 400 });
  }

  const config = await setTabletCheckinEnabled(body.tabletCheckinEnabled);

  await logAdminAction({
    actorId: auth.session.id,
    actorName: auth.session.name,
    actorRole: auth.session.role,
    action: "settings.update_checkin",
    entityType: "SystemConfig",
    entityId: "default",
    details: { tabletCheckinEnabled: config.tabletCheckinEnabled },
  });

  return NextResponse.json({
    message: config.tabletCheckinEnabled
      ? "태블릿 체크인이 활성화되었습니다."
      : "태블릿 체크인이 비활성화되었습니다. 모든 사용자가 체크인 없이 예약을 이용합니다.",
    tabletCheckinEnabled: config.tabletCheckinEnabled,
  });
}
