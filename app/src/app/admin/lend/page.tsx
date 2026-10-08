"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/AdminGate";
import { api, uploadPhoto, type Book } from "@/components/client";
import PhotoPicker from "@/components/PhotoPicker";
import { addDays, todayKST } from "@/lib/dates";
import { Button, ErrorText, Field, InfoText, Input, LinkButton, PageTitle, StateBox } from "@/components/ui";

type Member = { id: string; name: string; created_at: string; active_loans: number };

export default function LendPage() {
  return <AdminGate wide={false}>{(kick) => <Lend kick={kick} />}</AdminGate>;
}

function Lend({ kick }: { kick: () => void }) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [mq, setMq] = useState("");
  const [bq, setBq] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [due, setDue] = useState(() => addDays(todayKST(), 14));
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    setLoadErr(false);
    setMembers(null);
    setBooks(null);
    const [m, b] = await Promise.all([
      api<{ approved: Member[] }>("/api/members"),
      api<{ books: Book[] }>("/api/books"),
    ]);
    if (m.status === 401 || b.status === 401) return kick();
    if (!m.ok || !b.ok) return setLoadErr(true);
    setMembers(m.data.approved ?? []);
    setBooks((b.data.books ?? []).filter((x) => x.status === "available"));
  }, [kick]);

  useEffect(() => {
    load();
  }, [load]);

  const mList = useMemo(() => {
    const s = mq.trim().toLowerCase();
    return (members ?? []).filter((m) => !s || m.name.toLowerCase().includes(s));
  }, [members, mq]);
  const bList = useMemo(() => {
    const s = bq.trim().toLowerCase();
    return (books ?? []).filter(
      (b) => !s || [b.title, b.author, b.publisher].some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [books, bq]);

  async function submit(skipPhoto = false) {
    setErr("");
    setPhotoFailed(false);
    if (!member) return setErr("회원을 골라 주세요");
    if (!book) return setErr("책을 골라 주세요");
    if (!due) return setErr("반납 예정일을 확인해 주세요");
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
    const r = await api("/api/loans", { body: { bookId: book.id, dueDate: due, photoPath, memberId: member.id } });
    setBusy(false);
    if (r.status === 401) return kick();
    if (r.status === 409) {
      setErr("방금 다른 분이 빌렸어요");
      setBook(null);
      load();
      return;
    }
    if (!r.ok) return setErr("저장하지 못했어요. 다시 시도해 주세요");
    setDone(`${member.name}님 대출 처리했어요`);
    setTimeout(() => router.push("/admin"), 1500);
  }

  const pickCls = (on: boolean) =>
    `w-full min-h-[52px] rounded-lg px-4 py-2 text-left text-[17px] transition-colors ${
      on ? "bg-primary text-white" : "bg-white text-ink hover:bg-paper-strong"
    }`;

  if (loadErr) return <StateBox text="불러오지 못했어요" onRetry={load} />;
  if (!members || !books) return <StateBox text="불러오는 중…" />;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>대신 대출</PageTitle>
      {done ? (
        <InfoText>{done}</InfoText>
      ) : (
        <>
          <section className="rounded-xl bg-paper-surface p-4">
            <h2 className="mb-3 text-[19px] text-ink">회원 고르기</h2>
            {member ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[19px] font-semibold text-ink">{member.name}</p>
                <button type="button" className="min-h-[44px] text-[16px] text-ink-2 underline" onClick={() => setMember(null)}>
                  바꾸기
                </button>
              </div>
            ) : members.length === 0 ? (
              <p className="text-ink-2">아직 회원이 없어요</p>
            ) : (
              <>
                <Input value={mq} onChange={(e) => setMq(e.target.value)} placeholder="이름 검색" />
                <ul className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {mList.map((m) => (
                    <li key={m.id}>
                      <button type="button" className={pickCls(false)} onClick={() => setMember(m)}>
                        {m.name}
                      </button>
                    </li>
                  ))}
                  {mList.length === 0 && <li className="px-2 py-2 text-ink-2">맞는 회원이 없어요</li>}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-xl bg-paper-surface p-4">
            <h2 className="mb-3 text-[19px] text-ink">책 고르기</h2>
            {book ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-[19px] text-ink">{book.title}</p>
                  <p className="text-[15px] text-ink-muted">{[book.author, book.publisher].filter(Boolean).join(" · ")}</p>
                </div>
                <button type="button" className="min-h-[44px] shrink-0 text-[16px] text-ink-2 underline" onClick={() => setBook(null)}>
                  바꾸기
                </button>
              </div>
            ) : books.length === 0 ? (
              <p className="text-ink-2">지금 대출 가능한 책이 없어요</p>
            ) : (
              <>
                <Input value={bq} onChange={(e) => setBq(e.target.value)} placeholder="제목, 저자, 출판사로 찾기" />
                <ul className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
                  {bList.map((b) => (
                    <li key={b.id}>
                      <button type="button" className={pickCls(false)} onClick={() => setBook(b)}>
                        <span className="font-heading block">{b.title}</span>
                        <span className="block text-[14px] text-ink-muted">
                          {[b.author, b.publisher].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                  {bList.length === 0 && (
                    <li className="px-2 py-2 text-ink-2">{`'${bq.trim()}'은(는) 대출 가능한 책 중에 없어요`}</li>
                  )}
                </ul>
              </>
            )}
          </section>

          <Field label="반납 예정일">
            <Input type="date" value={due} min={todayKST()} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <PhotoPicker file={photo} onChange={setPhoto} />
          <ErrorText>{err}</ErrorText>
          {photoFailed ? (
            <div className="flex flex-col gap-3">
              <ErrorText>사진을 올리지 못했어요. 사진 없이 빌릴까요?</ErrorText>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" disabled={busy} onClick={() => submit(true)}>
                  사진 없이 빌리기
                </Button>
                <Button disabled={busy} onClick={() => submit(false)}>
                  다시 시도
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full text-[19px]" disabled={busy} onClick={() => submit(false)}>
              {busy ? "저장 중…" : "대출 처리"}
            </Button>
          )}
          <LinkButton href="/admin" variant="secondary" className="w-full">
            취소
          </LinkButton>
        </>
      )}
    </div>
  );
}
