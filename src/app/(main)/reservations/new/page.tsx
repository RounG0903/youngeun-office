"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TimeRangePicker } from "@/components/TimeRangePicker";
import {
  CLOSE_HOUR,
  filterEndTimeSlots,
  filterPastTimeSlots,
  generateTimeSlots,
  getMinSelectableDate,
} from "@/lib/reservation";

type Room = {
  id: string;
  name: string;
};

export default function NewReservationPage() {
  const router = useRouter();
  const allSlots = useMemo(() => generateTimeSlots(), []);
  const closeTime = `${String(CLOSE_HOUR).padStart(2, "0")}:00`;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(getMinSelectableDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/reservations")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error && !data.rooms) {
          setError(data.error);
          return;
        }
        setRooms(data.rooms ?? []);
        if (data.rooms?.[0]) {
          setRoomId(data.rooms[0].id);
        }
      });
  }, [router]);

  useEffect(() => {
    const startSlots = filterPastTimeSlots(date, allSlots);
    if (startTime && !startSlots.includes(startTime)) {
      setStartTime("");
      setEndTime("");
    }
  }, [allSlots, date, startTime]);

  useEffect(() => {
    if (!startTime) {
      setEndTime("");
      return;
    }
    const endSlots = [...filterEndTimeSlots(startTime, allSlots), closeTime];
    if (endTime && !endSlots.includes(endTime)) {
      setEndTime("");
    }
  }, [allSlots, closeTime, endTime, startTime]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, roomId, date, startTime, endTime }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "예약에 실패했습니다.");
      return;
    }

    router.push(`/reservations/${data.reservation.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">회의실 예약</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          제목과 예약 시간은 필수입니다. 30분 단위, 06:00~22:00만 선택 가능합니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="field">
            <label htmlFor="title">제목</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="주간 회의"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="room">회의실</label>
            <select
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">날짜</label>
            <input
              id="date"
              type="date"
              value={date}
              min={getMinSelectableDate()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <TimeRangePicker
            date={date}
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || !title || !roomId || !startTime || !endTime}
          >
            {loading ? "예약 중..." : "예약하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
