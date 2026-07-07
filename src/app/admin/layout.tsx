import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHomePathForRole, getRoleLabel } from "@/lib/roles";
import { formatUserDisplayName } from "@/lib/user-number";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/LogoutButton";

const baseLinks = [
  { href: "/admin/users", label: "회원" },
  { href: "/admin/tablet-users", label: "태블릿" },
  { href: "/admin/rooms", label: "회의실" },
  { href: "/admin/reservations", label: "예약" },
  { href: "/admin/calendar", label: "캘린더" },
];

const serverAdminLinks = [
  { href: "/admin/settings", label: "설정" },
  { href: "/admin/audit", label: "감사" },
  { href: "/admin/roles", label: "권한" },
  { href: "/admin/database", label: "DB" },
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
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-main">
          <Link href="/admin/users" className="admin-brand">
            Youngeun Office
          </Link>
          <p className="admin-subtitle">
            {displayName} · {getRoleLabel(session.role)}
            {isServerAdmin ? " · 서버 관리자" : ""}
          </p>
        </div>
        <LogoutButton className="shrink-0" />
      </header>

      <AdminNav links={links} />

      <div className="admin-content">{children}</div>
    </main>
  );
}
