"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { formatTimeRange } from "@/lib/reservation";

type CheckinResult = {
  message: string;
  reservation?: {
    id: string;
    title: string;
    roomName: string;
    startTime: string;
    endTime: string;
    checkedInAt: string;
  };
};

export default function CheckinClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function runCheckin() {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/reservations/${params.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error ?? "체크인에 실패했습니다.");
        return;
      }

      setResult(data);
      router.refresh();
    }

    runCheckin();
  }, [params.id, router, token]);

  if (loading) {
    return <p className="text-[var(--muted)]">체크인 처리 중...</p>;
  }

  if (needsLogin) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">로그인이 필요합니다</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          체크인을 완료하려면 먼저 로그인해 주세요. 로그인 후 이 QR 링크로 다시 접속하면
          체크인됩니다.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/checkin/${params.id}?token=${token}`)}`}
          className="btn btn-primary mt-5"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-md p-8">
        <div className="alert alert-error">{error}</div>
        <Link href="/reservations" className="btn btn-secondary mt-4">
          내 예약 보기
        </Link>
      </div>
    );
  }

  if (!result?.reservation) {
    return (
      <div className="card mx-auto max-w-md p-8">
        <div className="alert alert-success">{result?.message}</div>
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="alert alert-success">{result.message}</div>
      <h1 className="mt-5 text-xl font-bold">{result.reservation.title}</h1>
      <p className="mt-2 text-[var(--muted)]">{result.reservation.roomName}</p>
      <p className="mt-3 text-sm">
        {formatTimeRange(
          new Date(result.reservation.startTime),
          new Date(result.reservation.endTime),
        )}
      </p>
      <Link href="/reservations" className="btn btn-primary mt-6">
        내 예약 보기
      </Link>
    </div>
  );
}
