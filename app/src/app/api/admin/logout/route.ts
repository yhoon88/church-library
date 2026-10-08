import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearCookie(res, "admin");
  return res;
}
