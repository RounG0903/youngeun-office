import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHomePathForRole, getRoleLabel } from "@/lib/roles";
import { formatUserDisplayName } from "@/lib/user-number";
import { LogoutButton } from "@/components/LogoutButton";

const baseLinks = [
  { href: "/admin/users", label: "회원 관리", desc: "회원 삭제 및 패널티 관리" },
  { href: "/admin/tablet-users", label: "태블릿 계정", desc: "회의실별 태블릿 등록 및 PIN 확인" },
  { href: "/admin/rooms", label: "회의실 관리", desc: "회의실 추가 및 삭제" },
  { href: "/admin/reservations", label: "예약 관리", desc: "예약 추가 및 삭제" },
  { href: "/admin/calendar", label: "예약 캘린더", desc: "날짜별 회의실 예약 현황 조회" },
];

const serverAdminLinks = [
  { href: "/admin/settings", label: "계정 설정", desc: "체크인 활성화 · 관리자 PIN 변경" },
  { href: "/admin/audit", label: "거래 히스토리", desc: "관리자 조작 이력 조회" },
  { href: "/admin/roles", label: "부관리자 관리", desc: "부관리자 권한 부여 및 회수" },
  { href: "/admin/database", label: "DB 관리", desc: "데이터베이스 조회 및 수정" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN" && session.role !== "SUB_ADMIN") {
    redirect(getHomePathForRole(session.role));
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { isServerAdmin: true, userNumber: true, name: true },
  });
  const isServerAdmin = dbUser?.isServerAdmin ?? session.isServerAdmin ?? false;
  const displayName =
    dbUser?.userNumber != null
      ? formatUserDisplayName(dbUser.name, dbUser.userNumber)
      : session.name;
  const links = isServerAdmin ? [...baseLinks, ...serverAdminLinks] : baseLinks;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">관리자</p>
            <h1 className="text-2xl font-bold">Youngeun Office 관리</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {displayName} · {getRoleLabel(session.role)}
              {isServerAdmin ? " (서버 관리자)" : ""}
            </p>
          </div>
          <LogoutButton />
        </div>

        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="card p-4 transition hover:border-blue-200">
              <div className="font-semibold">{link.label}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{link.desc}</div>
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </main>
  );
}
