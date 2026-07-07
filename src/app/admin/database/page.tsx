"use client";

import { useEffect, useState } from "react";

const TABLES = [
  "User",
  "MeetingRoom",
  "Reservation",
  "SystemConfig",
  "PhoneVerification",
  "AuditLog",
];

export default function AdminDatabasePage() {
  const [table, setTable] = useState("User");
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [createJson, setCreateJson] = useState("{}");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRecords(nextTable = table) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/database/${nextTable}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "불러오기 실패");
      return;
    }
    setRecords(data.records ?? []);
    setSelectedId(null);
    setEditJson("");
  }

  useEffect(() => {
    loadRecords();
  }, [table]);

  function selectRecord(record: Record<string, unknown>) {
    const id = String(record.id ?? "");
    setSelectedId(id);
    setEditJson(JSON.stringify(record, null, 2));
  }

  async function saveRecord() {
    if (!selectedId) return;
    setMessage("");
    setError("");
    try {
      const data = JSON.parse(editJson);
      const res = await fetch(`/api/admin/database/${table}/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "저장 실패");
      setMessage("레코드가 수정되었습니다.");
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    }
  }

  async function deleteRecord() {
    if (!selectedId) return;
    if (!confirm("이 레코드를 삭제하시겠습니까?")) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/database/${table}/${selectedId}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error ?? "삭제 실패");
      return;
    }
    setMessage(result.message);
    await loadRecords();
  }

  async function createRecord() {
    setMessage("");
    setError("");
    try {
      const data = JSON.parse(createJson);
      const res = await fetch("/api/admin/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, data }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "생성 실패");
      setMessage("레코드가 생성되었습니다.");
      setCreateJson("{}");
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold">DB 관리</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          서버 관리자 전용 · 데이터베이스 테이블을 조회하고 수정할 수 있습니다.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium" htmlFor="db-table">
            테이블
          </label>
          <select
            id="db-table"
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="rounded-[10px] border border-[var(--border)] px-3 py-2"
          >
            {TABLES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary" onClick={() => loadRecords()}>
            새로고침
          </button>
        </div>

        {message ? <div className="alert alert-success mt-4">{message}</div> : null}
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}

        {loading ? (
          <p className="mt-4 text-[var(--muted)]">레코드를 불러오는 중...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2">데이터 미리보기</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const id = String(record.id ?? "");
                  return (
                    <tr
                      key={id}
                      className={`cursor-pointer border-b border-[var(--border)] ${
                        selectedId === id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => selectRecord(record)}
                    >
                      <td className="py-3 pr-3 font-mono text-xs">{id}</td>
                      <td className="py-3">
                        <pre className="max-w-2xl overflow-x-auto whitespace-pre-wrap text-xs text-[var(--muted)]">
                          {JSON.stringify(record, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold">레코드 수정</h3>
        <textarea
          value={editJson}
          onChange={(e) => setEditJson(e.target.value)}
          className="mt-3 h-56 w-full rounded-[10px] border border-[var(--border)] p-3 font-mono text-xs"
          placeholder="레코드를 선택하면 JSON이 표시됩니다."
        />
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn btn-primary" onClick={saveRecord} disabled={!selectedId}>
            저장
          </button>
          <button type="button" className="btn btn-secondary text-[var(--danger)]" onClick={deleteRecord} disabled={!selectedId}>
            삭제
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold">레코드 생성</h3>
        <textarea
          value={createJson}
          onChange={(e) => setCreateJson(e.target.value)}
          className="mt-3 h-40 w-full rounded-[10px] border border-[var(--border)] p-3 font-mono text-xs"
        />
        <button type="button" className="btn btn-primary mt-3" onClick={createRecord}>
          생성
        </button>
      </div>
    </div>
  );
}
