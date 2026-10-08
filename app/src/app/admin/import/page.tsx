"use client";

import { useRef, useState } from "react";
import AdminGate from "@/components/AdminGate";
import { api } from "@/components/client";
import { Button, ErrorText, Icon, InfoText, LinkButton, PageTitle } from "@/components/ui";

type Row = { title: string; author: string; publisher: string; isbn: string };

export default function ImportPage() {
  return <AdminGate wide={false}>{(kick) => <Import kick={kick} />}</AdminGate>;
}

function Import({ kick }: { kick: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function onFile(f: File) {
    setErr("");
    setResult("");
    setRows(null);
    setFileName(f.name);
    try {
      const XLSX = await import("xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("no sheet");
      const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: "" });
      const cell = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
      const parsed: Row[] = raw
        .slice(1)
        .map((r) => ({
          title: cell(r[0]),
          author: cell(r[1]),
          publisher: cell(r[2]),
          isbn: cell(r[3]).replace(/[^0-9Xx]/g, ""),
        }))
        .filter((r) => r.title);
      if (parsed.length === 0) throw new Error("empty");
      setRows(parsed);
    } catch {
      setErr("파일을 읽지 못했어요. 열 순서를 확인해 주세요");
    }
  }

  async function submit() {
    if (!rows?.length) return;
    setBusy(true);
    setErr("");
    const r = await api<{ added: number; skipped: number }>("/api/books/import", { body: { rows } });
    setBusy(false);
    if (r.status === 401) return kick();
    if (!r.ok) return setErr("등록하지 못했어요. 다시 시도해 주세요");
    setResult(`추가 ${r.data.added ?? 0}권, 건너뜀 ${r.data.skipped ?? 0}권(이미 있는 책)`);
    setRows(null);
    setFileName("");
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>엑셀 올리기</PageTitle>
      <p className="rounded-xl bg-paper-surface px-5 py-4 text-[17px] text-ink-2">
        열 순서: 제목 / 저자 / 출판사 / ISBN (첫 줄은 제목 줄)
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button variant="secondary" className="w-full" onClick={() => inputRef.current?.click()}>
        <Icon name="upload_file" /> 파일 선택
      </Button>
      {fileName && <p className="text-[16px] text-ink-muted">{fileName}</p>}

      <ErrorText>{err}</ErrorText>
      <InfoText>{result}</InfoText>

      {rows && (
        <>
          <div className="overflow-x-auto rounded-xl border border-paper-strong">
            <table className="w-full min-w-[520px] text-left text-[15px]">
              <thead className="bg-paper-strong text-ink-2">
                <tr>
                  <th className="px-3 py-2 font-semibold">제목</th>
                  <th className="px-3 py-2 font-semibold">저자</th>
                  <th className="px-3 py-2 font-semibold">출판사</th>
                  <th className="px-3 py-2 font-semibold">ISBN</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t border-paper-strong">
                    <td className="px-3 py-2 text-ink">{r.title}</td>
                    <td className="px-3 py-2 text-ink-2">{r.author}</td>
                    <td className="px-3 py-2 text-ink-2">{r.publisher}</td>
                    <td className="px-3 py-2 text-ink-2">{r.isbn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && <p className="text-[15px] text-ink-muted">처음 10줄만 보여요</p>}
          <Button className="w-full text-[19px]" disabled={busy} onClick={submit}>
            {busy ? "등록 중…" : `${rows.length}권 등록하기`}
          </Button>
        </>
      )}

      <LinkButton href="/admin?tab=books" variant="secondary" className="w-full">
        돌아가기
      </LinkButton>
    </div>
  );
}
