"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/components/client";
import { Button, ErrorText, Field, Input, LinkButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ member: { id: string; name: string } | null }>("/api/me").then((r) => {
      if (r.ok && r.data.member) router.replace("/books");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || pin.length !== 4) {
      setErr("이름 또는 PIN이 맞지 않아요");
      return;
    }
    setBusy(true);
    const r = await api("/api/auth/login", { body: { name: name.trim(), pin } });
    setBusy(false);
    if (r.ok) router.replace("/books");
    else if (r.status === 403) setErr("아직 관리자 승인 전이에요. 승인되면 들어올 수 있어요");
    else if (r.status === 401) setErr("이름 또는 PIN이 맞지 않아요");
    else if (r.status === 429) setErr("잠시 후 다시 시도해 주세요 (5분)");
    else setErr("연결에 실패했어요. 다시 시도해 주세요");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-8 pt-16">
      <div className="mb-10 text-center">
        <h1 className="text-[34px] text-ink">교회 도서실</h1>
        <p className="mt-2 text-[18px] text-ink-2">책을 빌리고 반납해요</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="이름">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" placeholder="이름" />
        </Field>
        <Field label="PIN 4자리">
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            pattern="[0-9]*"
            type="password"
            maxLength={4}
            autoComplete="current-password"
            placeholder="숫자 4자리"
            className="tracking-[0.4em]"
          />
        </Field>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" disabled={busy} className="mt-2 w-full">
          {busy ? "확인 중…" : "들어가기"}
        </Button>
        <LinkButton href="/signup" variant="secondary" className="w-full">
          처음이에요 · 가입 신청
        </LinkButton>
      </form>
      <div className="mt-auto pt-12 text-center">
        <Link href="/admin" className="text-[15px] text-ink-muted underline underline-offset-4">
          관리자
        </Link>
      </div>
    </main>
  );
}
