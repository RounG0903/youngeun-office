"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [deletePin, setDeletePin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.name) {
          setName(data.user.name);
        }
      })
      .catch(() => undefined);
  }, []);

  async function handleSendSms() {
    setError("");
    setSmsMessage("");
    setSmsLoading(true);
    setPhoneVerified(false);
    setCode("");

    const res = await fetch("/api/auth/sms/send-account", { method: "POST" });
    const data = await res.json();
    setSmsLoading(false);

    if (!res.ok) {
      setError(data.error ?? "인증번호 발송에 실패했습니다.");
      return;
    }

    setPhone(data.phone);
    setMaskedPhone(data.maskedPhone);
    setSmsMessage(
      data.devCode
        ? `개발 모드: 인증번호 ${data.devCode}`
        : `${data.maskedPhone}로 인증번호가 발송되었습니다.`,
    );
  }

  async function handleVerifySms() {
    if (!phone) {
      setError("먼저 인증번호를 요청해 주세요.");
      return;
    }

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
    setSmsMessage("");
    setMessage("휴대폰 인증이 완료되었습니다. PIN 변경 또는 회원 탈퇴를 진행할 수 있습니다.");
  }

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoadingProfile(true);

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setLoadingProfile(false);

    if (!res.ok) {
      setError(data.error ?? "닉네임 변경에 실패했습니다.");
      return;
    }

    setMessage(data.message);
    router.refresh();
  }

  async function handlePinSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPin !== confirmPin) {
      setError("새 PIN 확인이 일치하지 않습니다.");
      return;
    }

    setLoadingPin(true);
    const res = await fetch("/api/auth/pin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin, newPin }),
    });
    const data = await res.json();
    setLoadingPin(false);

    if (!res.ok) {
      setError(data.error ?? "PIN 변경에 실패했습니다.");
      return;
    }

    setMessage(data.message);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  }

  async function handleDeleteSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!window.confirm("정말 탈퇴하시겠습니까? 예약 기록과 계정 정보가 삭제됩니다.")) {
      return;
    }

    setLoadingDelete(true);
    const res = await fetch("/api/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin: deletePin }),
    });
    const data = await res.json();
    setLoadingDelete(false);

    if (!res.ok) {
      setError(data.error ?? "탈퇴에 실패했습니다.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">계정 설정</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {phoneVerified
            ? "PIN 변경 또는 회원 탈퇴를 진행할 수 있습니다."
            : "휴대폰 인증 후 PIN 변경 및 회원 탈퇴가 가능합니다."}
        </p>

        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}
      </div>

      <div className="card p-8">
        <h2 className="text-lg font-bold">닉네임 변경</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <div className="field">
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loadingProfile}>
            {loadingProfile ? "변경 중..." : "닉네임 변경"}
          </button>
        </form>
      </div>

      {!phoneVerified ? (
        <div className="card p-8">
          <section className="rounded-xl border border-[var(--border)] p-4">
            <h2 className="font-semibold">휴대폰 인증</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              PIN 변경 및 회원 탈퇴를 위해 휴대폰 인증이 필요합니다.
              {maskedPhone ? ` (${maskedPhone})` : ""}
            </p>

            <div className="mt-4">
              <button
                type="button"
                className="btn btn-secondary w-full text-sm sm:w-auto"
                onClick={handleSendSms}
                disabled={smsLoading}
              >
                {smsLoading ? "발송 중..." : "인증번호 발송"}
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="field">
                <label htmlFor="verify-code">인증번호 (6자리)</label>
                <input
                  id="verify-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary w-full text-sm sm:w-auto"
                onClick={handleVerifySms}
                disabled={verifyLoading || code.length !== 6}
              >
                {verifyLoading ? "확인 중..." : "인증 확인"}
              </button>
            </div>

            {smsMessage ? <div className="mt-3 text-sm text-[var(--muted)]">{smsMessage}</div> : null}
          </section>
        </div>
      ) : (
        <>
          <div className="card p-8">
            <h2 className="text-lg font-bold">PIN 변경</h2>
            <form onSubmit={handlePinSubmit} className="mt-4 space-y-4">
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
              <button type="submit" className="btn btn-primary" disabled={loadingPin}>
                {loadingPin ? "변경 중..." : "PIN 변경"}
              </button>
            </form>
          </div>

          <div className="card border-red-200 p-8">
            <h2 className="text-lg font-bold text-red-700">회원 탈퇴</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              탈퇴 시 예약 기록과 계정 정보가 삭제됩니다.
            </p>
            <form onSubmit={handleDeleteSubmit} className="mt-4 space-y-4">
              <div className="field">
                <label htmlFor="delete-pin">현재 PIN</label>
                <input
                  id="delete-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger" disabled={loadingDelete}>
                {loadingDelete ? "처리 중..." : "회원 탈퇴"}
              </button>
            </form>
          </div>
        </>
      )}

      <p className="text-center text-sm">
        <Link href="/reservations" className="text-[var(--primary)]">
          예약 목록으로
        </Link>
      </p>
    </div>
  );
}
