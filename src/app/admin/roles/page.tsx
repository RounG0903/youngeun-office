"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
};

export default function AdminRolesPage() {
  const [subAdmins, setSubAdmins] = useState<AdminUser[]>([]);
  const [candidates, setCandidates] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/roles");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "불러오기 실패");
      return;
    }
    setSubAdmins(data.subAdmins ?? []);
    setCandidates(data.candidates ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function grantSubAdmin(userId: string, name: string) {
    if (!confirm(`'${name}' 회원에게 부관리자 권한을 부여하시겠습니까?`)) return;
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "부여 실패");
      return;
    }
    setMessage(data.message);
    await load();
  }

  async function revokeSubAdmin(userId: string, name: string) {
    if (!confirm(`'${name}' 회원의 부관리자 권한을 회수하시겠습니까?`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/roles?userId=${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "회수 실패");
      return;
    }
    setMessage(data.message);
    await load();
  }

  if (loading) return <p className="text-[var(--muted)]">부관리자 목록을 불러오는 중...</p>;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold">부관리자 관리</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          부관리자는 회원·회의실·예약·태블릿 관리가 가능합니다. DB 조회/수정 및 역할 부여는 서버 관리자만 가능합니다.
        </p>
        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}

        <h3 className="mt-6 font-semibold">현재 부관리자</h3>
        {subAdmins.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">부관리자가 없습니다.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {subAdmins.map((user) => (
              <li key={user.id} className="flex items-center justify-between rounded-[10px] border border-[var(--border)] px-3 py-2">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-[var(--muted)]">{user.phone ?? "전화번호 없음"}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary px-2 py-1 text-xs text-[var(--danger)]"
                  onClick={() => revokeSubAdmin(user.id, user.name)}
                >
                  권한 회수
                </button>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mt-6 font-semibold">부관리자 지정 가능 회원</h3>
        {candidates.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">지정 가능한 회원이 없습니다.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {candidates.map((user) => (
              <li key={user.id} className="flex items-center justify-between rounded-[10px] border border-[var(--border)] px-3 py-2">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-[var(--muted)]">{user.phone ?? "전화번호 없음"}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary px-2 py-1 text-xs"
                  onClick={() => grantSubAdmin(user.id, user.name)}
                >
                  부관리자 부여
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
