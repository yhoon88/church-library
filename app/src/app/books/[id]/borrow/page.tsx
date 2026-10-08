"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, uploadPhoto, type Book } from "@/components/client";
import { MemberHeader, useMember } from "@/components/Header";
import PhotoPicker from "@/components/PhotoPicker";
import { addDays, fmtDate, todayKST } from "@/lib/dates";
import { Button, ErrorText, Field, InfoText, Input, LinkButton, Page, PageTitle, StateBox } from "@/components/ui";

export default function BorrowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const member = useMember();
  const [book, setBook] = useState<Book | null>(null);
  const [state, setState] = useState<"loading" | "error" | "ok">("loading");
  const [due, setDue] = useState(() => addDays(todayKST(), 14));
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    const r = await api<{ book: Book }>(`/api/books/${id}`);
    if (r.status === 401) return router.replace("/");
    if (!r.ok || !r.data.book) return setState("error");
    setBook(r.data.book);
    setState("ok");
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function borrow(skipPhoto = false) {
    if (!book) return;
    setErr("");
    setPhotoFailed(false);
    if (!due || due < todayKST()) {
      setErr("반납 예정일을 확인해 주세요");
      return;
    }
    setBusy(true);
    let photoPath: string | undefined;
    if (photo && !skipPhoto) {
      const p = await uploadPhoto(photo);
      if (!p) {
        setBusy(false);
        setPhotoFailed(true);
        return;
      }
      photoPath = p;
    }
    const r = await api("/api/loans", { body: { bookId: book.id, dueDate: due, photoPath } });
    setBusy(false);
    if (r.status === 401) return router.replace("/");
    if (r.status === 409) return setErr("방금 다른 분이 빌렸어요");
    if (!r.ok) return setErr("저장하지 못했어요. 다시 시도해 주세요");
    setDone(`대출했어요! ${fmtDate(due)}까지 반납해 주세요`);
    setTimeout(() => router.push("/my"), 1600);
  }

  return (
    <>
      <MemberHeader name={member?.name} />
      <Page>
        <PageTitle>대출하기</PageTitle>
        {state === "loading" && <StateBox text="불러오는 중…" />}
        {state === "error" && <StateBox text="책 정보를 불러오지 못했어요" onRetry={load} />}
        {state === "ok" && book && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl bg-paper-surface p-5">
              <p className="font-heading text-[22px] text-ink">{book.title}</p>
              <p className="text-[16px] text-ink-muted">{[book.author, book.publisher].filter(Boolean).join(" · ")}</p>
            </div>
            {done ? (
              <InfoText>{done}</InfoText>
            ) : (
              <>
                <Field label="반납 예정일">
                  <Input type="date" value={due} min={todayKST()} onChange={(e) => setDue(e.target.value)} />
                </Field>
                <PhotoPicker file={photo} onChange={setPhoto} />
                <ErrorText>{err}</ErrorText>
                {photoFailed ? (
                  <div className="flex flex-col gap-3">
                    <ErrorText>사진을 올리지 못했어요. 사진 없이 빌릴까요?</ErrorText>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="secondary" disabled={busy} onClick={() => borrow(true)}>
                        사진 없이 빌리기
                      </Button>
                      <Button disabled={busy} onClick={() => borrow(false)}>
                        다시 시도
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full text-[19px]" disabled={busy || book.status !== "available"} onClick={() => borrow(false)}>
                    {busy ? "저장 중…" : "빌리기"}
                  </Button>
                )}
                {book.status !== "available" && !err && <ErrorText>방금 다른 분이 빌렸어요</ErrorText>}
                <LinkButton href={`/books/${book.id}`} variant="secondary" className="w-full">
                  취소
                </LinkButton>
              </>
            )}
          </div>
        )}
      </Page>
    </>
  );
}
