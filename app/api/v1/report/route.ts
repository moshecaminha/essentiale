import { authorized, ok, unauthorized, badRequest } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
// GET /api/v1/report?days=30  (resumo de vendas)
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const u = new URL(req.url);
  const days = Math.min(366, Math.max(1, Number(u.searchParams.get("days") || 30)));
  const sb = supabaseServer();
  const { data, error } = await sb.rpc("report_overview", { days });
  if (error) return badRequest(error.message);
  return ok({ report: data });
}
