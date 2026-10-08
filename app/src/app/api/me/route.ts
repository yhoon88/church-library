import { currentMember, json } from "@/lib/session";

export async function GET() {
  return json({ member: await currentMember() });
}
