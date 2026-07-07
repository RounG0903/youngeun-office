"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/reservation";

type Room = { id: string; name: string };

type TabletUser = {
  id: string;
  name: string;
  pin: string | null;
  roomId: string | null;
  roomName: string | null;
  createdAt: string;
};

export default function AdminTabletUsersPage() {
  const [users, setUsers] = useState<TabletUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState("");

  async function loadUsers() {
    const [usersRes, roomsRes] = await Promise.all([
      fetch("/api/admin/tablet-users"),
      fetch("/api/admin/rooms"),
    ]);
    const [usersData, roomsData] = await Promise.all([usersRes.json(), roomsRes.json()]);
    setLoading(false);

    if (!usersRes.ok) {
      setError(usersData.error ?? "불러오기 실패");
      return;
    }

    setUsers(usersData.users ?? []);

    const usedRoomIds = new Set(
      (usersData.users as TabletUser[]).map((user) => user.roomId).filter(Boolean),
    );
    const available = (roomsData.rooms ?? []).filter((room: Room) => !usedRoomIds.has(room.id));
    setRooms(available);
    if (available[0]) setRoomId(available[0].id);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/tablet-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "등록 실패");
      return;
    }
    setMessage(
      `${data.user.roomName} 태블릿 계정이 생성되었습니다. (로그인: ${data.user.name} / PIN: ${data.user.pin})`,
    );
    await loadUsers();
  }

  async function handleUpdatePin(userId: string) {
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/tablet-users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: editPin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "PIN 변경 실패");
      return;
    }
    setMessage(`PIN이 변경되었습니다. (${data.user.name}: ${data.user.pin})`);
    setEditingId(null);
    setEditPin("");
    await loadUsers();
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`'${userName}' 태블릿 계정을 삭제하시겠습니까?`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/tablet-users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "삭제 실패");
      return;
    }
    setMessage(data.message);
    await loadUsers();
  }

  if (loading) return <p className="text-[var(--muted)]">태블릿 계정 목록을 불러오는 중...</p>;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold">태블릿 계정</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        회의실마다 태블릿 계정 1개를 생성합니다. 초기 PIN은 0000이며, 로그인 아이디는 회의실명입니다.
      </p>

      {message ? <div className="alert alert-success mt-4">{message}</div> : null}
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="field min-w-[200px]">
          <label htmlFor="tablet-room">회의실</label>
          <select
            id="tablet-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
            disabled={rooms.length === 0}
          >
            {rooms.length === 0 ? (
              <option value="">생성 가능한 회의실 없음</option>
            ) : (
              rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))
            )}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!roomId}>
          태블릿 계정 생성 (PIN 0000)
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-3">회의실</th>
              <th className="py-2 pr-3">로그인 아이디</th>
              <th className="py-2 pr-3">PIN</th>
              <th className="py-2 pr-3">등록일</th>
              <th className="py-2">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[var(--border)]">
                <td className="py-3 pr-3 font-medium">{user.roomName ?? "-"}</td>
                <td className="py-3 pr-3">{user.name}</td>
                <td className="py-3 pr-3">
                  {editingId === user.id ? (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-20 rounded border border-[var(--border)] px-2 py-1"
                    />
                  ) : (
                    <span className="font-mono">{user.pin ?? "-"}</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-[var(--muted)]">
                  {formatDateTime(new Date(user.createdAt))}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {editingId === user.id ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary px-2 py-1 text-xs"
                          onClick={() => handleUpdatePin(user.id)}
                          disabled={editPin.length !== 4}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary px-2 py-1 text-xs"
                          onClick={() => {
                            setEditingId(null);
                            setEditPin("");
                          }}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary px-2 py-1 text-xs"
                        onClick={() => {
                          setEditingId(user.id);
                          setEditPin(user.pin ?? "");
                        }}
                      >
                        PIN 변경
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary px-2 py-1 text-xs text-[var(--danger)]"
                      onClick={() => handleDelete(user.id, user.name)}
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
