"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  async function handleSendSms() {
    setError("");
    setSmsMessage("");
    setSmsLoading(true);
    setPhoneVerified(false);
    setVerifiedPhone("");

    const res = await fetch("/api/auth/sms/send", {
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

  async function handleVerifySms() {
    setError("");
    setVerifyLoading(true);

    const res = await fetch("/api/auth/sms/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setVerifyLoading(false);

    if (!res.ok) {
      setError(data.error ?? "인증에 실패했습니다.");
      return;
    }

    setPhoneVerified(true);
    setVerifiedPhone(data.phone);
    setSmsMessage("휴대폰 인증이 완료되었습니다.");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!phoneVerified) {
      setError("휴대폰 문자 인증을 완료해 주세요.");
      return;
    }

    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: verifiedPhone, pin }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "회원가입에 실패했습니다.");
      return;
    }

    router.push("/reservations/new");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          휴대폰 문자 인증 후 이름과 PIN 4자리를 설정하세요. 전화번호당 계정 1개만 생성됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="field">
            <label htmlFor="phone">휴대폰 번호</label>
            <div className="input-action-row">
              <input
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/[^\d-]/g, ""));
                  setPhoneVerified(false);
                  setVerifiedPhone("");
                }}
                placeholder="01012345678"
                disabled={phoneVerified}
                required
              />
              <button
                type="button"
                className="btn btn-secondary text-sm"
                onClick={handleSendSms}
                disabled={smsLoading || phoneVerified || !phone}
              >
                {smsLoading ? "발송 중..." : "인증번호"}
              </button>
            </div>
          </div>

          {!phoneVerified ? (
            <div className="field">
              <label htmlFor="code">인증번호 (6자리)</label>
              <div className="input-action-row">
                <input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary text-sm"
                  onClick={handleVerifySms}
                  disabled={verifyLoading || code.length !== 6}
                >
                  {verifyLoading ? "확인 중..." : "인증 확인"}
                </button>
              </div>
            </div>
          ) : (
            <div className="alert alert-success">
              {formatPhone(verifiedPhone)} 인증 완료
            </div>
          )}

          {smsMessage ? <div className="text-sm text-[var(--muted)]">{smsMessage}</div> : null}

          <div className="field">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pin">PIN (4자리)</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              required
            />
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || !phoneVerified}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-[var(--primary)]">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
