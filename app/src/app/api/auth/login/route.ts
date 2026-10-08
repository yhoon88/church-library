import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearFails, fail, isLocked, recordFail, setCookie } from "@/lib/session";

export async function POST(req: Request) {
  const { name, pin } = await req.json().catch(() => ({}));
  const n = String(name ?? "").trim();
  const p = String(pin ?? "");
  if (!n || !/^\d{4}$/.test(p)) return fail("이름 또는 PIN이 맞지 않아요", 401);
  const key = `member:${n}`;
  if (await isLocked(key)) return fail("잠시 후 다시 시도해 주세요", 429);
  const { data } = await db().from("members").select("id,name,pin_hash,status").eq("name", n).maybeSingle();
  if (!data || !(await bcrypt.compare(p, data.pin_hash))) {
    await recordFail(key);
    return fail("이름 또는 PIN이 맞지 않아요", 401);
  }
  await clearFails(key);
  if (data.status !== "approved") return fail("pending", 403);
  const res = NextResponse.json({ member: { id: data.id, name: data.name } });
  setCookie(res, "member", data.id);
  return res;
}
