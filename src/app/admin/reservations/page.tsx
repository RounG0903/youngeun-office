"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type User = { id: string; name: string };
type Room = { id: string; name: string };
type Reservation = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  room: { name: string };
  user: { name: string };
};

export default function AdminReservationsPage() {
  const allSlots = useMemo(() => generateTimeSlots(), []);
  const closeTime = `${String(CLOSE_HOUR).padStart(2, "0")}:00`;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState("");
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

  useEffect(() => {
    const startSlots = filterPastTimeSlots(date, allSlots);
    if (startTime && !startSlots.includes(startTime)) {
      setStartTime("");
      setEndTime("");
      return;
    }
    if (startTime && bookedSlots.includes(startTime)) {
      setStartTime("");
      setEndTime("");
    }
  }, [allSlots, bookedSlots, date, startTime]);

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
    const [resRes, usersRes, roomsRes] = await Promise.all([
      fetch("/api/admin/reservations"),
      fetch("/api/admin/users"),
      fetch("/api/admin/rooms"),
    ]);
    const [resData, usersData, roomsData] = await Promise.all([
      resRes.json(),
      usersRes.json(),
      roomsRes.json(),
    ]);
    setLoading(false);
    if (!resRes.ok) {
      setError(resData.error ?? "불러오기 실패");
      return;
    }
    setReservations(resData.reservations ?? []);
    setUsers(usersData.users ?? []);
    setRooms(roomsData.rooms ?? []);
    if (usersData.users?.[0]) setUserId(usersData.users[0].id);
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
      body: JSON.stringify({ title, userId, roomId, date, startTime, endTime }),
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
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="rounded-[10px] border border-[var(--border)] px-3 py-2 md:col-span-2"
            required
          />
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-[10px] border border-[var(--border)] px-3 py-2"
            required
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
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
          <div className="md:col-span-2">
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

      <div className="card p-6">
        <h2 className="text-xl font-bold">예약 관리</h2>
        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-3">제목</th>
                <th className="py-2 pr-3">회원</th>
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
                  <td className="py-3 pr-3">{reservation.user.name}</td>
                  <td className="py-3 pr-3">{reservation.room.name}</td>
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
