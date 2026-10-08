import { db } from "@/lib/db";
import { listBooks, normIsbn } from "@/lib/books";
import { currentMember, fail, isAdmin, json } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const member = await currentMember();
  if (!member && !(await isAdmin())) return fail("로그인이 필요해요", 401);
  try {
    const [book] = await listBooks(member?.id ?? null, { id });
    if (!book) return fail("책을 찾을 수 없어요", 404);
    return json({ book });
  } catch {
    return fail("책 정보를 불러오지 못했어요", 500);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const title = String(b.title ?? "").trim();
  if (!title) return fail("제목을 입력해 주세요");
  const { data, error } = await db()
    .from("books")
    .update({
      title,
      author: String(b.author ?? "").trim() || null,
      publisher: String(b.publisher ?? "").trim() || null,
      isbn: normIsbn(b.isbn) || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error?.code === "23505") return fail("이미 등록된 책이에요", 409);
  if (error) return fail("저장하지 못했어요", 500);
  return json({ book: data });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const { id } = await params;
  const sb = db();
  const { count } = await sb.from("loans").select("id", { count: "exact", head: true }).eq("book_id", id).is("returned_at", null);
  if (count) return fail("대출 중인 책은 삭제할 수 없어요", 409);
  // 지난 대출 기록도 함께 정리
  await sb.from("loans").delete().eq("book_id", id);
  const { error } = await sb.from("books").delete().eq("id", id);
  if (error) return fail("삭제하지 못했어요", 500);
  return json({ ok: true });
}
