"use client";

import { FormEvent, useEffect, useState } from "react";

type Room = {
  id: string;
  name: string;
  reservationCount: number;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/rooms");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "불러오기 실패");
      return;
    }
    setRooms(data.rooms ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "추가 실패");
      return;
    }
    setName("");
    setMessage("회의실이 추가되었습니다.");
    await load();
  }

  async function handleDelete(id: string, roomName: string) {
    if (!confirm(`'${roomName}' 회의실을 삭제하시겠습니까?`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "삭제 실패");
      return;
    }
    setMessage(data.message);
    await load();
  }

  if (loading) return <p className="text-[var(--muted)]">회의실 목록을 불러오는 중...</p>;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold">회의실 관리</h2>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 회의실명"
          className="min-w-[200px] flex-1 rounded-[10px] border border-[var(--border)] px-3 py-2"
          required
        />
        <button type="submit" className="btn btn-primary">
          회의실 추가
        </button>
      </form>

      {message ? <div className="alert alert-success mt-4">{message}</div> : null}
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {rooms.map((room) => (
          <li key={room.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">{room.name}</div>
              <div className="text-sm text-[var(--muted)]">예약 {room.reservationCount}건</div>
            </div>
            <button
              type="button"
              className="btn btn-secondary px-3 py-1 text-sm text-[var(--danger)]"
              onClick={() => handleDelete(room.id, room.name)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
