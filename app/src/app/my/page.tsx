"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, type Loan } from "@/components/client";
import { MemberHeader, useMember } from "@/components/Header";
import { fmtDate } from "@/lib/dates";
import {
  Badge,
  ConfirmModal,
  ErrorText,
  InfoText,
  LinkButton,
  Page,
  PageTitle,
  Skeleton,
  SmallButton,
  StateBox,
} from "@/components/ui";

export default function MyLoansPage() {
  const router = useRouter();
  const member = useMember();
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [error, setError] = useState(false);
  const [target, setTarget] = useState<Loan | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setError(false);
    setLoans(null);
    const r = await api<{ loans: Loan[] }>("/api/loans?scope=mine");
    if (r.status === 401) return router.replace("/");
    if (!r.ok) return setError(true);
    setLoans(r.data.loans ?? []);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function doReturn() {
    if (!target) return;
    setBusy(true);
    setErr("");
    setMsg("");
    const r = await api(`/api/loans/${target.id}/return`, { method: "POST" });
    setBusy(false);
    setTarget(null);
    if (r.status === 401) return router.replace("/");
    if (!r.ok) return setErr("반납하지 못했어요. 다시 시도해 주세요");
    setMsg("반납했어요");
    load();
  }

  return (
    <>
      <MemberHeader name={member?.name} />
      <Page>
        <PageTitle>내 대출</PageTitle>
        <div className="mb-4 flex flex-col gap-3">
          <InfoText>{msg}</InfoText>
          <ErrorText>{err}</ErrorText>
        </div>
        {error ? (
          <StateBox text="불러오지 못했어요" onRetry={load} />
        ) : !loans ? (
          <Skeleton />
        ) : loans.length === 0 ? (
          <StateBox
            text="빌린 책이 없어요"
            action={
              <LinkButton href="/books" variant="primary">
                책 찾으러 가기
              </LinkButton>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {loans.map((l) => (
              <li
                key={l.id}
                className={`flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between ${l.overdue ? "bg-late-bg" : "bg-paper-surface"}`}
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <Link href={`/books/${l.book_id}`} className="font-heading text-[20px] text-ink">
                      {l.book_title}
                    </Link>
                    {l.overdue && <Badge tone="late">연체</Badge>}
                  </div>
                  <p className={`text-[17px] ${l.overdue ? "font-semibold text-late" : "text-ink-2"}`}>
                    반납 예정일: {fmtDate(l.due_date)}
                  </p>
                </div>
                <SmallButton variant={l.overdue ? "primary" : "secondary"} className="min-h-[52px] sm:w-36" onClick={() => setTarget(l)}>
                  반납하기
                </SmallButton>
              </li>
            ))}
          </ul>
        )}
      </Page>
      <ConfirmModal
        open={!!target}
        message="이 책을 반납할까요?"
        confirmText="반납"
        busy={busy}
        onConfirm={doReturn}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
