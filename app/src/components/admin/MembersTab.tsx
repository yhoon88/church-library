"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/client";
import { fmtFull } from "@/lib/dates";
import {
  Button,
  ConfirmModal,
  ErrorText,
  Field,
  Icon,
  InfoText,
  Input,
  Skeleton,
  SmallButton,
  StateBox,
} from "@/components/ui";

type Pending = { id: string; name: string; created_at: string };
type Approved = { id: string; name: string; created_at: string; active_loans: number };
type Data = { pending: Pending[]; approved: Approved[] };

type Confirm = { kind: "reject" | "delete"; id: string; name: string } | null;

export default function MembersTab({ kick }: { kick: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setData(null);
    const r = await api<Data>("/api/members");
    if (r.status === 401) return kick();
    if (!r.ok) return setError(true);
    setData({ pending: r.data.pending ?? [], approved: r.data.approved ?? [] });
  }, [kick]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(m: string, e = "") {
    setMsg(m);
    setErr(e);
  }

  async function approve(p: Pending) {
    flash("");
    const r = await api(`/api/members/${p.id}`, { method: "PATCH", body: { action: "approve" } });
    if (r.status === 401) return kick();
    if (!r.ok) return flash("", "승인하지 못했어요. 다시 시도해 주세요");
    flash(`${p.name}님을 승인했어요`);
    load();
  }

  async function doConfirm() {
    if (!confirm) return;
    setBusy(true);
    flash("");
    const r = await api(`/api/members/${confirm.id}`, { method: "DELETE" });
    setBusy(false);
    const c = confirm;
    setConfirm(null);
    if (r.status === 401) return kick();
    if (r.status === 409) return flash("", "빌린 책이 있는 회원은 삭제할 수 없어요");
    if (!r.ok) return flash("", "처리하지 못했어요. 다시 시도해 주세요");
    flash(c.kind === "reject" ? `${c.name}님의 신청을 거절했어요` : `${c.name}님을 삭제했어요`);
    load();
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    if (!name.trim()) return setFormErr("이름을 입력해 주세요");
    if (pin.length !== 4) return setFormErr("PIN은 숫자 4자리예요");
    setSaving(true);
    const r = await api("/api/members", { body: { name: name.trim(), pin } });
    setSaving(false);
    if (r.status === 401) return kick();
    if (r.status === 409) return setFormErr("같은 이름이 있어요. 이름 뒤에 구분을 붙여 주세요 (예: 김민준(초3))");
    if (!r.ok) return setFormErr("저장하지 못했어요. 다시 시도해 주세요");
    flash(`${name.trim()}님을 등록했어요`);
    setName("");
    setPin("");
    setFormOpen(false);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      {formOpen ? (
        <form onSubmit={register} className="flex flex-col gap-4 rounded-xl bg-paper-surface p-5">
          <h2 className="text-[20px] text-ink">회원 직접 등록</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="이름">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="PIN 4자리">
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="off"
                placeholder="숫자 4자리"
              />
            </Field>
          </div>
          <ErrorText>{formErr}</ErrorText>
          <div className="grid grid-cols-2 gap-3 md:flex md:justify-end">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중…" : "등록"}
            </Button>
          </div>
        </form>
      ) : (
        <Button className="w-full md:w-auto md:self-start" onClick={() => setFormOpen(true)}>
          <Icon name="person_add" /> 회원 직접 등록
        </Button>
      )}

      <InfoText>{msg}</InfoText>
      <ErrorText>{err}</ErrorText>

      {error ? (
        <StateBox text="불러오지 못했어요" onRetry={load} />
      ) : !data ? (
        <Skeleton />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-[20px] text-ink">승인 대기</h2>
            {data.pending.length === 0 ? (
              <StateBox text="승인 대기 중인 신청이 없어요" />
            ) : (
              <ul className="flex flex-col gap-3">
                {data.pending.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 rounded-xl bg-paper-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-[19px] font-semibold text-ink">{p.name}</p>
                      <p className="text-[15px] text-ink-muted">신청일 {fmtFull(p.created_at)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <SmallButton variant="primary" onClick={() => approve(p)}>
                        승인
                      </SmallButton>
                      <SmallButton onClick={() => setConfirm({ kind: "reject", id: p.id, name: p.name })}>
                        거절
                      </SmallButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[20px] text-ink">회원</h2>
            {data.approved.length === 0 ? (
              <StateBox text="아직 회원이 없어요" />
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {data.approved.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper-surface px-4 py-3">
                    <p className="min-w-0 truncate text-[18px] font-semibold text-ink">{m.name}</p>
                    {m.active_loans > 0 ? (
                      <SmallButton disabled className="text-ink-muted" title="빌린 책이 있는 회원은 삭제할 수 없어요">
                        삭제 불가 (대출 중)
                      </SmallButton>
                    ) : (
                      <SmallButton className="text-late" onClick={() => setConfirm({ kind: "delete", id: m.id, name: m.name })}>
                        삭제
                      </SmallButton>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmModal
        open={!!confirm}
        message={
          confirm ? (confirm.kind === "reject" ? `${confirm.name}님의 신청을 거절할까요?` : `${confirm.name}님을 삭제할까요?`) : ""
        }
        confirmText={confirm?.kind === "reject" ? "거절" : "삭제"}
        danger
        busy={busy}
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
