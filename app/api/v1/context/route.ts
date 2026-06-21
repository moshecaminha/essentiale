import { authorized, ok, unauthorized } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

// GET /api/v1/context  (resumo da loja + catálogo, para o bot responder com base nos dados reais)
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const { data: products = [] } = await sb.from("products")
    .select("id,name,slug,price_cents,stock_qty,active,is_wholesale,fragrance,category:categories(name,slug)")
    .eq("active", true).order("name");
  const { data: cats = [] } = await sb.from("categories").select("name,slug,sort_order").order("sort_order");
  const frags = Array.from(new Set((products as any[]).map((p) => p.fragrance).filter(Boolean))).sort();
  return ok({
    store: {
      name: "Essentiale Fragrance",
      site: "https://essentiale.vercel.app",
      whatsapp: "5581999089912",
      about: "Marca de fragrâncias autorais feita à mão em Recife: velas, difusores, home sprays, sabonetes, essências e itens de bem-estar.",
      shipping: "Envio para todo o Brasil; opção de retirada combinada pelo WhatsApp.",
      payments: ["pix", "cartao_credito", "boleto"],
      first_purchase_coupon: "CUPOM10 (10% na primeira compra)",
    },
    categories: cats,
    fragrances: frags,
    products: (products as any[]).map((p) => ({
      id: p.id, name: p.name, slug: p.slug, price_cents: p.price_cents,
      price: (p.price_cents / 100).toFixed(2), stock: p.stock_qty,
      fragrance: p.fragrance, category: p.category?.name, wholesale: p.is_wholesale,
    })),
  });
}
