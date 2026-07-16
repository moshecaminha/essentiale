import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { quoteShipping, melhorEnvioConfigured } from "@/lib/melhorenvio";

export const dynamic = "force-dynamic";

// POST { cep: string, items: [{ id, qty }] }
// -> { configured: boolean, options: [{ serviceId, name, company, priceCents, days }] }
export async function POST(req: Request) {
  try {
    if (!melhorEnvioConfigured()) {
      return NextResponse.json({ configured: false, options: [] });
    }
    const body = await req.json();
    const cep = String(body?.cep ?? "");
    const items: { id: string; qty: number }[] = Array.isArray(body?.items) ? body.items : [];
    if (!cep || items.length === 0) return NextResponse.json({ configured: true, options: [] });

    const sb = supabaseServer();
    const ids = items.map((i) => String(i.id));
    const { data: prods = [] } = await sb
      .from("products")
      .select("id,price_cents,peso_gramas,altura_cm,largura_cm,profundidade_cm")
      .in("id", ids);
    const pmap = new Map((prods as any[]).map((p) => [p.id, p]));

    const quoteItems = items
      .map((i) => {
        const p = pmap.get(String(i.id));
        if (!p) return null;
        return {
          id: p.id, qty: Math.max(1, i.qty | 0),
          peso_gramas: p.peso_gramas, altura_cm: p.altura_cm,
          largura_cm: p.largura_cm, profundidade_cm: p.profundidade_cm,
          price_cents: p.price_cents,
        };
      })
      .filter(Boolean) as any[];

    const options = await quoteShipping(cep, quoteItems);
    return NextResponse.json({ configured: true, options });
  } catch {
    return NextResponse.json({ configured: true, options: [] });
  }
}
