import { NextResponse } from "next/server";
import { buildSessionUser, requireSession, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (session.role !== "USER") {
    return NextResponse.json({ error: "닉네임을 변경할 수 없는 계정입니다." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { name } = parsed.data;

  if (name === session.name) {
    return NextResponse.json({ error: "현재 닉네임과 동일합니다." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { name },
  });

  await setSession(buildSessionUser(user));

  return NextResponse.json({
    message: "닉네임이 변경되었습니다.",
    user: { id: user.id, name: user.name },
  });
}
