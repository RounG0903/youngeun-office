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
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          이름과 PIN으로 로그인하세요. 계정 유형에 따라 자동으로 화면이 연결됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="field">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
            />
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/find-account" className="font-semibold text-[var(--primary)]">
            계정 찾기
          </Link>
          {" · "}
          일반 사용자이신가요?{" "}
          <Link href="/register" className="font-semibold text-[var(--primary)]">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">로그인 화면을 불러오는 중...</p>}>
      <LoginForm />
    </Suspense>
  );
}
