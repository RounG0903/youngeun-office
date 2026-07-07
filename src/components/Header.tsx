import Link from "next/link";
import { getSession } from "@/lib/auth";
import { PlusIcon } from "./nav/NavIcons";

export async function Header() {
  const session = await getSession();

  if (!session || session.role !== "USER") {
    return (
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-[935px] items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="ig-gradient-text text-xl font-bold tracking-tight">
            Youngeun Office
          </Link>
          <nav className="flex shrink-0 items-center gap-2 text-sm">
            <Link href="/login" className="btn btn-primary px-4 py-1.5 text-sm">
              로그인
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const { formatDateTime, isUnderPenalty } = await import("@/lib/reservation");
  const { ensurePenaltiesProcessed } = await import("@/lib/penalty");
  const { prisma } = await import("@/lib/prisma");

  await ensurePenaltiesProcessed(session.id);
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  const penaltyUntil = user?.penaltyUntil ?? null;

  return (
    <>
      {isUnderPenalty(penaltyUntil) ? (
        <div className="bg-[#fff5f5] px-4 py-2 text-center text-sm text-[var(--danger)]">
          패널티 기간 중입니다. {formatDateTime(penaltyUntil!)}까지 예약할 수 없습니다.
        </div>
      ) : null}

      <header className="ig-mobile-header relative lg:hidden">
        <span className="w-10" aria-hidden />
        <Link href="/reservations" className="ig-mobile-header-logo ig-gradient-text">
          Youngeun Office
        </Link>
        <Link href="/reservations/new" className="ig-mobile-header-action" aria-label="새 예약">
          <PlusIcon className="h-6 w-6" />
        </Link>
      </header>
    </>
  );
}
