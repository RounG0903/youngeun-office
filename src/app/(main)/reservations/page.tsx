"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IgPostCard } from "@/components/IgPostCard";
import { formatTimeRange } from "@/lib/reservation";

type Reservation = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  checkedInAt: string | null;
  room: {
    name: string;
    locationDescription: string;
    color: string;
  };
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
    return <p className="px-4 py-8 text-center text-[var(--muted)]">불러오는 중...</p>;
  }

  return (
    <div>
      {error ? <div className="alert alert-error mx-4 mb-4">{error}</div> : null}

      {reservations.length === 0 ? (
        <div className="ig-empty-state">
          <p>아직 예약이 없습니다.</p>
          <Link href="/reservations/new" className="ig-link mt-3 inline-block">
            첫 예약 만들기
          </Link>
        </div>
      ) : (
        <div>
          {reservations.map((reservation) => (
            <IgPostCard
              key={reservation.id}
              href={`/reservations/${reservation.id}`}
              title={reservation.title}
              subtitle={reservation.room.name}
              location={reservation.room.locationDescription || undefined}
              meta={formatTimeRange(
                new Date(reservation.startTime),
                new Date(reservation.endTime),
              )}
              roomColor={reservation.room.color}
              badge={
                reservation.checkedInAt ? (
                  <span className="badge badge-success">체크인 완료</span>
                ) : (
                  <span className="badge badge-muted">대기</span>
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
