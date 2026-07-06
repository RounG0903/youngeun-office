"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TabletLogoutButton } from "@/components/TabletLogoutButton";
import { formatTimeRange } from "@/lib/reservation";

type CheckinData = {
  checkinEnabled: boolean;
  roomName?: string;
  reservation: {
    title: string;
    roomName: string;
    userName: string;
    startTime: string;
    endTime: string;
  } | null;
  qrDataUrl?: string;
  message?: string;
};

export default function TabletCheckinPage() {
  const [data, setData] = useState<CheckinData | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/tablet/checkin");
      const json = await res.json();
      setData(json);
    }

    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tablet-screen">
      <div className="tablet-card">
        <div className="tablet-title">체크인 QR</div>
        <div className="tablet-subtitle">
          {data?.roomName ? `${data.roomName} · 예약자가 스캔하여 체크인` : "예약자가 스캔하여 체크인합니다"}
        </div>

        {data?.checkinEnabled === false ? (
          <p className="tablet-info">{data.message ?? "태블릿 체크인이 비활성화되어 있습니다."}</p>
        ) : data?.reservation && data.qrDataUrl ? (
          <>
            <div className="tablet-info">
              <strong>{data.reservation.title}</strong>
              <br />
              {data.reservation.roomName} · {data.reservation.userName}
              <br />
              {formatTimeRange(
                new Date(data.reservation.startTime),
                new Date(data.reservation.endTime),
              )}
            </div>
            <div className="tablet-qr">
              <img src={data.qrDataUrl} alt="체크인 QR" width={360} height={360} />
            </div>
          </>
        ) : (
          <p className="tablet-info">{data?.message ?? "체크인 대기 예약이 없습니다."}</p>
        )}

        <div className="tablet-nav">
          <Link href="/tablet" className="tablet-btn">
            태블릿 홈
          </Link>
          <Link href="/tablet/guide" className="tablet-btn">
            사이트 안내 QR
          </Link>
          <TabletLogoutButton />
        </div>
      </div>
    </div>
  );
}
