"use client";

import { FormEvent, useEffect, useState } from "react";
import { RoomIcon } from "@/components/RoomIcon";
import { ROOM_COLOR_PALETTE } from "@/lib/room";

type Room = {
  id: string;
  name: string;
  locationDescription: string;
  color: string;
  reservationCount: number;
  hasTabletAccount: boolean;
  checkinEnabled: boolean;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

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
      body: JSON.stringify({ name, locationDescription }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "추가 실패");
      return;
    }
    setName("");
    setLocationDescription("");
    setMessage("회의실이 추가되었습니다.");
    await load();
  }

  async function handleSave(room: Room) {
    setSavingId(room.id);
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationDescription: room.locationDescription,
        color: room.color,
      }),
    });
    const data = await res.json();
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "저장 실패");
      return;
    }
    setMessage(`'${room.name}' 정보가 저장되었습니다.`);
    await load();
  }

  function updateRoom(id: string, patch: Partial<Room>) {
    setRooms((prev) => prev.map((room) => (room.id === id ? { ...room, ...patch } : room)));
  }

  async function handleDelete(id: string, roomName: string) {
    if (!confirm(`'${roomName}' 회의실을 삭제하시겠습니까?\n취소된 예약은 함께 삭제됩니다.`)) return;
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

      <form onSubmit={handleAdd} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
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
        </div>
        <input
          value={locationDescription}
          onChange={(e) => setLocationDescription(e.target.value)}
          placeholder="위치 설명 (예: 2층 복도 끝)"
          className="w-full rounded-[10px] border border-[var(--border)] px-3 py-2"
        />
      </form>

      {message ? <div className="alert alert-success mt-4">{message}</div> : null}
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {rooms.map((room) => (
          <li key={room.id} className="space-y-3 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <RoomIcon color={room.color} size={14} />
                <div className="font-medium">{room.name}</div>
              </div>
              <button
                type="button"
                className="btn btn-secondary px-3 py-1 text-sm text-[var(--danger)]"
                onClick={() => handleDelete(room.id, room.name)}
              >
                삭제
              </button>
            </div>

            <p className="text-sm text-[var(--muted)]">
              예약 {room.reservationCount}건 · 체크인{" "}
              {room.checkinEnabled ? "활성" : room.hasTabletAccount ? "비활성" : "태블릿 없음"}
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium">위치 설명</label>
              <input
                value={room.locationDescription}
                onChange={(e) => updateRoom(room.id, { locationDescription: e.target.value })}
                placeholder="회의실 위치 안내"
                className="w-full rounded-[10px] border border-[var(--border)] px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">아이콘 색상</label>
              <div className="flex flex-wrap items-center gap-2">
                {ROOM_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`rounded-full p-0.5 ${room.color === color ? "ring-2 ring-[var(--primary)] ring-offset-2" : ""}`}
                    onClick={() => updateRoom(room.id, { color })}
                    aria-label={`색상 ${color}`}
                  >
                    <RoomIcon color={color} size={24} />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary text-sm"
              disabled={savingId === room.id}
              onClick={() => handleSave(room)}
            >
              {savingId === room.id ? "저장 중..." : "저장"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
