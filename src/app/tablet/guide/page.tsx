"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TabletLogoutButton } from "@/components/TabletLogoutButton";

type GuideData = {
  siteUrl: string;
  qrDataUrl: string;
  title: string;
  description: string;
};

type TabletMe = {
  tabletCheckinEnabled: boolean;
};

export default function TabletGuidePage() {
  const [data, setData] = useState<GuideData | null>(null);
  const [me, setMe] = useState<TabletMe | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/tablet/guide").then((res) => res.json()),
      fetch("/api/tablet/me").then((res) => res.json()),
    ]).then(([guide, tabletMe]) => {
      setData(guide);
      setMe(tabletMe);
    });
  }, []);

  return (
    <div className="tablet-screen">
      <div className="tablet-card">
        <div className="tablet-title">예약 사이트 안내</div>
        <div className="tablet-subtitle">QR을 스캔하여 회의실 예약 사이트로 이동</div>

        {data ? (
          <>
            <p className="tablet-info">
              <strong>{data.title}</strong>
              <br />
              {data.description}
              <br />
              {data.siteUrl}
            </p>
            <div className="tablet-qr">
              <img src={data.qrDataUrl} alt="사이트 안내 QR" width={360} height={360} />
            </div>
          </>
        ) : (
          <p className="tablet-info">QR을 불러오는 중...</p>
        )}

        <div className="tablet-nav">
          <Link href="/tablet" className="tablet-btn">
            태블릿 홈
          </Link>
          {me?.tabletCheckinEnabled ? (
            <Link href="/tablet/checkin" className="tablet-btn tablet-btn-primary">
              체크인 QR
            </Link>
          ) : null}
          <TabletLogoutButton />
        </div>
      </div>
    </div>
  );
}
