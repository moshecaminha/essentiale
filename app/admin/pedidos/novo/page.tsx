import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseServer } from "@/lib/supabaseServer";
import OrderForm from "@/components/OrderForm";

export const dynamic = "force-dynamic";

export default async function NovoPedido() {
  const sb = supabaseServer();
  const { data: products = [] } = await sb
    .from("products")
    .select("id,name,price_cents")
    .eq("active", true)
    .order("name");

  return (
    <>
      <div className="topbar"><h1>Registrar pedido</h1></div>
      <div className="content stack">
        <Link href="/admin/pedidos" className="back-link"><ArrowLeft size={15} /> Voltar para pedidos</Link>
        <OrderForm products={(products as any) ?? []} />
      </div>
    </>
  );
}
