"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTimeRange, getReservationStatusLabel } from "@/lib/reservation";

type Reservation = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  checkedInAt: string | null;
  status: string;
  cancelledAt: string | null;
  room: { name: string };
};

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

  if (loading) return <p className="text-[var(--muted)]">히스토리를 불러오는 중...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">예약 히스토리</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">전체 예약 기록을 조회합니다.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "ALL", label: "전체" },
          { value: "ACTIVE", label: "예정" },
          { value: "COMPLETED", label: "이용 완료" },
          { value: "CANCELLED", label: "취소" },
          { value: "NO_SHOW", label: "노쇼" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            className={`btn px-3 py-1 text-sm ${filter === item.value ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-[var(--muted)]">기록이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reservation) => (
            <Link
              key={reservation.id}
              href={`/reservations/${reservation.id}`}
              className="card block p-5 transition hover:border-blue-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{reservation.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{reservation.room.name}</p>
                  <p className="mt-2 text-sm">
                    {formatTimeRange(
                      new Date(reservation.startTime),
                      new Date(reservation.endTime),
                    )}
                  </p>
                </div>
                <span
                  className={`badge ${
                    reservation.status === "NO_SHOW"
                      ? "badge-danger"
                      : reservation.status === "COMPLETED"
                        ? "badge-success"
                        : reservation.status === "CANCELLED"
                          ? "badge-muted"
                          : "badge-muted"
                  }`}
                >
                  {getReservationStatusLabel(reservation.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
