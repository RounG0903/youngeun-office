"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IgPostCard } from "@/components/IgPostCard";
import { SwipeableRow } from "@/components/SwipeableRow";
import {
  canCancelReservation,
  formatTimeRange,
  getReservationStatusLabel,
} from "@/lib/reservation";

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

type PendingCancel = {
  id: string;
  title: string;
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
  const [pendingCancel, setPendingCancel] = useState<PendingCancel | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetKeys, setResetKeys] = useState<Record<string, number>>({});

  async function loadHistory() {
    const res = await fetch("/api/reservations/history");
    if (res.status === 401) {
      router.push("/login?next=/history");
      return;
    }
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setReservations(data.reservations ?? []);
  }

  useEffect(() => {
    loadHistory();
  }, [router]);

  const filtered = reservations.filter((r) => filter === "ALL" || r.status === filter);

  function canSwipeDismiss(reservation: Reservation) {
    if (reservation.status === "ACTIVE") {
      return canCancelReservation(new Date(reservation.startTime));
    }
    return true;
  }

  async function deleteReservation(id: string) {
    setError("");
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "삭제에 실패했습니다.");
      setResetKeys((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
      await loadHistory();
      return;
    }

    setReservations((prev) => prev.filter((item) => item.id !== id));
  }

  function handleDismiss(reservation: Reservation) {
    if (reservation.status === "ACTIVE") {
      setPendingCancel({ id: reservation.id, title: reservation.title });
      return;
    }

    void deleteReservation(reservation.id);
  }

  async function confirmCancel() {
    if (!pendingCancel) return;

    setActionLoading(true);
    setError("");

    const res = await fetch(`/api/reservations/${pendingCancel.id}`, { method: "DELETE" });
    const data = await res.json();
    setActionLoading(false);

    if (!res.ok) {
      setError(data.error ?? "예약 취소에 실패했습니다.");
      setResetKeys((prev) => ({
        ...prev,
        [pendingCancel.id]: (prev[pendingCancel.id] ?? 0) + 1,
      }));
      setPendingCancel(null);
      return;
    }

    setReservations((prev) => prev.filter((item) => item.id !== pendingCancel.id));
    setPendingCancel(null);
  }

  function cancelConfirmDialog() {
    if (!pendingCancel) return;
    setResetKeys((prev) => ({
      ...prev,
      [pendingCancel.id]: (prev[pendingCancel.id] ?? 0) + 1,
    }));
    setPendingCancel(null);
  }

  if (loading) return <p className="px-4 py-8 text-center text-[var(--muted)]">불러오는 중...</p>;

  return (
    <div>
      <div className="px-4 pb-2 pt-3">
        <h1 className="text-xl font-semibold">히스토리</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">왼쪽으로 밀어 내역 삭제 · 예정 예약은 취소 확인</p>
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
            <SwipeableRow
              key={reservation.id}
              resetKey={resetKeys[reservation.id] ?? 0}
              onDismiss={() => handleDismiss(reservation)}
              disabled={!canSwipeDismiss(reservation)}
            >
              <IgPostCard
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
            </SwipeableRow>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingCancel !== null}
        title="예약 취소"
        message={
          pendingCancel ? `'${pendingCancel.title}' 예약을 취소하시겠습니까?` : ""
        }
        confirmLabel={actionLoading ? "처리 중..." : "예약 취소"}
        onConfirm={confirmCancel}
        onCancel={cancelConfirmDialog}
      />
    </div>
  );
}
