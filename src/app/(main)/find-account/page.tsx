"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function FindAccountPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [error, setError] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; pin: string | null; message?: string } | null>(
    null,
  );

  async function handleSendSms() {
    setError("");
    setSmsMessage("");
    setResult(null);
    setSmsLoading(true);

    const res = await fetch("/api/auth/account-recovery/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSmsLoading(false);

    if (!res.ok) {
      setError(data.error ?? "인증번호 발송에 실패했습니다.");
      return;
    }

    setSmsMessage(
      data.devCode
        ? `개발 모드: 인증번호 ${data.devCode}`
        : "인증번호가 발송되었습니다.",
    );
  }

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLookupLoading(true);

    const res = await fetch("/api/auth/account-recovery/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setLookupLoading(false);

    if (!res.ok) {
      setError(data.error ?? "계정 조회에 실패했습니다.");
      return;
    }

    setResult({ name: data.name, pin: data.pin, message: data.message });
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">계정 찾기</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          가입 시 등록한 휴대폰 번호로 인증 후 아이디(이름)와 PIN을 확인할 수 있습니다.
        </p>

        <form onSubmit={handleLookup} className="mt-6 space-y-4">
          <div className="field">
            <label htmlFor="phone">휴대폰 번호</label>
            <div className="input-action-row">
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, ""))}
                placeholder="01012345678"
                required
              />
              <button
                type="button"
                className="btn btn-secondary text-sm"
                onClick={handleSendSms}
                disabled={smsLoading || !phone}
              >
                {smsLoading ? "발송 중..." : "인증번호"}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="code">인증번호 (6자리)</label>
            <input
              id="code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              required
            />
          </div>

          {smsMessage ? <div className="text-sm text-[var(--muted)]">{smsMessage}</div> : null}
          {error ? <div className="alert alert-error">{error}</div> : null}

          {result ? (
            <div className="alert alert-success space-y-1">
              <p>
                <strong>아이디(이름):</strong> {result.name}
              </p>
              {result.pin ? (
                <p>
                  <strong>PIN:</strong> <span className="font-mono">{result.pin}</span>
                </p>
              ) : (
                <p className="text-sm">{result.message}</p>
              )}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={lookupLoading || code.length !== 6}
          >
            {lookupLoading ? "조회 중..." : "계정 조회"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="font-semibold text-[var(--primary)]">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
