import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { fail, isAdmin, json } from "@/lib/session";

type MemberJoin = { id: string; name: string; status: string; created_at: string; loans: { returned_at: string | null }[] };

export async function GET() {
  if (!(await isAdmin())) return fail("관리자만 볼 수 있어요", 401);
  const { data, error } = await db().from("members").select("id,name,status,created_at,loans(returned_at)").order("created_at");
  if (error) return fail("불러오지 못했어요", 500);
  const rows = (data ?? []) as MemberJoin[];
  return json({
    pending: rows.filter((m) => m.status === "pending").map(({ id, name, created_at }) => ({ id, name, created_at })),
    approved: rows
      .filter((m) => m.status === "approved")
      .map(({ id, name, created_at, loans }) => ({ id, name, created_at, active_loans: loans.filter((l) => !l.returned_at).length })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const { name, pin } = await req.json().catch(() => ({}));
  const n = String(name ?? "").trim();
  const p = String(pin ?? "");
  if (!n) return fail("이름을 입력해 주세요");
  if (!/^\d{4}$/.test(p)) return fail("PIN은 숫자 4자리예요");
  const { error } = await db()
    .from("members")
    .insert({ name: n, pin_hash: await bcrypt.hash(p, 10), status: "approved", approved_at: new Date().toISOString() });
  if (error?.code === "23505") return fail("같은 이름이 있어요", 409);
  if (error) return fail("등록하지 못했어요", 500);
  return json({ ok: true });
}
