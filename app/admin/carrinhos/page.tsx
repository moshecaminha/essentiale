import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

type Cart = {
  id: string; session_id: string; status: string; item_count: number; subtotal_cents: number;
  updated_at: string; items: any[]; customer: { full_name: string; phone: string | null } | null;
};

const STATUS: Record<string, { l: string; c: string }> = {
  ativo: { l: "Em aberto", c: "info" },
  enviado_whatsapp: { l: "Enviado ao WhatsApp", c: "low" },
  finalizado: { l: "Finalizado", c: "ok" },
  vazio: { l: "Esvaziado", c: "out" },
};

export default async function Carrinhos() {
  const sb = supabaseServer();
  const { data: carts = [] } = await sb
    .from("saved_carts")
    .select("id,session_id,status,item_count,subtotal_cents,updated_at,items,customer:customers(full_name,phone)")
    .order("updated_at", { ascending: false })
    .limit(100);

  const list = (carts as unknown as Cart[]) ?? [];
  const abertos = list.filter((c) => c.status === "ativo");
  const wpp = list.filter((c) => c.status === "enviado_whatsapp");
  const valorAberto = abertos.reduce((s, c) => s + c.subtotal_cents, 0);

  const resumo = [
    { l: "Carrinhos em aberto", v: String(abertos.length) },
    { l: "Valor em aberto", v: brl(valorAberto) },
    { l: "Enviados ao WhatsApp", v: String(wpp.length) },
    { l: "Finalizados", v: String(list.filter((c) => c.status === "finalizado").length) },
  ];

  return (
    <>
      <div className="topbar"><h1>Carrinhos e intenções</h1></div>
      <div className="content stack">
        <p className="acc-sub" style={{ marginTop: 0 }}>Tudo que os clientes colocam no carrinho fica salvo aqui — mesmo sem finalizar — para você recuperar vendas e entender objeções.</p>
        <section className="summary">
          {resumo.map((r) => (
            <div className="kpi" key={r.l}><span className="kpi-label">{r.l}</span><span className="kpi-value">{r.v}</span></div>
          ))}
        </section>

        {list.length === 0 ? (
          <div className="empty"><div className="eyebrow">Sem carrinhos ainda</div><p>Assim que os clientes começarem a navegar e adicionar produtos, os carrinhos aparecem aqui.</p></div>
        ) : (
          <div className="card no-pad">
            <div className="tr th carrinhos">
              <span>Cliente</span><span>Itens</span><span className="ta-r">Valor</span><span className="ta-r">Atualizado</span><span className="ta-r">Situação</span>
            </div>
            {list.map((c) => (
              <div className="tr carrinhos" key={c.id}>
                <span className="cell-name">{c.customer?.full_name ?? "Visitante"}</span>
                <span className="cell-muted">{(c.items || []).map((i: any) => `${i.qty}x ${i.n}`).join(", ") || `${c.item_count} item(ns)`}</span>
                <span className="ta-r cell-strong">{brl(c.subtotal_cents)}</span>
                <span className="ta-r cell-muted">{new Date(c.updated_at).toLocaleDateString("pt-BR")}</span>
                <span className="ta-r"><span className={`pill ${STATUS[c.status]?.c ?? "info"}`}>{STATUS[c.status]?.l ?? c.status}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
