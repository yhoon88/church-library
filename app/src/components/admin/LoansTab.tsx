"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Loan } from "@/components/client";
import { fmtFull } from "@/lib/dates";
import {
  Badge,
  ConfirmModal,
  ErrorText,
  Icon,
  InfoText,
  LinkButton,
  Modal,
  Skeleton,
  SmallButton,
  StateBox,
  Button,
} from "@/components/ui";

type Scope = "active" | "returned";

export default function LoansTab({ kick }: { kick: () => void }) {
  const [scope, setScope] = useState<Scope>("active");
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [error, setError] = useState(false);
  const [target, setTarget] = useState<Loan | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setError(false);
    setLoans(null);
    const r = await api<{ loans: Loan[] }>(`/api/loans?scope=${scope}`);
    if (r.status === 401) return kick();
    if (!r.ok) return setError(true);
    setLoans(r.data.loans ?? []);
  }, [scope, kick]);

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
    const t = target;
    setTarget(null);
    if (r.status === 401) return kick();
    if (!r.ok) return setErr("반납 처리하지 못했어요. 다시 시도해 주세요");
    setMsg(`'${t.book_title}' 반납 처리했어요`);
    load();
  }

  const active = scope === "active";

  return (
    <div className="flex flex-col gap-5">
      <LinkButton href="/admin/lend" className="w-full md:w-auto md:self-start">
        <Icon name="add_circle" /> 대신 대출
      </LinkButton>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-strong p-1 md:max-w-sm">
        {(["active", "returned"] as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`min-h-[48px] rounded-lg text-[17px] font-semibold ${
              scope === s ? "bg-white text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            {s === "active" ? "대출 중" : "반납 완료"}
          </button>
        ))}
      </div>

      <InfoText>{msg}</InfoText>
      <ErrorText>{err}</ErrorText>

      {error ? (
        <StateBox text="불러오지 못했어요" onRetry={load} />
      ) : !loans ? (
        <Skeleton />
      ) : loans.length === 0 ? (
        <StateBox text={active ? "지금 빌려 간 책이 없어요" : "아직 반납 기록이 없어요"} />
      ) : (
        <>
          {/* 폰: 카드 */}
          <ul className="flex flex-col gap-3 md:hidden">
            {loans.map((l) => {
              const late = active && l.overdue;
              return (
                <li key={l.id} className={`rounded-xl p-4 ${late ? "bg-late-bg" : "bg-paper-surface"}`}>
                  <div className="flex gap-4">
                    {l.photo_url && (
                      <button type="button" onClick={() => setPhoto(l.photo_url)} className="shrink-0" aria-label="사진 크게 보기">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.photo_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-heading text-[19px] leading-snug text-ink">{l.book_title}</p>
                        {late && <Badge tone="late">연체</Badge>}
                      </div>
                      <p className="mb-2 flex items-center gap-1 text-[17px] font-semibold text-ink-2">
                        <Icon name="person" className="!text-[18px]" />
                        {l.member_name}
                      </p>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-[16px]">
                        <dt className="text-ink-muted">빌린 날</dt>
                        <dd className="text-right text-ink">{fmtFull(l.borrowed_at)}</dd>
                        {active ? (
                          <>
                            <dt className="text-ink-muted">반납 예정일</dt>
                            <dd className={`text-right font-semibold ${late ? "text-late" : "text-ink"}`}>
                              {fmtFull(l.due_date)}
                            </dd>
                          </>
                        ) : (
                          <>
                            <dt className="text-ink-muted">반납한 날</dt>
                            <dd className="text-right text-ink">{l.returned_at ? fmtFull(l.returned_at) : "-"}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                  {active && (
                    <SmallButton
                      variant={late ? "primary" : "secondary"}
                      className="mt-4 min-h-[52px] w-full"
                      onClick={() => setTarget(l)}
                    >
                      반납 처리
                    </SmallButton>
                  )}
                </li>
              );
            })}
          </ul>

          {/* 컴퓨터: 표 */}
          <div className="hidden overflow-hidden rounded-xl border border-paper-strong md:block">
            <table className="w-full text-left text-[16px]">
              <thead className="bg-paper-strong text-ink-2">
                <tr>
                  <th className="px-4 py-3 font-semibold">사진</th>
                  <th className="px-4 py-3 font-semibold">책 제목</th>
                  <th className="px-4 py-3 font-semibold">빌린 사람</th>
                  <th className="px-4 py-3 font-semibold">빌린 날</th>
                  <th className="px-4 py-3 font-semibold">{active ? "반납 예정일" : "반납한 날"}</th>
                  {active && <th className="px-4 py-3 font-semibold">상태</th>}
                  {active && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => {
                  const late = active && l.overdue;
                  return (
                    <tr key={l.id} className={`border-t border-paper-strong ${late ? "bg-late-bg" : "bg-paper-base"}`}>
                      <td className="px-4 py-3">
                        {l.photo_url ? (
                          <button type="button" onClick={() => setPhoto(l.photo_url)} aria-label="사진 크게 보기">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={l.photo_url} alt="" className="h-12 w-12 rounded-md object-cover" />
                          </button>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>
                      <td className="font-heading px-4 py-3 text-[17px] text-ink">{l.book_title}</td>
                      <td className="px-4 py-3 text-ink">{l.member_name}</td>
                      <td className="px-4 py-3 text-ink-2">{fmtFull(l.borrowed_at)}</td>
                      <td className={`px-4 py-3 ${late ? "font-semibold text-late" : "text-ink-2"}`}>
                        {active ? fmtFull(l.due_date) : l.returned_at ? fmtFull(l.returned_at) : "-"}
                      </td>
                      {active && (
                        <td className="px-4 py-3">{late ? <Badge tone="late">연체</Badge> : <Badge tone="loan">대출 중</Badge>}</td>
                      )}
                      {active && (
                        <td className="px-4 py-3 text-right">
                          <SmallButton variant={late ? "primary" : "secondary"} onClick={() => setTarget(l)}>
                            반납 처리
                          </SmallButton>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!target}
        message={target ? `'${target.book_title}'을 반납 처리할까요?` : ""}
        confirmText="반납"
        busy={busy}
        onConfirm={doReturn}
        onCancel={() => setTarget(null)}
      />
      <Modal open={!!photo} onClose={() => setPhoto(null)}>
        {photo && (
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="대출 사진" className="max-h-[70vh] w-full rounded-lg object-contain" />
            <Button variant="secondary" onClick={() => setPhoto(null)}>
              닫기
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
