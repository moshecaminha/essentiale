import { authorized, ok, unauthorized, badRequest } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
const digits = (s: any) => String(s || "").replace(/\D/g, "");

// POST /api/v1/webhook/whatsapp  (recebe mensagens de entrada do WhatsApp)
// { from, name?, text, wa_message_id?, media_url?, direction? }
export async function POST(req: Request) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  const phone = digits(b.from || b.phone);
  const text = b.text || b.body || "";
  if (!phone) return badRequest("Campo 'from' (telefone) é obrigatório.");
  const sb = supabaseServer();

  let { data: cust } = await sb.from("customers").select("id").eq("phone", phone).maybeSingle();
  if (!cust) {
    const { data: nc } = await sb.from("customers").insert({ full_name: b.name || "Cliente WhatsApp", phone }).select("id").single();
    cust = nc;
  }
  let { data: conv } = await sb.from("conversations").select("id").eq("customer_id", cust!.id).eq("status", "aberta").order("last_message_at", { ascending: false }).maybeSingle();
  if (!conv) {
    const { data: ncv } = await sb.from("conversations").insert({ customer_id: cust!.id, channel: "whatsapp", status: "aberta", last_message_at: new Date().toISOString() }).select("id").single();
    conv = ncv;
  }
  if (text) {
    await sb.from("messages").insert({
      conversation_id: conv!.id, direction: b.direction === "saida" ? "saida" : "entrada",
      body: text, media_url: b.media_url || null, wa_message_id: b.wa_message_id || null,
    });
    await sb.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv!.id);
  }
  return ok({ received: true, customer_id: cust!.id, conversation_id: conv!.id });
}
