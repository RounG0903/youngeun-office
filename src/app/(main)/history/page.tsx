"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IgPostCard } from "@/components/IgPostCard";
import { formatTimeRange, getReservationStatusLabel } from "@/lib/reservation";

type Reservation = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  checkedInAt: string | null;
  status: string;
  cancelledAt: string | null;
  room: { name: string; color?: string };
};

const FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "ACTIVE", label: "예정" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "NO_SHOW", label: "노쇼" },
] as const;

export default function HistoryPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations/history")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login?next=/history");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        setLoading(false);
        if (!data) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setReservations(data.reservations ?? []);
      });
  }, [router]);

  const filtered = reservations.filter((r) => filter === "ALL" || r.status === filter);

  if (loading) return <p className="px-4 py-8 text-center text-[var(--muted)]">불러오는 중...</p>;

  return (
    <div>
      <div className="px-4 pb-2 pt-3">
        <h1 className="text-xl font-semibold">히스토리</h1>
      </div>

      <div className="ig-pill-scroll px-4">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`ig-pill ${filter === item.value ? "ig-pill-active" : ""}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <div className="alert alert-error mx-4 mt-4">{error}</div> : null}

      {filtered.length === 0 ? (
        <div className="ig-empty-state">기록이 없습니다.</div>
      ) : (
        <div className="mt-2">
          {filtered.map((reservation) => (
            <IgPostCard
              key={reservation.id}
              href={`/reservations/${reservation.id}`}
              title={reservation.title}
              subtitle={reservation.room.name}
              meta={formatTimeRange(
                new Date(reservation.startTime),
                new Date(reservation.endTime),
              )}
              roomColor={reservation.room.color ?? "#3B82F6"}
              badge={
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
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
