import Link from "next/link";
import { Plus } from "lucide-react";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Order = {
  id: string; order_number: number; status: string; total_cents: number;
  placed_at: string | null; customer: { full_name: string } | null;
};

const pillClass = (s: string) =>
  s === "entregue" ? "ok" : s === "aguardando_pagamento" ? "low" : s === "cancelado" || s === "reembolsado" ? "out" : "info";

// Filtros de status na ordem do fluxo do pedido
const FILTERS: { key: string; label: string; statuses: string[] }[] = [
  { key: "todos", label: "Todos", statuses: [] },
  { key: "pendentes", label: "Pendentes", statuses: ["aguardando_pagamento"] },
  { key: "pagos", label: "Pagos", statuses: ["pago"] },
  { key: "em_espera", label: "Em separação", statuses: ["em_separacao"] },
  { key: "enviados", label: "Enviados", statuses: ["enviado", "a_caminho"] },
  { key: "entregues", label: "Entregues", statuses: ["entregue"] },
  { key: "cancelados", label: "Cancelados", statuses: ["cancelado", "reembolsado"] },
];

export default async function Pedidos({ searchParams }: { searchParams?: { status?: string } }) {
  const sb = supabaseServer();
  const { data: orders = [] } = await sb
    .from("orders")
    .select("id,order_number,status,total_cents,placed_at,customer:customers(full_name)")
    .order("placed_at", { ascending: false });

  const all = (orders as unknown as Order[]) ?? [];

  const active = FILTERS.find((f) => f.key === (searchParams?.status ?? "todos")) ?? FILTERS[0];
  const list = active.statuses.length === 0 ? all : all.filter((o) => active.statuses.includes(o.status));

  const countFor = (f: (typeof FILTERS)[number]) =>
    f.statuses.length === 0 ? all.length : all.filter((o) => f.statuses.includes(o.status)).length;

  const pagos = all.filter((o) => !["aguardando_pagamento", "cancelado", "reembolsado"].includes(o.status));
  const receita = pagos.reduce((s, o) => s + o.total_cents, 0);
  const pend = all.filter((o) => o.status === "aguardando_pagamento").length;

  const resumo = [
    { l: "Pedidos", v: String(all.length) },
    { l: "Receita registrada", v: brl(receita) },
    { l: "Aguardando pagamento", v: String(pend) },
  ];

  return (
    <>
      <div className="topbar">
        <h1>Pedidos</h1>
        <Link href="/admin/pedidos/novo" className="adm-btn"><Plus size={16} /> Registrar pedido</Link>
      </div>
      <div className="content stack">
        <section className="summary" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {resumo.map((r) => (
            <div className="kpi" key={r.l}><span className="kpi-label">{r.l}</span><span className="kpi-value">{r.v}</span></div>
          ))}
        </section>

        <div className="status-tabs">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "todos" ? "/admin/pedidos" : `/admin/pedidos?status=${f.key}`}
              className={`status-tab ${active.key === f.key ? "on" : ""}`}
            >
              {f.label} <span className="status-count">{countFor(f)}</span>
            </Link>
          ))}
        </div>

        {all.length === 0 ? (
          <div className="empty">
            <div className="eyebrow">Nenhum pedido ainda</div>
            <p>Registre as vendas que chegam pelo WhatsApp em &quot;Registrar pedido&quot;. Cada pedido alimenta o Financeiro, os Clientes (RFM) e a Inteligência automaticamente.</p>
            <Link href="/admin/pedidos/novo" className="adm-btn"><Plus size={16} /> Registrar primeiro pedido</Link>
          </div>
        ) : list.length === 0 ? (
          <div className="empty">
            <div className="eyebrow">Nada por aqui</div>
            <p>Nenhum pedido com o status &quot;{active.label}&quot; no momento.</p>
          </div>
        ) : (
          <div className="card no-pad">
            <div className="tr th pedidos">
              <span>Pedido</span><span>Cliente</span><span>Data</span>
              <span className="ta-r">Total</span><span className="ta-r">Status</span><span></span>
            </div>
            {list.map((o) => (
              <div className="tr pedidos" key={o.id}>
                <span className="cell-strong">#{o.order_number}</span>
                <span className="cell-name">{o.customer?.full_name ?? "—"}</span>
                <span className="cell-muted">{o.placed_at ? new Date(o.placed_at).toLocaleDateString("pt-BR") : "—"}</span>
                <span className="ta-r cell-strong">{brl(o.total_cents)}</span>
                <span className="ta-r"><span className={`pill ${pillClass(o.status)}`}>{STATUS_LABEL[o.status]}</span></span>
                <span className="ta-r"><Link href={`/admin/pedidos/${o.id}`} className="adm-btn ghost sm">Abrir</Link></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
