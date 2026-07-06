"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [tabletCheckinEnabled, setTabletCheckinEnabled] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setTabletCheckinEnabled(data.tabletCheckinEnabled ?? true);
        setConfigLoading(false);
      });
  }, []);

  async function handleToggleCheckin() {
    setMessage("");
    setError("");
    setConfigSaving(true);
    const next = !tabletCheckinEnabled;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabletCheckinEnabled: next }),
    });
    const data = await res.json();
    setConfigSaving(false);
    if (!res.ok) {
      setError(data.error ?? "설정 변경에 실패했습니다.");
      return;
    }
    setTabletCheckinEnabled(data.tabletCheckinEnabled);
    setMessage(data.message);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPin !== confirmPin) {
      setError("새 PIN 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/pin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin, newPin }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "PIN 변경에 실패했습니다.");
      return;
    }

    setMessage(data.message);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold">태블릿 체크인 설정</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          비활성화 시 태블릿에서 체크인 QR이 생성되지 않으며, 모든 사용자가 체크인 없이 예약을
          이용합니다. (노쇼 패널티 없음)
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm">
            현재 상태:{" "}
            <strong>{tabletCheckinEnabled ? "활성화" : "비활성화"}</strong>
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleToggleCheckin}
            disabled={configLoading || configSaving}
          >
            {configSaving
              ? "저장 중..."
              : tabletCheckinEnabled
                ? "체크인 비활성화"
                : "체크인 활성화"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold">관리자 PIN 변경</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          관리자 로그인에 사용하는 PIN 4자리를 변경합니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
          <div className="field">
            <label htmlFor="admin-current-pin">현재 PIN</label>
            <input
              id="admin-current-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="admin-new-pin">새 PIN</label>
            <input
              id="admin-new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="admin-confirm-pin">새 PIN 확인</label>
            <input
              id="admin-confirm-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
            />
          </div>

          {message ? <div className="alert alert-success">{message}</div> : null}
          {error ? <div className="alert alert-error">{error}</div> : null}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "변경 중..." : "PIN 변경"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          <Link href="/admin" className="text-[var(--primary)]">
            관리 홈으로
          </Link>
        </p>
      </div>
    </div>
  );
}
