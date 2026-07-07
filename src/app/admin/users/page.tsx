"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/reservation";

type User = {
  id: string;
  name: string;
  displayName: string;
  phone: string | null;
  checkinRequired: boolean;
  reservationCount: number;
  penaltyUntil: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "불러오기 실패");
      return;
    }
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleAction(userId: string, action: string) {
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "작업 실패");
      return;
    }
    setMessage(data.message);
    await loadUsers();
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`'${name}' 회원을 삭제하시겠습니까?`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "삭제 실패");
      return;
    }
    setMessage(data.message);
    await loadUsers();
  }

  if (loading) return <p className="text-[var(--muted)]">회원 목록을 불러오는 중...</p>;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold">회원 관리</h2>

      {message ? <div className="alert alert-success mt-4">{message}</div> : null}
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-3">이름</th>
              <th className="py-2 pr-3">휴대폰</th>
              <th className="py-2 pr-3">체크인</th>
              <th className="py-2 pr-3">예약 수</th>
              <th className="py-2 pr-3">패널티</th>
              <th className="py-2">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[var(--border)]">
                <td className="py-3 pr-3">{user.displayName}</td>
                <td className="py-3 pr-3">{user.phone ?? "-"}</td>
                <td className="py-3 pr-3">
                  <span className={user.checkinRequired ? "" : "text-[var(--muted)]"}>
                    {user.checkinRequired ? "필요" : "면제"}
                  </span>
                </td>
                <td className="py-3 pr-3">{user.reservationCount}</td>
                <td className="py-3 pr-3">
                  {user.penaltyUntil && new Date(user.penaltyUntil) > new Date()
                    ? formatDateTime(new Date(user.penaltyUntil))
                    : "-"}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary px-2 py-1 text-xs"
                      onClick={() => handleAction(user.id, "toggle_checkin_required")}
                    >
                      {user.checkinRequired ? "체크인 면제" : "체크인 필요"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary px-2 py-1 text-xs"
                      onClick={() => handleAction(user.id, "apply_penalty")}
                    >
                      패널티
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary px-2 py-1 text-xs"
                      onClick={() => handleAction(user.id, "clear_penalty")}
                    >
                      패널티 해제
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary px-2 py-1 text-xs text-[var(--danger)]"
                      onClick={() => handleDelete(user.id, user.displayName)}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
