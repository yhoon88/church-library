import { db } from "@/lib/db";
import { listBooks, normIsbn } from "@/lib/books";
import { currentMember, fail, isAdmin, json } from "@/lib/session";

export async function GET(req: Request) {
  const member = await currentMember();
  if (!member && !(await isAdmin())) return fail("로그인이 필요해요", 401);
  const isbn = new URL(req.url).searchParams.get("isbn");
  try {
    const books = await listBooks(member?.id ?? null, isbn ? { isbn: normIsbn(isbn) } : undefined);
    return json({ books });
  } catch {
    return fail("책 목록을 불러오지 못했어요", 500);
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const b = await req.json().catch(() => ({}));
  const title = String(b.title ?? "").trim();
  if (!title) return fail("제목을 입력해 주세요");
  const row = {
    title,
    author: String(b.author ?? "").trim() || null,
    publisher: String(b.publisher ?? "").trim() || null,
    isbn: normIsbn(b.isbn) || null,
  };
  const { data, error } = await db().from("books").insert(row).select().single();
  if (error?.code === "23505") return fail("이미 등록된 책이에요", 409);
  if (error) return fail("저장하지 못했어요", 500);
  return json({ book: data });
}
