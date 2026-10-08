import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";

const WEEK = 60 * 60 * 24 * 7;
const secret = () => {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD 환경변수가 없습니다");
  return s;
};

function sign(value: string) {
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  const body = `${value}.${exp}`;
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const body = token.slice(0, i);
  const mac = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const j = body.lastIndexOf(".");
  const exp = Number(body.slice(j + 1));
  if (!exp || exp < Date.now() / 1000) return null;
  return body.slice(0, j);
}

export function setCookie(res: NextResponse, name: "member" | "admin", value: string) {
  res.cookies.set(name, sign(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
}

export function clearCookie(res: NextResponse, name: "member" | "admin") {
  res.cookies.set(name, "", { path: "/", maxAge: 0 });
}

export async function isAdmin() {
  const c = await cookies();
  return verify(c.get("admin")?.value) === "admin";
}

export type Member = { id: string; name: string };

export async function currentMember(): Promise<Member | null> {
  const c = await cookies();
  const id = verify(c.get("member")?.value);
  if (!id) return null;
  const { data } = await db().from("members").select("id,name,status").eq("id", id).maybeSingle();
  if (!data || data.status !== "approved") return null;
  return { id: data.id, name: data.name };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// 여러 번 틀리면 5분 잠금 (서버리스라 DB에 기록)
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000;

export async function isLocked(key: string) {
  const { data } = await db().from("login_attempts").select("locked_until").eq("key", key).maybeSingle();
  return !!data?.locked_until && new Date(data.locked_until).getTime() > Date.now();
}

export async function recordFail(key: string) {
  const sb = db();
  const { data } = await sb.from("login_attempts").select("fails,locked_until").eq("key", key).maybeSingle();
  const expired = data?.locked_until && new Date(data.locked_until).getTime() <= Date.now();
  const fails = (expired ? 0 : data?.fails ?? 0) + 1;
  const locked_until = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS).toISOString() : null;
  await sb.from("login_attempts").upsert({ key, fails: fails >= MAX_FAILS ? 0 : fails, locked_until });
}

export async function clearFails(key: string) {
  await db().from("login_attempts").delete().eq("key", key);
}
