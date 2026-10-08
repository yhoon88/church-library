"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, type Book } from "@/components/client";
import { MemberHeader, useMember } from "@/components/Header";
import { fmtDate } from "@/lib/dates";
import {
  Button,
  ConfirmModal,
  ErrorText,
  Icon,
  InfoText,
  LinkButton,
  Page,
  StateBox,
  StatusBadge,
} from "@/components/ui";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const member = useMember();
  const [book, setBook] = useState<Book | null>(null);
  const [state, setState] = useState<"loading" | "error" | "notfound" | "ok">("loading");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    const r = await api<{ book: Book }>(`/api/books/${id}`);
    if (r.status === 401) return router.replace("/");
    if (r.status === 404) return setState("notfound");
    if (!r.ok || !r.data.book) return setState("error");
    setBook(r.data.book);
    setState("ok");
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function doReturn() {
    if (!book?.loan_id) return;
    setBusy(true);
    setErr("");
    const r = await api(`/api/loans/${book.loan_id}/return`, { method: "POST" });
    setBusy(false);
    setConfirm(false);
    if (r.status === 401) return router.replace("/");
    if (!r.ok) return setErr("반납하지 못했어요. 다시 시도해 주세요");
    setMsg("반납했어요");
    await load();
  }

  return (
    <>
      <MemberHeader name={member?.name} />
      <Page>
        <button
          type="button"
          onClick={() => router.push("/books")}
          className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-[16px] text-ink-2"
        >
          <Icon name="arrow_back" /> 목록으로
        </button>

        {state === "loading" && <StateBox text="불러오는 중…" />}
        {state === "error" && <StateBox text="책 정보를 불러오지 못했어요" onRetry={load} />}
        {state === "notfound" && <StateBox text="이 책은 우리 도서실에 없어요" />}
        {state === "ok" && book && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl bg-paper-surface p-6">
              <div className="mb-4">
                <StatusBadge status={book.status} />
              </div>
              <h1 className="mb-5 text-[28px] leading-snug text-ink">{book.title}</h1>
              <dl className="grid grid-cols-[5rem_1fr] gap-y-3 text-[17px]">
                <dt className="text-ink-muted">저자</dt>
                <dd className="text-ink">{book.author || "-"}</dd>
                <dt className="text-ink-muted">출판사</dt>
                <dd className="text-ink">{book.publisher || "-"}</dd>
                <dt className="text-ink-muted">ISBN</dt>
                <dd className="break-all text-ink">{book.isbn || "-"}</dd>
              </dl>
            </div>

            <InfoText>{msg}</InfoText>
            <ErrorText>{err}</ErrorText>

            {book.status === "available" ? (
              <LinkButton href={`/books/${book.id}/borrow`} className="w-full text-[19px]">
                빌리기
              </LinkButton>
            ) : book.mine ? (
              <div className="flex flex-col gap-4">
                <p className={`text-center text-[19px] font-semibold ${book.status === "overdue" ? "text-late" : "text-ink"}`}>
                  반납 예정일: {book.due_date ? fmtDate(book.due_date) : "-"}
                </p>
                <Button className="w-full text-[19px]" onClick={() => setConfirm(true)}>
                  반납하기
                </Button>
              </div>
            ) : (
              <p className="rounded-xl bg-loan-bg px-5 py-5 text-center text-[18px] text-loan">
                지금은 대출 중이에요{book.due_date ? ` (반납 예정 ${fmtDate(book.due_date)})` : ""}
              </p>
            )}
          </div>
        )}
      </Page>
      <ConfirmModal
        open={confirm}
        message="이 책을 반납할까요?"
        confirmText="반납"
        busy={busy}
        onConfirm={doReturn}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
