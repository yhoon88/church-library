"use client";

import { useCallback, useState, type ReactNode } from "react";
import { api } from "./client";
import { AdminHeader, useAdmin } from "./Header";
import { Button, ErrorText, Field, Input, LinkButton, Page, StateBox } from "./ui";

/** 관리자 확인. 아니면 M1 로그인 화면. children(kick) — kick() 호출하면 다시 M1로 */
export default function AdminGate({ children, wide = true }: { children: (kick: () => void) => ReactNode; wide?: boolean }) {
  const { admin, setAdmin, failed, recheck } = useAdmin();
  const kick = useCallback(() => setAdmin(false), [setAdmin]);

  if (failed)
    return (
      <>
        <AdminHeader showLogout={false} />
        <Page>
          <StateBox text="연결에 실패했어요. 다시 시도해 주세요" onRetry={recheck} />
        </Page>
      </>
    );
  if (admin === null)
    return (
      <>
        <AdminHeader showLogout={false} />
        <Page>
          <StateBox text="불러오는 중…" />
        </Page>
      </>
    );
  if (!admin) return <AdminLogin onDone={() => setAdmin(true)} />;
  return (
    <>
      <AdminHeader />
      <Page wide={wide}>{children(kick)}</Page>
    </>
  );
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw) return;
    setErr("");
    setBusy(true);
    const r = await api("/api/admin/login", { body: { password: pw } });
    setBusy(false);
    if (r.ok) onDone();
    else if (r.status === 401) setErr("비밀번호가 맞지 않아요");
    else if (r.status === 429) setErr("잠시 후 다시 시도해 주세요 (5분)");
    else setErr("연결에 실패했어요. 다시 시도해 주세요");
  }

  return (
    <>
      <AdminHeader showLogout={false} />
      <main className="mx-auto w-full max-w-[440px] px-5 pb-10 pt-12">
        <h1 className="mb-8 text-center text-[28px] text-ink">관리자 로그인</h1>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="관리자 비밀번호">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          </Field>
          <ErrorText>{err}</ErrorText>
          <Button type="submit" disabled={busy || !pw} className="w-full">
            {busy ? "확인 중…" : "들어가기"}
          </Button>
          <LinkButton href="/" variant="secondary" className="w-full">
            돌아가기
          </LinkButton>
        </form>
      </main>
    </>
  );
}
