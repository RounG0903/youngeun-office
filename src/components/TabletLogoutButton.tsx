"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TabletLogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "로그아웃에 실패했습니다.");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="tablet-btn">
        로그아웃
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="field">
        <label htmlFor="logout-pin" className="text-sm">
          로그아웃 PIN
        </label>
        <input
          id="logout-pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-24 text-black bg-white"
          autoFocus
          required
        />
      </div>
      <button type="submit" className="tablet-btn" disabled={loading}>
        {loading ? "확인 중..." : "확인"}
      </button>
      <button
        type="button"
        className="tablet-btn"
        onClick={() => {
          setOpen(false);
          setPin("");
          setError("");
        }}
      >
        취소
      </button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
