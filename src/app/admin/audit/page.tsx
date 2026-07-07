"use client";

import { useEffect, useState } from "react";
import { getAuditActionLabel } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/reservation";

type AuditLog = {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
        setLogs(data.logs ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[var(--muted)]">거래 히스토리를 불러오는 중...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold">관리자 거래 히스토리</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        누가 어떤 관리 작업을 수행했는지 확인할 수 있습니다.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-3">시간</th>
              <th className="py-2 pr-3">작업자</th>
              <th className="py-2 pr-3">역할</th>
              <th className="py-2 pr-3">작업</th>
              <th className="py-2 pr-3">대상</th>
              <th className="py-2">상세</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-3 whitespace-nowrap">
                  {formatDateTime(new Date(log.createdAt))}
                </td>
                <td className="py-3 pr-3">{log.actorName}</td>
                <td className="py-3 pr-3">{log.actorRole}</td>
                <td className="py-3 pr-3">{getAuditActionLabel(log.action)}</td>
                <td className="py-3 pr-3">
                  {log.entityType ? `${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}` : "-"}
                </td>
                <td className="py-3">
                  <pre className="max-w-xs overflow-x-auto whitespace-pre-wrap text-xs text-[var(--muted)]">
                    {log.details ?? "-"}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
