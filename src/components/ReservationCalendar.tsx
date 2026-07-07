"use client";

import { useEffect, useMemo, useState } from "react";
import { RoomIcon } from "@/components/RoomIcon";
import { formatDateLabel, shiftDate } from "@/lib/calendar";
import { getMinSelectableDate } from "@/lib/reservation";

type CalendarReservation = {
  id: string;
  timeLabel: string;
  isMine?: boolean;
  title?: string | null;
  userDisplayName?: string;
};

type CalendarRoom = {
  id: string;
  name: string;
  color: string;
  locationDescription: string;
  reservations: CalendarReservation[];
};

type ReservationCalendarProps = {
  apiPath: string;
  showBooker?: boolean;
};

export function ReservationCalendar({ apiPath, showBooker = false }: ReservationCalendarProps) {
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
    fetch(`${apiPath}?date=${date}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
        setRooms(data.rooms ?? []);
        setTotalReservations(data.totalReservations ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [apiPath, date]);

  function getReservationSummary(reservation: CalendarReservation): string {
    if (showBooker) {
      return `${reservation.timeLabel} · ${reservation.title}`;
    }
    if (reservation.isMine && reservation.title) {
      return `${reservation.timeLabel} · ${reservation.title}`;
    }
    return `${reservation.timeLabel} · 예약됨`;
  }

  function getReservationDetail(reservation: CalendarReservation): string {
    if (showBooker && reservation.userDisplayName) {
      return `예약자: ${reservation.userDisplayName}`;
    }
    if (reservation.isMine) {
      return "내 예약";
    }
    return "예약됨";
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">예약 캘린더</h2>
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
            min={getMinSelectableDate()}
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
        <summary className="cursor-pointer text-lg font-semibold">주간 날짜 바로가기</summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {weekDates.map((weekDate) => (
            <button
              key={weekDate}
              type="button"
              className={`ig-pill w-full text-left ${weekDate === date ? "ig-pill-active" : ""}`}
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
                      <details
                        className={`rounded-[10px] border px-3 py-2 ${
                          reservation.isMine ? "highlight-mine" : "border-[var(--border)]"
                        }`}
                      >
                        <summary className="cursor-pointer text-sm font-medium">
                          {getReservationSummary(reservation)}
                        </summary>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {getReservationDetail(reservation)}
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
