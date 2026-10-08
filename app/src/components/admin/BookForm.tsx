"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { api, type Book } from "@/components/client";
import { Button, ErrorText, Field, Icon, Input, LinkButton, Modal, PageTitle, StateBox } from "@/components/ui";

/** M4 책 등록·수정. id 있으면 수정 */
export default function BookForm({ id, kick }: { id?: string; kick: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [state, setState] = useState<"loading" | "error" | "ok">(id ? "loading" : "ok");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [scan, setScan] = useState(false);
  const [noCam, setNoCam] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setState("loading");
    const r = await api<{ book: Book }>(`/api/books/${id}`);
    if (r.status === 401) return kick();
    if (!r.ok || !r.data.book) return setState("error");
    const b = r.data.book;
    setTitle(b.title ?? "");
    setAuthor(b.author ?? "");
    setPublisher(b.publisher ?? "");
    setIsbn(b.isbn ?? "");
    setState("ok");
  }, [id, kick]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!title.trim()) return setErr("제목을 입력해 주세요");
    setBusy(true);
    const body = {
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      isbn: isbn.replace(/[^0-9Xx]/g, ""),
    };
    const r = id
      ? await api(`/api/books/${id}`, { method: "PATCH", body })
      : await api("/api/books", { method: "POST", body });
    setBusy(false);
    if (r.status === 401) return kick();
    if (r.status === 409) return setErr("이미 등록된 책이에요");
    if (!r.ok) return setErr("저장하지 못했어요. 다시 시도해 주세요");
    router.push("/admin?tab=books");
  }

  if (state === "loading") return <StateBox text="불러오는 중…" />;
  if (state === "error") return <StateBox text="책 정보를 불러오지 못했어요" onRetry={load} />;

  return (
    <>
      <PageTitle>{id ? "책 수정" : "책 등록"}</PageTitle>
      <form onSubmit={save} className="flex flex-col gap-5">
        <Field label="제목 (필수)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="저자">
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Field>
        <Field label="출판사">
          <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} />
        </Field>
        <div>
          <label htmlFor="isbn" className="mb-2 block text-[16px] font-semibold text-ink-2">
            ISBN
          </label>
          <div className="flex gap-2">
            <Input id="isbn" inputMode="numeric" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            <Button
              variant="secondary"
              className="shrink-0 px-3"
              onClick={() => {
                setNoCam(false);
                setScan(true);
              }}
            >
              <Icon name="barcode_scanner" /> 바코드로 입력
            </Button>
          </div>
        </div>
        <ErrorText>{err}</ErrorText>
        <div className="grid grid-cols-2 gap-3">
          <LinkButton href="/admin?tab=books" variant="secondary">
            취소
          </LinkButton>
          <Button type="submit" disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </Button>
        </div>
      </form>

      <Modal open={scan} onClose={() => setScan(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-[20px] text-ink">바코드로 입력</h2>
          {noCam ? (
            <ErrorText>이 폰에서는 카메라를 쓸 수 없어요. ISBN 숫자를 입력해 주세요</ErrorText>
          ) : (
            <>
              {scan && (
                <BarcodeScanner
                  onDetected={(code) => {
                    setIsbn(code);
                    setScan(false);
                  }}
                  onUnavailable={() => setNoCam(true)}
                />
              )}
              <p className="text-center text-[16px] text-ink-2">책 뒤의 바코드를 네모 안에 맞춰 주세요</p>
            </>
          )}
          <Button variant="secondary" onClick={() => setScan(false)}>
            닫기
          </Button>
        </div>
      </Modal>
    </>
  );
}
