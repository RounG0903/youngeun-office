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

type PendingAction = {
  id: string;
  type: "cancel" | "delete";
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  function getSwipeAction(reservation: Reservation) {
    if (reservation.status === "ACTIVE") {
      const canCancel = canCancelReservation(new Date(reservation.startTime));
      return {
        label: "취소",
        type: "cancel" as const,
        disabled: !canCancel,
      };
    }
    return {
      label: "삭제",
      type: "delete" as const,
      disabled: false,
    };
  }

  function requestAction(reservation: Reservation) {
    const action = getSwipeAction(reservation);
    if (action.disabled) return;

    if (action.type === "cancel") {
      setPendingAction({
        id: reservation.id,
        type: "cancel",
        title: reservation.title,
      });
      return;
    }

    setPendingAction({
      id: reservation.id,
      type: "delete",
      title: reservation.title,
    });
  }

  async function executeAction() {
    if (!pendingAction) return;

    setActionLoading(true);
    setError("");

    const res = await fetch(`/api/reservations/${pendingAction.id}`, { method: "DELETE" });
    const data = await res.json();
    setActionLoading(false);
    setPendingAction(null);

    if (!res.ok) {
      setError(data.error ?? "처리에 실패했습니다.");
      return;
    }

    await loadHistory();
  }

  if (loading) return <p className="px-4 py-8 text-center text-[var(--muted)]">불러오는 중...</p>;

  return (
    <div>
      <div className="px-4 pb-2 pt-3">
        <h1 className="text-xl font-semibold">히스토리</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">왼쪽으로 밀어 예약 취소 또는 내역 삭제</p>
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
          {filtered.map((reservation) => {
            const swipeAction = getSwipeAction(reservation);
            return (
              <SwipeableRow
                key={reservation.id}
                actionLabel={swipeAction.label}
                onAction={() => requestAction(reservation)}
                disabled={swipeAction.disabled}
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
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingAction?.type === "cancel"}
        title="예약 취소"
        message={
          pendingAction
            ? `'${pendingAction.title}' 예약을 취소하시겠습니까?`
            : ""
        }
        confirmLabel={actionLoading ? "처리 중..." : "예약 취소"}
        onConfirm={executeAction}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction?.type === "delete"}
        title="내역 삭제"
        message={
          pendingAction
            ? `'${pendingAction.title}' 내역을 삭제하시겠습니까?`
            : ""
        }
        confirmLabel={actionLoading ? "처리 중..." : "삭제"}
        onConfirm={executeAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
