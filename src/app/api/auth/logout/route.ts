import { ok } from "@/lib/api";

export async function POST() {
  const response = ok({ success: true });
  response.cookies.set("homenova_access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("homenova_refresh_token", "", { maxAge: 0, path: "/" });
  return response;
}
