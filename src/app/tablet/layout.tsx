import "./tablet.css";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/roles";

export default async function TabletLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/tablet");
  if (session.role !== "TABLET") redirect(getHomePathForRole(session.role));

  return <div className="tablet-body">{children}</div>;
}
