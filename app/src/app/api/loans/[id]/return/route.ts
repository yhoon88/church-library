import { db } from "@/lib/db";
import { currentMember, fail, isAdmin, json } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await isAdmin();
  const member = admin ? null : await currentMember();
  if (!admin && !member) return fail("로그인이 필요해요", 401);
  let q = db().from("loans").update({ returned_at: new Date().toISOString() }).eq("id", id).is("returned_at", null);
  if (member) q = q.eq("member_id", member.id);
  const { data, error } = await q.select("id");
  if (error) return fail("반납하지 못했어요", 500);
  if (!data?.length) return fail("이미 반납된 책이에요", 409);
  return json({ ok: true });
}
