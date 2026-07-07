"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RoomIcon } from "@/components/RoomIcon";
import { formatTimeRange, getReservationStatusLabel } from "@/lib/reservation";

type ReservationDetail = {
  id: string;
  title: string;
  roomName: string;
  roomLocationDescription: string;
  roomColor: string;
  startTime: string;
  endTime: string;
  checkedInAt: string | null;
  status: string;
  canCancel: boolean;
  tabletCheckinEnabled: boolean;
};

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    const detailRes = await fetch(`/api/reservations/${params.id}`);

    if (detailRes.status === 401) {
      router.push("/login");
      return;
    }

    const detailData = await detailRes.json();
    setLoading(false);

    if (!detailRes.ok) {
      setError(detailData.error ?? "예약을 찾을 수 없습니다.");
      return;
    }

    setReservation(detailData.reservation);
  }

  useEffect(() => {
    load();
  }, [params.id, router]);

  async function handleCancel() {
    if (!reservation || !confirm("예약을 취소하시겠습니까?")) return;
    setCancelling(true);
    setMessage("");
    setError("");

    const res = await fetch(`/api/reservations/${params.id}`, { method: "DELETE" });
    const data = await res.json();
    setCancelling(false);

    if (!res.ok) {
      setError(data.error ?? "취소에 실패했습니다.");
      return;
    }

    setMessage(data.message);
    await load();
    router.refresh();
  }

  if (loading) {
    return <p className="text-[var(--muted)]">예약 정보를 불러오는 중...</p>;
  }

  if (error && !reservation) {
    return (
      <div className="card mx-auto max-w-lg p-8">
        <div className="alert alert-error">{error}</div>
        <Link href="/reservations" className="btn btn-secondary mt-4">
          목록으로
        </Link>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="card p-8">
        <Link href="/reservations" className="text-sm text-[var(--muted)]">
          ← 내 예약
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{reservation.title}</h1>
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
        </div>
        <div className="mt-3 flex items-start gap-2">
          <RoomIcon color={reservation.roomColor} size={14} className="mt-1.5" />
          <div>
            <p className="font-medium text-[var(--foreground)]">{reservation.roomName}</p>
            {reservation.roomLocationDescription ? (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {reservation.roomLocationDescription}
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-3">
          {formatTimeRange(new Date(reservation.startTime), new Date(reservation.endTime))}
        </p>

        {reservation.checkedInAt ? (
          <div className="alert alert-success mt-5">
            체크인 완료:{" "}
            {new Intl.DateTimeFormat("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(new Date(reservation.checkedInAt))}
          </div>
        ) : reservation.status === "ACTIVE" && reservation.tabletCheckinEnabled ? (
          <p className="mt-5 text-sm text-[var(--muted)]">
            예약 당일 회의실 입구 태블릿의 체크인 QR을 스캔해 체크인하세요.
          </p>
        ) : reservation.status === "ACTIVE" ? (
          <p className="mt-5 text-sm text-[var(--muted)]">
            이 회의실은 체크인이 필요하지 않습니다. (태블릿 미등록 또는 체크인 비활성화)
          </p>
        ) : null}

        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}

        {reservation.canCancel ? (
          <button
            type="button"
            className="btn btn-secondary mt-5 text-[var(--danger)]"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "취소 중..." : "예약 취소"}
          </button>
        ) : reservation.status === "ACTIVE" ? (
          <p className="mt-5 text-sm text-[var(--muted)]">
            예약 시작 30분 전까지만 취소할 수 있습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
