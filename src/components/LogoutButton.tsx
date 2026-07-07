"use client";

import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  className?: string;
  onLoggedOut?: () => void;
};

export function LogoutButton({ className = "", onLoggedOut }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onLoggedOut?.();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`btn btn-logout px-3 py-2 text-sm ${className}`.trim()}
    >
      로그아웃
    </button>
  );
}
