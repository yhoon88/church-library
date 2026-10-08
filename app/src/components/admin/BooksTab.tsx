"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Book } from "@/components/client";
import {
  ConfirmModal,
  ErrorText,
  Icon,
  InfoText,
  LinkButton,
  Skeleton,
  SmallButton,
  StateBox,
  StatusBadge,
} from "@/components/ui";

export default function BooksTab({ kick }: { kick: () => void }) {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Book | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setError(false);
    setBooks(null);
    const r = await api<{ books: Book[] }>("/api/books");
    if (r.status === 401) return kick();
    if (!r.ok) return setError(true);
    setBooks(r.data.books ?? []);
  }, [kick]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!books) return [];
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter((b) =>
      [b.title, b.author, b.publisher, b.isbn].some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [books, q]);

  async function doDelete() {
    if (!target) return;
    setBusy(true);
    setErr("");
    setMsg("");
    const r = await api(`/api/books/${target.id}`, { method: "DELETE" });
    setBusy(false);
    const t = target;
    setTarget(null);
    if (r.status === 401) return kick();
    if (r.status === 409) return setErr("대출 중인 책은 삭제할 수 없어요");
    if (!r.ok) return setErr("삭제하지 못했어요. 다시 시도해 주세요");
    setMsg(`'${t.title}'을 삭제했어요`);
    load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목, 저자, 출판사로 찾기"
            className="w-full min-h-[56px] rounded-xl border border-paper-strong bg-white pl-12 pr-4 text-[18px] placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <LinkButton href="/admin/books/new">
            <Icon name="add" /> 책 추가
          </LinkButton>
          <LinkButton href="/admin/import" variant="secondary">
            <Icon name="upload_file" /> 엑셀 올리기
          </LinkButton>
        </div>
      </div>

      <InfoText>{msg}</InfoText>
      <ErrorText>{err}</ErrorText>

      {error ? (
        <StateBox text="불러오지 못했어요" onRetry={load} />
      ) : !books ? (
        <Skeleton />
      ) : books.length === 0 ? (
        <StateBox text="아직 등록된 책이 없어요. '책 추가'나 '엑셀 올리기'로 시작하세요" />
      ) : filtered.length === 0 ? (
        <StateBox text={`'${q.trim()}'은(는) 우리 도서실에 없는 책이에요`} />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((b) => {
            const onLoan = b.status !== "available";
            return (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-xl bg-paper-surface p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 md:justify-start">
                    <p className="font-heading text-[19px] leading-snug text-ink">{b.title}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-[16px] text-ink-muted">
                    {[b.author, b.publisher].filter(Boolean).join(" · ") || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
                  <Link
                    href={`/admin/books/${b.id}/edit`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-paper-strong px-4 text-[16px] font-semibold text-ink"
                  >
                    수정
                  </Link>
                  {onLoan ? (
                    <SmallButton disabled className="text-ink-muted" title="대출 중인 책은 삭제할 수 없어요">
                      삭제 불가 (대출 중)
                    </SmallButton>
                  ) : (
                    <SmallButton className="text-late" onClick={() => setTarget(b)}>
                      삭제
                    </SmallButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={!!target}
        message={target ? `'${target.title}'을 삭제할까요?` : ""}
        confirmText="삭제"
        danger
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
