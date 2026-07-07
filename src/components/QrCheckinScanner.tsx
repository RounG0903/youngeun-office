"use client";

import { useEffect, useId, useRef, useState } from "react";

type QrCheckinScannerProps = {
  reservationId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

function parseCheckinPayload(text: string): { reservationId: string; token: string } | null {
  const trimmed = text.trim();
  try {
    const url = trimmed.includes("://")
      ? new URL(trimmed)
      : new URL(trimmed, window.location.origin);
    const match = url.pathname.match(/\/checkin\/([^/]+)\/?$/);
    const token = url.searchParams.get("token");
    if (match?.[1] && token) {
      return { reservationId: match[1], token };
    }
  } catch {
    return null;
  }
  return null;
}

export function QrCheckinScanner({
  reservationId,
  onSuccess,
  onError,
}: QrCheckinScannerProps) {
  const containerId = useId().replace(/:/g, "");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [starting, setStarting] = useState(true);
  const processingRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      async function handleScan(decodedText: string) {
        if (processingRef.current) return;

        const payload = parseCheckinPayload(decodedText);
        if (!payload) return;

        if (payload.reservationId !== reservationId) {
          onErrorRef.current("다른 예약의 체크인 QR입니다. 해당 회의실 태블릿 QR을 스캔해 주세요.");
          return;
        }

        processingRef.current = true;

        try {
          const response = await fetch(`/api/reservations/${reservationId}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: payload.token }),
          });
          const data = await response.json();

          if (!response.ok) {
            onErrorRef.current(data.error ?? "체크인에 실패했습니다.");
            processingRef.current = false;
            return;
          }

          await scanner.stop();
          onSuccessRef.current(data.message ?? "체크인이 완료되었습니다.");
        } catch {
          onErrorRef.current("체크인 요청 중 오류가 발생했습니다.");
          processingRef.current = false;
        }
      }

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          () => undefined,
        );
        if (!cancelled) setStarting(false);
      } catch {
        if (!cancelled) {
          setStarting(false);
          onErrorRef.current("카메라를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, [containerId, reservationId]);

  return (
    <div className="qr-checkin-scanner">
      <p className="mb-3 text-sm text-[var(--muted)]">
        회의실 태블릿의 체크인 QR을 카메라에 맞춰 주세요.
      </p>
      {starting ? <p className="mb-3 text-sm text-[var(--muted)]">카메라 연결 중...</p> : null}
      <div id={containerId} className="qr-checkin-viewport" />
    </div>
  );
}
