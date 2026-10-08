import crypto from "crypto";
import { NextResponse } from "next/server";
import { clearFails, fail, isLocked, recordFail, setCookie } from "@/lib/session";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const key = `admin:${ip}`;
  if (await isLocked(key)) return fail("잠시 후 다시 시도해 주세요 (5분)", 429);
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? "");
  const given = Buffer.from(String(password ?? ""));
  const ok = expected.length > 0 && given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) {
    await recordFail(key);
    return fail("비밀번호가 맞지 않아요", 401);
  }
  await clearFails(key);
  const res = NextResponse.json({ admin: true });
  setCookie(res, "admin", "admin");
  return res;
}
