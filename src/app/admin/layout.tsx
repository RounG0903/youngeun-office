import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/roles";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/admin/users", label: "회원 관리", desc: "회원 삭제 및 패널티 관리" },
  { href: "/admin/settings", label: "계정 설정", desc: "체크인 활성화 · 관리자 PIN 변경" },
  { href: "/admin/tablet-users", label: "태블릿 계정", desc: "회의실별 태블릿 등록 및 PIN 확인" },
  { href: "/admin/rooms", label: "회의실 관리", desc: "회의실 추가 및 삭제" },
  { href: "/admin/reservations", label: "예약 관리", desc: "예약 추가 및 삭제" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect(getHomePathForRole(session.role));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">관리자</p>
          <h1 className="text-2xl font-bold">Youngeun Office 관리</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{session.name}</p>
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
