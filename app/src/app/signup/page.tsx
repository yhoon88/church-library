"use client";

import { useState } from "react";
import { api } from "@/components/client";
import { Button, ErrorText, Field, Input, LinkButton } from "@/components/ui";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) {
      setErr("이름을 입력해 주세요");
      return;
    }
    if (pin.length !== 4) {
      setErr("PIN은 숫자 4자리예요");
      return;
    }
    if (pin !== pin2) {
      setErr("PIN이 서로 달라요");
      return;
    }
    setBusy(true);
    const r = await api("/api/auth/signup", { body: { name: name.trim(), pin } });
    setBusy(false);
    if (r.ok) setDone(true);
    else if (r.status === 409) setErr("같은 이름이 있어요. 이름 뒤에 구분을 붙여 주세요 (예: 김민준(초3))");
    else setErr("신청에 실패했어요. 다시 시도해 주세요");
  }

  const pinProps = {
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
    type: "password",
    maxLength: 4,
    placeholder: "숫자 4자리",
    autoComplete: "new-password",
    className: "tracking-[0.4em]",
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-8 pt-12">
      <h1 className="mb-8 text-center text-[30px] text-ink">{done ? "교회 도서실" : "가입 신청"}</h1>
      {done ? (
        <div className="flex flex-col gap-6">
          <p className="rounded-xl bg-ok-bg px-5 py-6 text-center text-[18px] font-medium text-ok">
            신청했어요! 관리자가 승인하면 로그인할 수 있어요
          </p>
          <LinkButton href="/" className="w-full">
            처음으로
          </LinkButton>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="이름">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" autoComplete="off" />
          </Field>
          <Field label="PIN 4자리">
            <Input {...pinProps} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </Field>
          <Field label="PIN 다시 입력">
            <Input {...pinProps} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </Field>
          <ErrorText>{err}</ErrorText>
          <Button type="submit" disabled={busy} className="mt-2 w-full">
            {busy ? "신청 중…" : "가입 신청"}
          </Button>
          <LinkButton href="/" variant="secondary" className="w-full">
            돌아가기
          </LinkButton>
        </form>
      )}
    </main>
  );
}
