import { authorized, ok, unauthorized } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const { data } = await sb.from("products").select("fragrance").not("fragrance", "is", null);
  const set = Array.from(new Set((data ?? []).map((r: any) => r.fragrance))).sort();
  return ok({ fragrances: set });
}
