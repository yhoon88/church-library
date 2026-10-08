import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { fail, json } from "@/lib/session";

export async function POST(req: Request) {
  const { name, pin } = await req.json().catch(() => ({}));
  const n = String(name ?? "").trim();
  const p = String(pin ?? "");
  if (!n || n.length > 40) return fail("이름을 입력해 주세요");
  if (!/^\d{4}$/.test(p)) return fail("PIN은 숫자 4자리예요");
  const { error } = await db().from("members").insert({ name: n, pin_hash: await bcrypt.hash(p, 10) });
  if (error?.code === "23505") return fail("같은 이름이 있어요", 409);
  if (error) return fail("신청에 실패했어요", 500);
  return json({ ok: true });
}
