import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orders";

export const dynamic = "force-dynamic";

const pillClass = (s: string) =>
  s === "entregue" ? "ok" : s === "aguardando_pagamento" ? "low" : s === "cancelado" || s === "reembolsado" ? "out" : "info";

export default async function MeusPedidos() {
  const { customer } = await getCurrentCustomer();
  if (!customer) return null;
  const sb = supabaseServer();
  const { data: orders = [] } = await sb
    .from("orders")
    .select("id,order_number,status,total_cents,placed_at")
    .eq("customer_id", customer.id)
    .order("placed_at", { ascending: false });

  const list = (orders as any[]) ?? [];

  return (
    <>
      <h1>Meus pedidos</h1>
      <p className="acc-sub">Acompanhe o status e veja o resumo de cada compra.</p>

      {list.length === 0 ? (
        <div className="empty">
          <Package size={28} color="#8DA585" />
          <p>Você ainda não tem pedidos. Que tal escolher o seu aroma?</p>
          <Link href="/" className="btn">Ir às compras</Link>
        </div>
      ) : (
        <div className="acc-orders">
          {list.map((o) => (
            <Link href={`/conta/pedidos/${o.id}`} className="acc-order" key={o.id}>
              <div>
                <strong>Pedido #{o.order_number}</strong>
                <span className="cell-muted">{o.placed_at ? new Date(o.placed_at).toLocaleDateString("pt-BR") : ""}</span>
              </div>
              <span className={`pill ${pillClass(o.status)}`}>{STATUS_LABEL[o.status]}</span>
              <strong>{brl(o.total_cents)}</strong>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
