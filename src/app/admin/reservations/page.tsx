"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RoomIcon } from "@/components/RoomIcon";
import { TimeRangePicker } from "@/components/TimeRangePicker";
import {
  CLOSE_HOUR,
  doesRangeOverlapBooked,
  filterEndTimeSlots,
  filterPastTimeSlots,
  formatTimeRange,
  generateTimeSlots,
  getMinSelectableDate,
  getReservationStatusLabel,
} from "@/lib/reservation";

type Room = { id: string; name: string; color: string };
type Reservation = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  room: { name: string; color: string };
  user: { displayName: string };
};

export default function AdminReservationsPage() {
  const allSlots = useMemo(() => generateTimeSlots(), []);
  const closeTime = `${String(CLOSE_HOUR).padStart(2, "0")}:00`;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(getMinSelectableDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookedReservations, setBookedReservations] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const startSlots = filterPastTimeSlots(date, allSlots, now);
    if (startTime && !startSlots.includes(startTime)) {
      setStartTime("");
      setEndTime("");
      return;
    }
    if (startTime && bookedSlots.includes(startTime)) {
      setStartTime("");
      setEndTime("");
    }
  }, [allSlots, bookedSlots, date, now, startTime]);

  useEffect(() => {
    if (!startTime) {
      setEndTime("");
      return;
    }
    const endSlots = [...filterEndTimeSlots(startTime, allSlots), closeTime];
    const parsedReservations = bookedReservations.map((reservation) => ({
      startTime: new Date(reservation.startTime),
      endTime: new Date(reservation.endTime),
    }));
    if (
      endTime &&
      (!endSlots.includes(endTime) ||
        doesRangeOverlapBooked(startTime, endTime, parsedReservations))
    ) {
      setEndTime("");
    }
  }, [allSlots, bookedReservations, closeTime, endTime, startTime]);

  useEffect(() => {
    if (!roomId || !date) return;

    fetch(`/api/reservations/availability?roomId=${roomId}&date=${date}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setBookedSlots(data.bookedSlots ?? []);
        setBookedReservations(data.reservations ?? []);
      });
  }, [roomId, date]);

  async function load() {
    const [resRes, roomsRes, meRes] = await Promise.all([
      fetch("/api/admin/reservations"),
      fetch("/api/admin/rooms"),
      fetch("/api/auth/me"),
    ]);
    const [resData, roomsData, meData] = await Promise.all([
      resRes.json(),
      roomsRes.json(),
      meRes.json(),
    ]);
    setLoading(false);
    if (!resRes.ok) {
      setError(resData.error ?? "불러오기 실패");
      return;
    }
    setReservations(resData.reservations ?? []);
    setRooms(roomsData.rooms ?? []);
    if (meData.user?.displayName) setAdminDisplayName(meData.user.displayName);
    if (roomsData.rooms?.[0]) setRoomId(roomsData.rooms[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, roomId, date, startTime, endTime }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "추가 실패");
      return;
    }
    setTitle("");
    setMessage("예약이 추가되었습니다.");
    await load();
  }

  async function handleDelete(id: string, reservationTitle: string) {
    if (!confirm(`'${reservationTitle}' 예약을 삭제(취소)하시겠습니까?`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "삭제 실패");
      return;
    }
    setMessage(data.message);
    await load();
  }

  if (loading) return <p className="text-[var(--muted)]">예약 목록을 불러오는 중...</p>;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold">예약 추가</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          예약자: {adminDisplayName || "관리자"} (본인 계정으로 등록됩니다)
        </p>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="rounded-[10px] border border-[var(--border)] px-3 py-2 md:col-span-2"
            required
          />
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-[10px] border border-[var(--border)] px-3 py-2"
            required
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            min={getMinSelectableDate()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-[10px] border border-[var(--border)] px-3 py-2 md:col-span-2"
            required
          />
          <div className="min-w-0 md:col-span-2">
            <TimeRangePicker
              date={date}
              startTime={startTime}
              endTime={endTime}
              bookedSlots={bookedSlots}
              bookedReservations={bookedReservations}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
            />
          </div>
          <button type="submit" className="btn btn-primary md:col-span-2">
            예약 추가
          </button>
        </form>
      </div>

      <div className="card min-w-0 p-6">
        <h2 className="text-xl font-bold">예약 관리</h2>
        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}

        <div className="mt-4 space-y-3 md:hidden">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="rounded-[10px] border border-[var(--border)] p-4">
              <div className="font-semibold">{reservation.title}</div>
              <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                <p>예약자: {reservation.user.displayName}</p>
                <p className="flex items-center gap-2">
                  <RoomIcon color={reservation.room.color} size={10} />
                  {reservation.room.name}
                </p>
                <p>
                  {formatTimeRange(
                    new Date(reservation.startTime),
                    new Date(reservation.endTime),
                  )}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={`badge ${
                    reservation.status === "NO_SHOW"
                      ? "badge-danger"
                      : reservation.status === "COMPLETED"
                        ? "badge-success"
                        : "badge-muted"
                  }`}
                >
                  {getReservationStatusLabel(reservation.status)}
                </span>
                {reservation.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="btn btn-secondary px-2 py-1 text-xs text-[var(--danger)]"
                    onClick={() => handleDelete(reservation.id, reservation.title)}
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-3">제목</th>
                <th className="py-2 pr-3">예약자</th>
                <th className="py-2 pr-3">회의실</th>
                <th className="py-2 pr-3">시간</th>
                <th className="py-2 pr-3">상태</th>
                <th className="py-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-[var(--border)]">
                  <td className="py-3 pr-3">{reservation.title}</td>
                  <td className="py-3 pr-3">{reservation.user.displayName}</td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <RoomIcon color={reservation.room.color} size={10} />
                      {reservation.room.name}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {formatTimeRange(
                      new Date(reservation.startTime),
                      new Date(reservation.endTime),
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`badge ${
                        reservation.status === "NO_SHOW"
                          ? "badge-danger"
                          : reservation.status === "COMPLETED"
                            ? "badge-success"
                            : "badge-muted"
                      }`}
                    >
                      {getReservationStatusLabel(reservation.status)}
                    </span>
                  </td>
                  <td className="py-3">
                    {reservation.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className="btn btn-secondary px-2 py-1 text-xs text-[var(--danger)]"
                        onClick={() => handleDelete(reservation.id, reservation.title)}
                      >
                        삭제
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
