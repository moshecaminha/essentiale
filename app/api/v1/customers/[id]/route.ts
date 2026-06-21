import { authorized, ok, unauthorized, badRequest, notFound } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const { data } = await sb.from("customers").select("*,orders(id,order_number,status,total_cents,placed_at)").eq("id", params.id).maybeSingle();
  if (!data) return notFound();
  return ok({ customer: data });
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  const sb = supabaseServer();
  const patch: any = {};
  ["full_name", "email", "phone", "cep", "street", "number", "complement", "district", "city", "uf"].forEach((k) => { if (b[k] != null) patch[k] = b[k]; });
  if (b.name != null) patch.full_name = b.name;
  if (Object.keys(patch).length === 0) return badRequest("Nenhum campo para atualizar.");
  const { data, error } = await sb.from("customers").update(patch).eq("id", params.id).select("*").maybeSingle();
  if (error) return badRequest(error.message);
  if (!data) return notFound();
  return ok({ customer: data });
}
