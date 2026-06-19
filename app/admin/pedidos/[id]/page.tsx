import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";
import { PIPELINE, STATUS_LABEL, METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orders";
import OrderActions from "@/components/OrderActions";

export const dynamic = "force-dynamic";

export default async function PedidoDetalhe({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: order } = await sb
    .from("orders")
    .select("id,order_number,status,total_cents,subtotal_cents,shipping_cents,discount_cents,placed_at,ship_recipient,ship_city,ship_uf,customer:customers(full_name,phone)")
    .eq("id", params.id)
    .maybeSingle();
  if (!order) notFound();

  const { data: items = [] } = await sb.from("order_items").select("product_name,unit_price_cents,qty,total_cents").eq("order_id", params.id);
  const { data: pay } = await sb.from("payments").select("method,status,amount_cents").eq("order_id", params.id).maybeSingle();

  const o = order as any;
  const stepIdx = PIPELINE.indexOf(o.status);

  return (
    <>
      <div className="topbar"><h1>Pedido #{o.order_number}</h1></div>
      <div className="content stack">
        <Link href="/admin/pedidos" className="back-link"><ArrowLeft size={15} /> Voltar para pedidos</Link>

        <div className="card stack">
          <div className="track">
            {PIPELINE.map((s, i) => (
              <div key={s} className={`track-step ${i <= stepIdx ? "done" : ""} ${i === stepIdx ? "current" : ""}`}>
                <span className="track-dot" />
                <span className="track-label">{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>
          <OrderActions id={o.id} status={o.status} phone={o.customer?.phone ?? null} orderNumber={o.order_number} />
        </div>

        <div className="grid-2">
          <div className="card no-pad">
            <div className="card-head pad"><h3 className="card-title">Itens</h3></div>
            <div className="table">
              {(items as any[]).map((it, i) => (
                <div className="tr" key={i} style={{ gridTemplateColumns: "2fr .6fr 1fr" }}>
                  <span className="cell-name">{it.product_name}</span>
                  <span className="cell-muted">{it.qty}x</span>
                  <span className="ta-r cell-strong">{brl(it.total_cents)}</span>
                </div>
              ))}
              <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-muted">Subtotal</span><span className="ta-r">{brl(o.subtotal_cents)}</span></div>
              <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-muted">Frete</span><span className="ta-r">{brl(o.shipping_cents)}</span></div>
              {o.discount_cents > 0 && <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-muted">Desconto</span><span className="ta-r">- {brl(o.discount_cents)}</span></div>}
              <div className="tr" style={{ gridTemplateColumns: "1fr 1fr" }}><span className="cell-strong">Total</span><span className="ta-r cell-strong">{brl(o.total_cents)}</span></div>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <div className="eyebrow">Cliente</div>
              <p style={{ fontWeight: 600, marginTop: 6 }}>{o.customer?.full_name ?? "—"}</p>
              {o.customer?.phone && <p className="cell-muted">WhatsApp: {o.customer.phone}</p>}
              {(o.ship_city || o.ship_uf) && <p className="cell-muted"><MapPin size={12} /> {o.ship_city}{o.ship_uf ? `/${o.ship_uf}` : ""}</p>}
            </div>
            <div className="card">
              <div className="eyebrow">Pagamento</div>
              {pay ? (
                <p style={{ marginTop: 6 }}>{METHOD_LABEL[(pay as any).method] ?? "—"} · <strong>{PAYMENT_STATUS_LABEL[(pay as any).status] ?? "—"}</strong></p>
              ) : <p className="cell-muted" style={{ marginTop: 6 }}>Sem pagamento registrado.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
