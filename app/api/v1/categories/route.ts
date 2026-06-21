import { authorized, ok, unauthorized } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const { data } = await sb.from("categories").select("id,name,slug,sort_order").order("sort_order");
  return ok({ categories: data ?? [] });
}
