import { authorized, ok, unauthorized, badRequest } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
const OBJ = ["reativacao", "vip_lancamento", "cross_sell", "sazonal", "aniversario", "outro"];
const CH = ["whatsapp", "email", "sms"];
const ST = ["rascunho", "agendada", "ativa", "encerrada", "cancelada"];

export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const { data } = await sb.from("campaigns").select("*").order("created_at", { ascending: false }).limit(100);
  return ok({ campaigns: data ?? [] });
}
export async function POST(req: Request) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b || !b.name) return badRequest("Campo 'name' é obrigatório.");
  const sb = supabaseServer();
  const { data, error } = await sb.from("campaigns").insert({
    name: b.name,
    objective: OBJ.includes(b.objective) ? b.objective : "outro",
    channel: CH.includes(b.channel) ? b.channel : "whatsapp",
    status: ST.includes(b.status) ? b.status : "rascunho",
    segment: b.segment || null,
    message_template: b.message_template || b.message || null,
    scheduled_at: b.scheduled_at || null,
  }).select("*").single();
  if (error) return badRequest(error.message);
  return ok({ campaign: data }, 201);
}
