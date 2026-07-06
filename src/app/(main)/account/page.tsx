"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AccountPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">PIN 변경</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          로그인에 사용하는 PIN 4자리를 변경합니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="field">
            <label htmlFor="current-pin">현재 PIN</label>
            <input
              id="current-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="new-pin">새 PIN</label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirm-pin">새 PIN 확인</label>
            <input
              id="confirm-pin"
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

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "변경 중..." : "PIN 변경"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/reservations" className="text-[var(--primary)]">
            예약 목록으로
          </Link>
        </p>
      </div>
    </div>
  );
}
