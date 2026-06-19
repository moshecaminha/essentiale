import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAuth } from "@/lib/supabaseAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, type, productId, label, valueCents, cart, meta } = body || {};
    if (!sessionId || !type) return NextResponse.json({ ok: false }, { status: 200 });

    // vincula ao cliente, se estiver logado
    let customerId: string | null = null;
    try {
      const { data: { user } } = await supabaseAuth().auth.getUser();
      if (user) {
        const sb0 = supabaseServer();
        const { data } = await sb0.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
        customerId = data?.id ?? null;
      }
    } catch { /* anônimo */ }

    const sb = supabaseServer();
    await sb.from("tracking_events").insert({
      session_id: sessionId, customer_id: customerId, type,
      product_id: productId ?? null, label: label ?? null,
      value_cents: valueCents ?? null, meta: meta ?? null,
    });

    if (Array.isArray(cart)) {
      const item_count = cart.reduce((s: number, i: any) => s + (i.qty || 0), 0);
      const subtotal_cents = cart.reduce((s: number, i: any) => s + ((i.p || 0) * (i.qty || 0)), 0);
      const status = type === "purchase" ? "finalizado" : type === "whatsapp_checkout" ? "enviado_whatsapp" : cart.length === 0 ? "vazio" : "ativo";
      await sb.from("saved_carts").upsert({
        session_id: sessionId, customer_id: customerId, items: cart,
        item_count, subtotal_cents, status, updated_at: new Date().toISOString(),
      }, { onConflict: "session_id" });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
