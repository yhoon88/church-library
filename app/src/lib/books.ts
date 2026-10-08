import { db } from "./db";
import { todayKST } from "./dates";

export type BookStatus = "available" | "loaned" | "overdue";

export type BookRow = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  status: BookStatus;
  due_date: string | null;
  mine: boolean;
  loan_id: string | null;
};

// 책 + 현재 대출 상태. 빌린 사람 이름은 넣지 않음
export async function listBooks(memberId: string | null, filter?: { id?: string; isbn?: string }) {
  let q = db()
    .from("books")
    .select("id,title,author,publisher,isbn,loans(id,member_id,due_date,returned_at)")
    .order("title");
  if (filter?.id) q = q.eq("id", filter.id);
  if (filter?.isbn) q = q.eq("isbn", filter.isbn);
  const { data, error } = await q;
  if (error) throw error;
  const today = todayKST();
  return (data ?? []).map((b) => {
    const active = (b.loans as { id: string; member_id: string; due_date: string; returned_at: string | null }[]).find(
      (l) => !l.returned_at,
    );
    const status: BookStatus = !active ? "available" : active.due_date < today ? "overdue" : "loaned";
    return {
      id: b.id,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      isbn: b.isbn,
      status,
      due_date: active?.due_date ?? null,
      mine: !!active && active.member_id === memberId,
      loan_id: active && active.member_id === memberId ? active.id : null,
    } satisfies BookRow;
  });
}

export function normIsbn(s: unknown) {
  return String(s ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
}
