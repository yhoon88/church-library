import { db } from "@/lib/db";
import { normIsbn } from "@/lib/books";
import { fail, isAdmin, json } from "@/lib/session";

type Row = { title?: unknown; author?: unknown; publisher?: unknown; isbn?: unknown };

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const { rows } = await req.json().catch(() => ({ rows: [] }));
  if (!Array.isArray(rows)) return fail("파일을 읽지 못했어요");
  const sb = db();
  const { data: existing } = await sb.from("books").select("title,isbn");
  const titles = new Set((existing ?? []).map((b) => b.title.trim()));
  const isbns = new Set((existing ?? []).map((b) => b.isbn).filter(Boolean));
  const toAdd: { title: string; author: string | null; publisher: string | null; isbn: string | null }[] = [];
  let skipped = 0;
  for (const r of rows as Row[]) {
    const title = String(r.title ?? "").trim();
    const isbn = normIsbn(r.isbn) || null;
    if (!title || titles.has(title) || (isbn && isbns.has(isbn))) {
      skipped++;
      continue;
    }
    titles.add(title);
    if (isbn) isbns.add(isbn);
    toAdd.push({
      title,
      author: String(r.author ?? "").trim() || null,
      publisher: String(r.publisher ?? "").trim() || null,
      isbn,
    });
  }
  if (toAdd.length) {
    const { error } = await sb.from("books").insert(toAdd);
    if (error) return fail("등록하지 못했어요", 500);
  }
  return json({ added: toAdd.length, skipped });
}
