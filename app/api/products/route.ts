import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseServer();
  const { data } = await sb
    .from("products")
    .select("id,name,slug,price_cents,stock_qty,image_url,fragrance,category:categories(name)")
    .eq("active", true)
    .order("price_cents", { ascending: true });
  const products = (data ?? []).map((p: any) => ({
    id: p.id, n: p.name, slug: p.slug, c: p.category?.name ?? "Outros",
    p: p.price_cents, s: p.stock_qty, img: p.image_url ?? null, fr: p.fragrance ?? null,
  }));
  return NextResponse.json({ products });
}
