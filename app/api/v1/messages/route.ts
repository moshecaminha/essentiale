import { authorized, ok, unauthorized, badRequest } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
const digits = (s: any) => String(s || "").replace(/\D/g, "");

// POST /api/v1/messages  { phone|customer_id, direction:'entrada'|'saida', body, media_url?, wa_message_id? }
// Garante a conversa do cliente e registra a mensagem.
export async function POST(req: Request) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b || !b.body) return badRequest("Campo 'body' é obrigatório.");
  const sb = supabaseServer();

  let customerId = b.customer_id ?? null;
  const phone = digits(b.phone);
  if (!customerId && phone) {
    const { data: found } = await sb.from("customers").select("id").eq("phone", phone).maybeSingle();
    if (found) customerId = found.id;
    else {
      const { data: created } = await sb.from("customers").insert({ full_name: b.name || "Cliente WhatsApp", phone }).select("id").single();
      customerId = created?.id ?? null;
    }
  }
  if (!customerId) return badRequest("Informe 'customer_id' ou 'phone'.");

  let { data: conv } = await sb.from("conversations").select("id").eq("customer_id", customerId).eq("status", "aberta").order("last_message_at", { ascending: false }).maybeSingle();
  if (!conv) {
    const { data: nc } = await sb.from("conversations").insert({ customer_id: customerId, channel: "whatsapp", status: "aberta", last_message_at: new Date().toISOString() }).select("id").single();
    conv = nc;
  }
  const direction = b.direction === "saida" ? "saida" : "entrada";
  const { data: msg, error } = await sb.from("messages").insert({
    conversation_id: conv!.id, direction, body: b.body, media_url: b.media_url || null, wa_message_id: b.wa_message_id || null,
  }).select("*").single();
  if (error) return badRequest(error.message);
  await sb.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv!.id);
  return ok({ message: msg, conversation_id: conv!.id }, 201);
}
