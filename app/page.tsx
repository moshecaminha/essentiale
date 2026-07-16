import { supabaseServer } from "@/lib/supabaseServer";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sb = supabaseServer();
  const { data } = await sb
    .from("products")
    .select("id,name,slug,price_cents,compare_at_cents,stock_qty,image_url,description,is_wholesale,fragrance,category:categories(name)")
    .eq("active", true)
    .order("price_cents", { ascending: false });

  const products = (data ?? []).map((p: any) => ({
    id: p.id,
    n: p.name,
    slug: p.slug,
    c: p.category?.name ?? "Outros",
    p: p.price_cents,
    s: p.stock_qty,
    img: p.image_url ?? null,
    d: p.description ?? null,
    w: p.is_wholesale ?? false,
    fr: p.fragrance ?? null,
    cmp: p.compare_at_cents ?? null,
  }));

  return <Storefront products={products} />;
}
