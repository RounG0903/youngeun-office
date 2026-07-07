import Link from "next/link";

export default function HomePage() {
  return (
    <div className="ig-auth-page">
      <h1 className="ig-auth-logo ig-gradient-text">Youngeun Office</h1>

      <div className="ig-auth-card text-center">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          회원가입 후 회의실을 예약하고,
          <br />
          예약 당일 현장 태블릿 QR로 체크인하세요.
        </p>
        <Link href="/login" className="btn btn-primary mt-6 w-full py-2">
          로그인
        </Link>
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
