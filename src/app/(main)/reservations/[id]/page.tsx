"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QrCheckinScanner } from "@/components/QrCheckinScanner";
import { RoomIcon } from "@/components/RoomIcon";
import {
  formatAppTime,
  formatTimeRange,
  getReservationStatusLabel,
  isWithinCheckinWindow,
} from "@/lib/reservation";

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
  checkinRequired: boolean;
  checkinWindowOpen: boolean;
};

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(() => new Date());

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCheckinSuccess = useCallback((successMessage: string) => {
    setMessage(successMessage);
    setError("");
    void load();
    router.refresh();
  }, [router]);

  const handleCheckinError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

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

  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);
  const showCheckinScanner =
    reservation.checkinWindowOpen &&
    isWithinCheckinWindow(startTime, endTime, now);

  return (
    <div>
      <article className="ig-post">
        <header className="ig-post-header">
          <div className="ig-post-avatar-wrap">
            <span className="ig-story-ring">
              <span className="ig-post-avatar">
                <RoomIcon color={reservation.roomColor} size={14} />
              </span>
            </span>
            <div>
              <p className="ig-post-username">{reservation.roomName}</p>
              {reservation.roomLocationDescription ? (
                <p className="ig-post-location">{reservation.roomLocationDescription}</p>
              ) : null}
            </div>
          </div>
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
        </header>
        <div className="ig-post-body">
          <h1 className="text-base font-semibold">{reservation.title}</h1>
          <p className="ig-post-meta">{formatTimeRange(startTime, endTime)}</p>
        </div>
      </article>

      <div className="card border-t-0 p-5">
        {reservation.checkedInAt ? (
          <div className="alert alert-success">
            체크인 완료: {formatAppTime(new Date(reservation.checkedInAt))}
          </div>
        ) : showCheckinScanner ? (
          <QrCheckinScanner
            reservationId={reservation.id}
            onSuccess={handleCheckinSuccess}
            onError={handleCheckinError}
          />
        ) : reservation.status === "ACTIVE" && reservation.tabletCheckinEnabled ? (
          reservation.checkinRequired ? (
            <p className="text-sm text-[var(--muted)]">
              예약 30분 전부터 이 화면에서 태블릿 체크인 QR을 스캔할 수 있습니다.
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              이 계정은 체크인 면제 상태입니다.
            </p>
          )
        ) : reservation.status === "ACTIVE" ? (
          <p className="text-sm text-[var(--muted)]">
            이 회의실은 체크인이 필요하지 않습니다.
          </p>
        ) : null}

        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}

        {reservation.canCancel ? (
          <button
            type="button"
            className="btn btn-secondary mt-4 w-full text-[var(--danger)]"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "취소 중..." : "예약 취소"}
          </button>
        ) : reservation.status === "ACTIVE" ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            예약 시작 30분 전까지만 취소할 수 있습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
