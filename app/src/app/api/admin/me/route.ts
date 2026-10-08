import { isAdmin, json } from "@/lib/session";

export async function GET() {
  return json({ admin: await isAdmin() });
}
