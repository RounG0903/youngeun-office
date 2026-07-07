import { Header } from "@/components/Header";
import { UserAppShell } from "@/components/nav/UserAppShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <UserAppShell>{children}</UserAppShell>
    </>
  );
}
