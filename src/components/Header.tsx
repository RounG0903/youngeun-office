import Link from "next/link";
import { getSession } from "@/lib/auth";
import { UserNav, UserTopNav } from "./UserNav";

export async function Header() {
  const session = await getSession();

  if (!session || session.role !== "USER") {
    return (
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
          <Link href="/" className="min-w-0 flex flex-col">
            <span className="ig-gradient-text truncate text-base font-bold sm:text-lg">
              Youngeun Office
            </span>
            <span className="truncate text-xs text-[var(--muted)] sm:text-sm">교육관 회의실 예약</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <Link href="/login" className="btn btn-secondary px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
              로그인
            </Link>
            <Link href="/register" className="btn btn-primary px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
              회원가입
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const { prisma } = await import("@/lib/prisma");
  const { formatDateTime, isUnderPenalty } = await import("@/lib/reservation");
  const { ensurePenaltiesProcessed } = await import("@/lib/penalty");

  await ensurePenaltiesProcessed(session.id);
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  const penaltyUntil = user?.penaltyUntil ?? null;
  const { formatUserDisplayName } = await import("@/lib/user-number");
  const displayName =
    user?.userNumber != null
      ? formatUserDisplayName(user.name, user.userNumber)
      : session.name;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
      {isUnderPenalty(penaltyUntil) ? (
        <div className="bg-[#fff5f5] px-4 py-2 text-center text-sm text-[var(--danger)]">
          패널티 기간 중입니다. {formatDateTime(penaltyUntil!)}까지 예약할 수 없습니다.
        </div>
      ) : null}

      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
        <Link href="/reservations" className="min-w-0 shrink-0 flex flex-col">
          <span className="ig-gradient-text truncate text-base font-bold sm:text-lg">
            Youngeun Office
          </span>
          <span className="truncate text-xs text-[var(--muted)] sm:text-sm">교육관 회의실 예약</span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <UserTopNav />
          <UserNav userName={displayName} />
        </div>
      </div>
    </header>
  );
}
