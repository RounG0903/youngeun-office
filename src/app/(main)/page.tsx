import Link from "next/link";

export default function HomePage() {
  return (
    <div className="card p-5 sm:p-8">
      <p className="text-sm font-semibold ig-gradient-text">Youngeun Office</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">교육관 회의실 예약</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        회원가입 후 회의실을 예약하고, 예약 당일 현장 태블릿 QR로 체크인하세요. 예약 시간은 30분
        단위로 오전 6시부터 오후 10시까지 가능합니다.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/register" className="btn btn-primary w-full sm:w-auto">
          회원가입
        </Link>
        <Link href="/login" className="btn btn-secondary w-full sm:w-auto">
          로그인
        </Link>
      </div>
    </div>
  );
}
