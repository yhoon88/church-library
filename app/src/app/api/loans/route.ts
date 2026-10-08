import { db, photoUrl } from "@/lib/db";
import { addDays, todayKST } from "@/lib/dates";
import { currentMember, fail, isAdmin, json } from "@/lib/session";

type LoanJoin = {
  id: string;
  book_id: string;
  member_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  photo_path: string | null;
  books: { title: string; author: string | null; publisher: string | null } | null;
  members: { name: string } | null;
};

export async function GET(req: Request) {
  const scope = new URL(req.url).searchParams.get("scope") ?? "mine";
  let q = db()
    .from("loans")
    .select("id,book_id,member_id,borrowed_at,due_date,returned_at,photo_path,books(title,author,publisher),members(name)");
  if (scope === "mine") {
    const member = await currentMember();
    if (!member) return fail("로그인이 필요해요", 401);
    q = q.eq("member_id", member.id).is("returned_at", null).order("due_date");
  } else {
    if (!(await isAdmin())) return fail("관리자만 볼 수 있어요", 401);
    q =
      scope === "returned"
        ? q.not("returned_at", "is", null).order("returned_at", { ascending: false }).limit(50)
        : q.is("returned_at", null).order("due_date");
  }
  const { data, error } = await q;
  if (error) return fail("불러오지 못했어요", 500);
  const today = todayKST();
  const loans = ((data ?? []) as unknown as LoanJoin[]).map((l) => ({
    id: l.id,
    book_id: l.book_id,
    book_title: l.books?.title ?? "(삭제된 책)",
    book_author: l.books?.author ?? null,
    book_publisher: l.books?.publisher ?? null,
    member_id: l.member_id,
    member_name: scope === "mine" ? null : (l.members?.name ?? ""),
    borrowed_at: l.borrowed_at,
    due_date: l.due_date,
    returned_at: l.returned_at,
    overdue: !l.returned_at && l.due_date < today,
    photo_url: scope === "mine" ? null : photoUrl(l.photo_path),
  }));
  return json({ loans });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const admin = await isAdmin();
  const byAdmin = !!b.memberId && admin;
  let memberId: string;
  if (byAdmin) {
    memberId = String(b.memberId);
  } else {
    const member = await currentMember();
    if (!member) return fail("로그인이 필요해요", 401);
    memberId = member.id;
  }
  const today = todayKST();
  const due = /^\d{4}-\d{2}-\d{2}$/.test(String(b.dueDate ?? "")) && b.dueDate >= today ? b.dueDate : addDays(today, 14);
  const photoPath = typeof b.photoPath === "string" && /^[\w\-/.]+$/.test(b.photoPath) ? b.photoPath : null;
  const sb = db();
  const { data: m } = await sb.from("members").select("status").eq("id", memberId).maybeSingle();
  if (m?.status !== "approved") return fail("승인된 회원이 아니에요");
  const { data, error } = await sb
    .from("loans")
    .insert({
      book_id: String(b.bookId ?? ""),
      member_id: memberId,
      due_date: due,
      photo_path: photoPath,
      created_by: byAdmin ? "admin" : "member",
    })
    .select()
    .single();
  if (error?.code === "23505") return fail("방금 다른 분이 빌렸어요", 409);
  if (error) return fail("대출하지 못했어요", 500);
  return json({ loan: data });
}
