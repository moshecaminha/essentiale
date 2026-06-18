import { supabaseServer } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { slug: string } }) {
  const sb = supabaseServer();
  const { data } = await sb
    .from("products")
    .select("id,name,slug,price_cents,stock_qty,image_url,description,category:categories(name)")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) notFound();
  return <ProductDetail p={data as any} />;
}
