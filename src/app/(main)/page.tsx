import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="card p-8">
        <p className="text-sm font-semibold text-[var(--primary)]">Youngeun Office</p>
        <h1 className="mt-2 text-3xl font-bold">교육관 회의실 예약</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          회원가입 후 회의실을 예약하고, 예약 당일 현장 태블릿 QR로 체크인하세요. 예약 시간은 30분
          단위로 오전 6시부터 오후 10시까지 가능합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary">
            회원가입
          </Link>
          <Link href="/login" className="btn btn-secondary">
            로그인
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <h2 className="font-semibold">사용자</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            회원가입 후 예약·히스토리·체크인을 이용합니다.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">태블릿</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            관리자가 등록한 태블릿 계정으로 로그인 후 QR을 노출합니다.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">관리자</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            관리자 계정으로 로그인하면 관리 화면으로 연결됩니다.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">현장 체크인</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            회의실 입구 태블릿 QR을 스캔하여 체크인합니다.
          </p>
        </div>
      </section>
    </div>
  );
}
