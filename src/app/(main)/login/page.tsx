"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin, next: nextPath }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "로그인에 실패했습니다.");
      return;
    }

    router.push(data.redirectTo ?? (nextPath && nextPath.startsWith("/") ? nextPath : "/reservations"));
    router.refresh();
  }

  return (
    <div className="ig-auth-page">
      <h1 className="ig-auth-logo ig-logo-text">Youngeun Office</h1>

      <div className="ig-auth-card">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="field">
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              aria-label="이름"
              required
            />
          </div>

          <div className="field">
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="PIN"
              aria-label="PIN"
              required
            />
          </div>

          {error ? <div className="alert alert-error text-sm">{error}</div> : null}

          <button type="submit" className="btn btn-primary mt-2 w-full py-2" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="ig-auth-divider">또는</div>

        <p className="text-center text-sm">
          <Link href="/find-account" className="ig-link">
            계정 찾기
          </Link>
        </p>
      </div>

      <div className="ig-auth-footer">
        계정이 없으신가요?{" "}
        <Link href="/register" className="ig-link">
          가입하기
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-[var(--muted)]">로그인 화면을 불러오는 중...</p>}>
      <LoginForm />
    </Suspense>
  );
}
