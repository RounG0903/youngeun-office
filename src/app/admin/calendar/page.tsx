"use client";

import { useEffect, useMemo, useState } from "react";
import { RoomIcon } from "@/components/RoomIcon";
import { getMinSelectableDate } from "@/lib/reservation";

type CalendarReservation = {
  id: string;
  title: string;
  timeLabel: string;
  userDisplayName: string;
};

type CalendarRoom = {
  id: string;
  name: string;
  color: string;
  locationDescription: string;
  reservations: CalendarReservation[];
};

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1, day + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(value);
}

export default function AdminCalendarPage() {
  const [date, setDate] = useState(getMinSelectableDate());
  const [rooms, setRooms] = useState<CalendarRoom[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => shiftDate(date, index - 3));
  }, [date]);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/calendar?date=${date}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
        setRooms(data.rooms ?? []);
        setTotalReservations(data.totalReservations ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold">예약 캘린더</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          날짜별 회의실 예약 현황을 펼쳐서 확인할 수 있습니다.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setDate(shiftDate(date, -1))}>
            이전 날
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-[10px] border border-[var(--border)] px-3 py-2"
          />
          <button type="button" className="btn btn-secondary" onClick={() => setDate(getMinSelectableDate())}>
            오늘
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setDate(shiftDate(date, 1))}>
            다음 날
          </button>
        </div>

        <p className="mt-3 text-sm font-medium">{formatDateLabel(date)}</p>
      </div>

      <details className="card p-6" open>
        <summary className="cursor-pointer text-lg font-semibold">
          주간 날짜 바로가기
        </summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {weekDates.map((weekDate) => (
            <button
              key={weekDate}
              type="button"
              className={`rounded-[10px] border px-3 py-2 text-left text-sm ${
                weekDate === date
                  ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)]"
                  : "border-[var(--border)]"
              }`}
              onClick={() => setDate(weekDate)}
            >
              {formatDateLabel(weekDate)}
            </button>
          ))}
        </div>
      </details>

      <details className="card p-6" open>
        <summary className="cursor-pointer text-lg font-semibold">
          일자 요약 · 총 {totalReservations}건
        </summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] px-3 py-2 text-sm"
            >
              <RoomIcon color={room.color} size={10} />
              <span className="font-medium">{room.name}</span>
              <span className="text-[var(--muted)]">{room.reservations.length}건</span>
            </div>
          ))}
        </div>
      </details>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {loading ? <p className="text-[var(--muted)]">캘린더를 불러오는 중...</p> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {rooms.map((room) => (
            <details key={room.id} className="card p-5" open={room.reservations.length > 0}>
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <RoomIcon color={room.color} size={12} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{room.name}</div>
                  {room.locationDescription ? (
                    <div className="text-sm text-[var(--muted)]">{room.locationDescription}</div>
                  ) : null}
                </div>
                <span className="badge badge-muted">{room.reservations.length}건</span>
              </summary>

              {room.reservations.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">예약이 없습니다.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {room.reservations.map((reservation) => (
                    <li key={reservation.id}>
                      <details className="rounded-[10px] border border-[var(--border)] px-3 py-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          {reservation.timeLabel} · {reservation.title}
                        </summary>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          예약자: {reservation.userDisplayName}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
