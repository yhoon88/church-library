import { db } from "@/lib/db";
import { fail, isAdmin, json } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const { id } = await params;
  const { action } = await req.json().catch(() => ({}));
  if (action !== "approve") return fail("알 수 없는 요청이에요");
  const { error } = await db().from("members").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail("승인하지 못했어요", 500);
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail("관리자만 할 수 있어요", 401);
  const { id } = await params;
  const sb = db();
  const { count } = await sb.from("loans").select("id", { count: "exact", head: true }).eq("member_id", id).is("returned_at", null);
  if (count) return fail("빌린 책이 있는 회원은 삭제할 수 없어요", 409);
  await sb.from("loans").delete().eq("member_id", id);
  const { error } = await sb.from("members").delete().eq("id", id);
  if (error) return fail("삭제하지 못했어요", 500);
  return json({ ok: true });
}
