import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";
import { PIPELINE, STATUS_LABEL, METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PedidoCliente({ params, searchParams }: { params: { id: string }; searchParams: { novo?: string } }) {
  const { customer } = await getCurrentCustomer();
  if (!customer) return null;
  const sb = supabaseServer();

  const { data: order } = await sb
    .from("orders")
    .select("id,order_number,status,subtotal_cents,shipping_cents,discount_cents,total_cents,placed_at,ship_street,ship_number,ship_district,ship_city,ship_uf,ship_cep")
    .eq("id", params.id).eq("customer_id", customer.id).maybeSingle();
  if (!order) notFound();
  const o = order as any;

  const { data: items = [] } = await sb.from("order_items").select("product_name,qty,total_cents").eq("order_id", o.id);
  const { data: pay } = await sb.from("payments").select("method,status").eq("order_id", o.id).maybeSingle();
  const stepIdx = PIPELINE.indexOf(o.status);

  return (
    <>
      <Link href="/conta/pedidos" className="back-link"><ArrowLeft size={15} /> Meus pedidos</Link>

      {searchParams?.novo && (
        <div className="ok-banner"><CheckCircle2 size={18} /> Pedido recebido! Enviamos as instruções de pagamento. Assim que confirmarmos, preparamos seu envio.</div>
      )}

      <h1>Pedido #{o.order_number}</h1>
      <p className="acc-sub">Feito em {o.placed_at ? new Date(o.placed_at).toLocaleDateString("pt-BR") : "—"}</p>

      <div className="card">
        <div className="track">
          {PIPELINE.map((s, i) => (
            <div key={s} className={`track-step ${i <= stepIdx ? "done" : ""} ${i === stepIdx ? "current" : ""}`}>
              <span className="track-dot" />
              <span className="track-label">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-grid" style={{ marginTop: 16 }}>
        <div className="card no-pad">
          <div className="card-head pad"><h3 className="card-title">Resumo da compra</h3></div>
          <div className="table">
            {(items as any[]).map((it, i) => (
              <div className="tr" key={i} style={{ gridTemplateColumns: "2fr .5fr 1fr" }}>
                <span className="cell-name">{it.product_name}</span>
                <span className="cell-muted">{it.qty}x</span>
                <span className="ta-r cell-strong">{brl(it.total_cents)}</span>
              </div>
            ))}
            {o.shipping_cents > 0 && <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-muted">Frete</span><span className="ta-r">{brl(o.shipping_cents)}</span></div>}
            {o.discount_cents > 0 && <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-muted">Desconto</span><span className="ta-r">- {brl(o.discount_cents)}</span></div>}
            <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-strong">Total</span><span className="ta-r cell-strong">{brl(o.total_cents)}</span></div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="eyebrow">Pagamento</div>
            {pay ? <p style={{ marginTop: 6 }}>{METHOD_LABEL[(pay as any).method] ?? "—"} · <strong>{PAYMENT_STATUS_LABEL[(pay as any).status] ?? "—"}</strong></p> : <p className="cell-muted" style={{ marginTop: 6 }}>—</p>}
          </div>
          <div className="card">
            <div className="eyebrow">Entrega</div>
            {o.ship_street
              ? <p style={{ marginTop: 6 }} className="cell-muted"><MapPin size={12} /> {o.ship_street}, {o.ship_number} — {o.ship_district}, {o.ship_city}/{o.ship_uf} · {o.ship_cep}</p>
              : <p className="cell-muted" style={{ marginTop: 6 }}>Endereço não informado.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
