"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { api, type Book } from "@/components/client";
import { MemberHeader, useMember } from "@/components/Header";
import { Button, ErrorText, Input, LinkButton, Page, PageTitle } from "@/components/ui";

export default function ScanPage() {
  const router = useRouter();
  const member = useMember();
  const [noCamera, setNoCamera] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  async function find(code: string) {
    const clean = code.replace(/[^0-9Xx]/g, "");
    if (!clean) return;
    setErr("");
    setBusy(true);
    const r = await api<{ books: Book[] }>(`/api/books?isbn=${encodeURIComponent(clean)}`);
    setBusy(false);
    if (r.status === 401) return router.replace("/");
    if (!r.ok) {
      setErr("연결에 실패했어요. 다시 시도해 주세요");
      setScanKey((k) => k + 1);
      return;
    }
    const b = r.data.books?.[0];
    if (b) router.push(`/books/${b.id}`);
    else {
      setErr("이 바코드의 책은 우리 도서실에 없어요");
      setScanKey((k) => k + 1);
    }
  }

  return (
    <>
      <MemberHeader name={member?.name} />
      <Page>
        <PageTitle>바코드로 찾기</PageTitle>
        <div className="flex flex-col gap-5">
          {noCamera ? (
            <ErrorText>이 폰에서는 카메라를 쓸 수 없어요. ISBN 숫자를 입력해 주세요</ErrorText>
          ) : (
            <>
              <BarcodeScanner key={scanKey} onDetected={find} onUnavailable={() => setNoCamera(true)} />
              <p className="text-center text-[17px] text-ink-2">책 뒤의 바코드를 네모 안에 맞춰 주세요</p>
            </>
          )}
          <ErrorText>{err}</ErrorText>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              find(isbn);
            }}
          >
            <label className="text-[16px] font-semibold text-ink-2" htmlFor="isbn">
              ISBN 숫자 직접 입력
            </label>
            <div className="flex gap-3">
              <Input
                id="isbn"
                inputMode="numeric"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="예: 9788932819932"
              />
              <Button type="submit" disabled={busy || !isbn.trim()} className="shrink-0">
                {busy ? "찾는 중…" : "찾기"}
              </Button>
            </div>
          </form>
          <LinkButton href="/books" variant="secondary" className="w-full">
            닫기
          </LinkButton>
        </div>
      </Page>
    </>
  );
}
