"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TabletLogoutButton } from "@/components/TabletLogoutButton";

type TabletMe = {
  roomName: string | null;
  tabletCheckinEnabled: boolean;
};

export default function TabletHomePage() {
  const [me, setMe] = useState<TabletMe | null>(null);

  useEffect(() => {
    fetch("/api/tablet/me")
      .then((res) => res.json())
      .then(setMe);
  }, []);

  return (
    <div className="tablet-screen">
      <div className="tablet-card">
        <div className="tablet-title">Youngeun Office</div>
        <div className="tablet-subtitle">교육관 회의실 예약 · 태블릿 모드</div>
        {me?.roomName ? (
          <p className="tablet-info">
            연결 회의실: <strong>{me.roomName}</strong>
          </p>
        ) : null}
        <p className="tablet-info">
          {me?.tabletCheckinEnabled
            ? "해당 회의실의 체크인 QR 또는 예약 사이트 안내 QR을 표시합니다."
            : "체크인이 비활성화되어 있습니다. 사이트 안내 QR만 이용할 수 있습니다."}
        </p>
        <div className="tablet-nav">
          {me?.tabletCheckinEnabled ? (
            <Link href="/tablet/checkin" className="tablet-btn tablet-btn-primary">
              체크인 QR
            </Link>
          ) : null}
          <Link href="/tablet/guide" className="tablet-btn">
            사이트 안내 QR
          </Link>
          <TabletLogoutButton />
        </div>
      </div>
    </div>
  );
}
