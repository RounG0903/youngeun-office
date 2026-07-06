"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTimeRange } from "@/lib/reservation";

type Reservation = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  checkedInAt: string | null;
  room: { name: string };
};

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations/mine")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
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

  if (loading) {
    return <p className="text-[var(--muted)]">예약 목록을 불러오는 중...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">내 예약</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            다가오는 예약입니다. 전체 기록은{" "}
            <Link href="/history" className="font-semibold text-[var(--primary)]">
              히스토리
            </Link>
            에서 확인하세요.
          </p>
        </div>
        <Link href="/reservations/new" className="btn btn-primary">
          새 예약
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {reservations.length === 0 ? (
        <div className="card p-8 text-center text-[var(--muted)]">
          아직 예약이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
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
                    {formatTimeRange(new Date(reservation.startTime), new Date(reservation.endTime))}
                  </p>
                </div>
                {reservation.checkedInAt ? (
                  <span className="badge badge-success">체크인 완료</span>
                ) : (
                  <span className="badge badge-muted">체크인 대기</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
