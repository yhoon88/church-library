import { createClient } from "@supabase/supabase-js";

// 서버 전용: 브라우저로 절대 보내지 않음
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 없습니다");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const PHOTO_BUCKET = "loan-photos";

export function photoUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
