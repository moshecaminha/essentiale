import { authorized, ok, unauthorized, badRequest, notFound } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
const ST = ["rascunho", "agendada", "ativa", "encerrada", "cancelada"];
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  const sb = supabaseServer();
  const patch: any = { updated_at: new Date().toISOString() };
  ["name", "segment", "message_template", "scheduled_at"].forEach((k) => { if (b[k] != null) patch[k] = b[k]; });
  if (b.status && ST.includes(b.status)) patch.status = b.status;
  if (b.sent_count != null) patch.sent_count = Number(b.sent_count);
  if (b.opened_count != null) patch.opened_count = Number(b.opened_count);
  if (b.converted_count != null) patch.converted_count = Number(b.converted_count);
  if (b.revenue_cents != null) patch.revenue_cents = Number(b.revenue_cents);
  const { data, error } = await sb.from("campaigns").update(patch).eq("id", params.id).select("*").maybeSingle();
  if (error) return badRequest(error.message);
  if (!data) return notFound();
  return ok({ campaign: data });
}
