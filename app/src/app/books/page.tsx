"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Book } from "@/components/client";
import { MemberHeader, useMember } from "@/components/Header";
import { Icon, LinkButton, Page, Skeleton, StateBox, StatusBadge } from "@/components/ui";

export default function BooksPage() {
  const router = useRouter();
  const member = useMember();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setError(false);
    setBooks(null);
    const r = await api<{ books: Book[] }>("/api/books");
    if (r.status === 401) return router.replace("/");
    if (!r.ok) return setError(true);
    setBooks(r.data.books ?? []);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!books) return [];
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter((b) =>
      [b.title, b.author, b.publisher].some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [books, q]);

  return (
    <>
      <MemberHeader name={member?.name} />
      <Page>
        <div className="relative mb-3">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목, 저자, 출판사로 찾기"
            className="w-full min-h-[60px] rounded-xl border border-paper-strong bg-white pl-12 pr-4 text-[18px] shadow-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3">
          <LinkButton href="/scan" variant="secondary">
            <Icon name="barcode_scanner" /> 바코드로 찾기
          </LinkButton>
          <LinkButton href="/my" variant="secondary">
            <Icon name="menu_book" /> 내 대출
          </LinkButton>
        </div>

        {error ? (
          <StateBox text="책 목록을 불러오지 못했어요" onRetry={load} />
        ) : !books ? (
          <Skeleton />
        ) : books.length === 0 ? (
          <StateBox text="아직 등록된 책이 없어요. 관리자에게 알려 주세요" />
        ) : filtered.length === 0 ? (
          <StateBox text={`'${q.trim()}'은(는) 우리 도서실에 없는 책이에요`} />
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/books/${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-paper-surface px-5 py-5 shadow-sm transition-colors hover:bg-paper-strong"
                >
                  <div className="min-w-0">
                    <p className="font-heading truncate text-[20px] text-ink">{b.title}</p>
                    <p className="truncate text-[16px] text-ink-muted">
                      {[b.author, b.publisher].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Page>
    </>
  );
}
