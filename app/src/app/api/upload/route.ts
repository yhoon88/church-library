import crypto from "crypto";
import { db, PHOTO_BUCKET } from "@/lib/db";
import { currentMember, fail, isAdmin, json } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await currentMember()) && !(await isAdmin())) return fail("로그인이 필요해요", 401);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("사진이 없어요");
  if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) return fail("사진을 올리지 못했어요");
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
  const { error } = await db()
    .storage.from(PHOTO_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return fail("사진을 올리지 못했어요", 500);
  return json({ path });
}
