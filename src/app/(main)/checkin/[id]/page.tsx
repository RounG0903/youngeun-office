import { Suspense } from "react";
import CheckinClient from "./CheckinClient";

export default function CheckinPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">체크인 처리 중...</p>}>
      <CheckinClient />
    </Suspense>
  );
}
