import { supabaseServer } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { suggestRelated } from "@/lib/related";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { slug: string } }) {
  const sb = supabaseServer();
  const { data } = await sb
    .from("products")
    .select("id,name,slug,price_cents,stock_qty,image_url,description,fragrance,category:categories(name)")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) notFound();
  const p = data as any;

  // Produtos que combinam com o que o cliente está vendo
  // (mesma fragrância, categoria complementar, faixa de preço)
  const { data: all = [] } = await sb
    .from("products")
    .select("id,name,slug,price_cents,stock_qty,image_url,fragrance,category:categories(name)")
    .eq("active", true);
  const cands = (all as any[]).map((x) => ({
    id: x.id, n: x.name, c: x.category?.name ?? "Outros", p: x.price_cents,
    s: x.stock_qty, fr: x.fragrance ?? null, img: x.image_url ?? null, slug: x.slug,
  }));
  const ctx = [{ id: p.id, n: p.name, c: p.category?.name ?? "Outros", p: p.price_cents, s: p.stock_qty, fr: p.fragrance ?? null }];
  const related = suggestRelated(ctx, cands, 3);

  return <ProductDetail p={p} related={related} />;
}
