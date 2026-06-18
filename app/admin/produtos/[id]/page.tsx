import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseServer } from "@/lib/supabaseServer";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditarProduto({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const novo = params.id === "novo";

  const { data: categories = [] } = await sb.from("categories").select("id,name").order("sort_order");

  let product = null;
  if (!novo) {
    const { data } = await sb
      .from("products")
      .select("id,name,slug,price_cents,compare_at_cents,stock_qty,low_stock_threshold,description,active,image_url,category_id")
      .eq("id", params.id)
      .maybeSingle();
    product = data;
  }

  return (
    <>
      <div className="topbar"><h1>{novo ? "Novo produto" : "Editar produto"}</h1></div>
      <div className="content stack">
        <Link href="/admin/produtos" className="back-link"><ArrowLeft size={15} /> Voltar para produtos</Link>
        <ProductForm product={product as any} categories={(categories as any) ?? []} />
      </div>
    </>
  );
}
