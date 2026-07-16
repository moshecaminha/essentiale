import Link from "next/link";
import {
  AlertTriangle, TrendingUp, TrendingDown, PackageSearch, UserMinus,
  Clock, ShoppingCart, CalendarDays, MessageCircle, ArrowRight, Sparkles,
} from "lucide-react";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const diffDays = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : 0);

// ---- Calendário comercial brasileiro (datas fixas e móveis) ----
function nthSunday(year: number, month: number, nth: number) {
  const d = new Date(Date.UTC(year, month, 1));
  const first = d.getUTCDay();
  const day = 1 + ((7 - first) % 7) + (nth - 1) * 7;
  return new Date(Date.UTC(year, month, day));
}
function commercialDates(): { date: Date; name: string; tip: string }[] {
  const y = new Date().getFullYear();
  const list: { date: Date; name: string; tip: string }[] = [];
  for (const year of [y, y + 1]) {
    list.push(
      { date: new Date(Date.UTC(year, 2, 15)), name: "Dia do Consumidor", tip: "Cupom exclusivo para clientes que já compraram" },
      { date: nthSunday(year, 4, 2), name: "Dia das Mães", tip: "Kits presenteáveis + cartão afetivo; campanha 3 semanas antes" },
      { date: new Date(Date.UTC(year, 5, 12)), name: "Dia dos Namorados", tip: "Coleção Namorados em destaque; frete grátis acima de um valor" },
      { date: new Date(Date.UTC(year, 6, 26)), name: "Dia dos Avós", tip: "Vela Avós + mensagem personalizada" },
      { date: nthSunday(year, 7, 2), name: "Dia dos Pais", tip: "Aposte em Speziata/Luxus (aromas amadeirados) e kits" },
      { date: new Date(Date.UTC(year, 8, 15)), name: "Dia do Cliente", tip: "Reativação: cupom para quem não compra há 60+ dias" },
      { date: new Date(Date.UTC(year, 9, 12)), name: "Dia das Crianças", tip: "Home sprays para o quarto; lembrancinhas" },
      { date: new Date(Date.UTC(year, 10, 27)), name: "Black November", tip: "Ofertas progressivas a partir do dia 1º; esvazie estoque parado" },
      { date: new Date(Date.UTC(year, 11, 25)), name: "Natal", tip: "Kits corporativos: prospecte empresas em outubro" },
    );
  }
  const now = Date.now() - DAY;
  return list.filter((d) => d.date.getTime() > now).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4);
}

const wa = (phone: string | null, msg: string) =>
  phone ? `https://wa.me/${phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}?text=${encodeURIComponent(msg)}` : null;

export default async function Inteligencia() {
  const sb = supabaseServer();

  const [ordersQ, itemsQ, prodsQ, rfmQ, cartsQ] = await Promise.all([
    sb.from("orders").select("id,order_number,status,total_cents,placed_at,customer:customers(full_name,phone)").order("placed_at", { ascending: false }).limit(500),
    sb.from("order_items").select("product_id,product_name,qty,total_cents,order:orders(placed_at,status)").limit(1000),
    sb.from("products").select("id,name,stock_qty,low_stock_threshold,active,price_cents,cost_cents").eq("active", true),
    sb.from("customer_rfm").select("id,full_name,segment,recency_days,monetary_cents,frequency").order("monetary_cents", { ascending: false }).limit(200),
    sb.from("saved_carts").select("id,item_count,subtotal_cents,status,updated_at,customer:customers(full_name,phone)").neq("status", "converted").gte("updated_at", daysAgo(7)).order("updated_at", { ascending: false }).limit(20),
  ]);

  const orders = (ordersQ.data ?? []) as any[];
  const items = (itemsQ.data ?? []) as any[];
  const prods = (prodsQ.data ?? []) as any[];
  const rfm = (rfmQ.data ?? []) as any[];
  const carts = (cartsQ.data ?? []) as any[];

  const paidStatuses = (s: string) => !["aguardando_pagamento", "cancelado", "reembolsado"].includes(s);

  // ---- Tendência: últimos 30 dias vs 30 anteriores ----
  const in30 = orders.filter((o) => paidStatuses(o.status) && o.placed_at && diffDays(o.placed_at) < 30);
  const prev30 = orders.filter((o) => paidStatuses(o.status) && o.placed_at && diffDays(o.placed_at) >= 30 && diffDays(o.placed_at) < 60);
  const rev30 = in30.reduce((s, o) => s + o.total_cents, 0);
  const revPrev = prev30.reduce((s, o) => s + o.total_cents, 0);
  const revDelta = revPrev > 0 ? Math.round(((rev30 - revPrev) / revPrev) * 100) : null;
  const ticket = in30.length ? Math.round(rev30 / in30.length) : 0;

  // ---- Ações do dia ----
  type Acao = { icon: any; tipo: string; texto: string; href?: string; waHref?: string | null; urgencia: number };
  const acoes: Acao[] = [];

  // 1. Cobrar pedidos pendentes há 1+ dia
  for (const o of orders.filter((x) => x.status === "aguardando_pagamento" && diffDays(x.placed_at) >= 1).slice(0, 5)) {
    const d = diffDays(o.placed_at);
    acoes.push({
      icon: Clock, tipo: "Cobrar",
      texto: `Pedido #${o.order_number} de ${o.customer?.full_name ?? "cliente"} aguarda pagamento há ${d} dia${d > 1 ? "s" : ""} (${brl(o.total_cents)})`,
      href: `/admin/pedidos/${o.id}`,
      waHref: wa(o.customer?.phone, `Olá, ${(o.customer?.full_name ?? "").split(" ")[0]}! Seu pedido #${o.order_number} na Essentiale está reservado aguardando o pagamento. Posso te ajudar a finalizar?`),
      urgencia: 100 + d,
    });
  }

  // 2. Repor estoque
  for (const p of prods.filter((x) => x.stock_qty <= (x.low_stock_threshold ?? 10)).sort((a, b) => a.stock_qty - b.stock_qty).slice(0, 5)) {
    acoes.push({
      icon: PackageSearch, tipo: p.stock_qty === 0 ? "Esgotado" : "Repor",
      texto: p.stock_qty === 0 ? `${p.name} está esgotado e some da loja para venda` : `${p.name} com estoque baixo: ${p.stock_qty} unidade${p.stock_qty > 1 ? "s" : ""}`,
      href: `/admin/produtos/${p.id}`,
      urgencia: p.stock_qty === 0 ? 90 : 60,
    });
  }

  // 3. Recuperar carrinhos abandonados (últimos 7 dias)
  for (const c of carts.slice(0, 3)) {
    const nome = c.customer?.full_name ?? "Visitante";
    acoes.push({
      icon: ShoppingCart, tipo: "Recuperar",
      texto: `${nome} deixou um carrinho com ${c.item_count} item${c.item_count > 1 ? "s" : ""} (${brl(c.subtotal_cents)}) há ${diffDays(c.updated_at)} dia${diffDays(c.updated_at) !== 1 ? "s" : ""}`,
      href: "/admin/carrinhos",
      waHref: wa(c.customer?.phone, `Olá, ${nome.split(" ")[0]}! Vi que você separou uns produtos na Essentiale e não finalizou. Posso te ajudar? Se quiser, garanto um mimo na sua compra.`),
      urgencia: 70,
    });
  }

  // 4. Reativar clientes que pararam de comprar (RFM)
  const emRisco = rfm.filter((r) => (r.recency_days ?? 0) >= 45 && r.frequency >= 1);
  for (const r of emRisco.slice(0, 3)) {
    acoes.push({
      icon: UserMinus, tipo: "Reativar",
      texto: `${r.full_name} não compra há ${r.recency_days} dias (histórico de ${brl(r.monetary_cents)})`,
      href: "/admin/clientes",
      urgencia: 40,
    });
  }

  acoes.sort((a, b) => b.urgencia - a.urgencia);

  // ---- Mais vendidos e parados (30/60 dias) ----
  const sold30 = new Map<string, { name: string; qty: number; rev: number }>();
  const soldEver = new Set<string>();
  for (const i of items) {
    if (!i.order?.placed_at || !paidStatuses(i.order.status)) continue;
    soldEver.add(i.product_id);
    if (diffDays(i.order.placed_at) < 30) {
      const cur = sold30.get(i.product_id) ?? { name: i.product_name, qty: 0, rev: 0 };
      cur.qty += i.qty; cur.rev += i.total_cents;
      sold30.set(i.product_id, cur);
    }
  }
  const top = Array.from(sold30.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const parados = prods.filter((p) => p.stock_qty > 0 && !soldEver.has(p.id)).slice(0, 5);

  // ---- Margem (usa o preço de custo do cadastro fiscal) ----
  const comCusto = prods.filter((p) => p.cost_cents && p.cost_cents > 0);
  const margemBaixa = comCusto
    .map((p) => ({ ...p, margem: Math.round(((p.price_cents - p.cost_cents) / p.price_cents) * 100) }))
    .filter((p) => p.margem < 40)
    .sort((a, b) => a.margem - b.margem)
    .slice(0, 5);

  const datas = commercialDates();
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" });
  const emDias = (d: Date) => Math.ceil((d.getTime() - Date.now()) / DAY);

  // ---- Resumo do dia para o WhatsApp do admin ----
  const resumoWa = encodeURIComponent(
    `Resumo Essentiale — ${new Date().toLocaleDateString("pt-BR")}\n\n` +
    `Receita 30 dias: ${brl(rev30)} (${in30.length} pedidos, ticket ${brl(ticket)})\n\n` +
    `Ações de hoje:\n` +
    (acoes.length ? acoes.slice(0, 6).map((a) => `• [${a.tipo}] ${a.texto}`).join("\n") : "• Tudo em dia!")
  );

  const temDados = orders.length > 0 || prods.length > 0;

  return (
    <>
      <div className="topbar">
        <h1>Inteligência</h1>
        <a href={`https://wa.me/?text=${resumoWa}`} target="_blank" rel="noopener noreferrer" className="adm-btn ghost">
          <MessageCircle size={15} /> Enviar resumo do dia no WhatsApp
        </a>
      </div>
      <div className="content stack">

        <section className="summary" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <div className="kpi"><span className="kpi-label">Receita 30 dias</span><span className="kpi-value">{brl(rev30)}</span></div>
          <div className="kpi">
            <span className="kpi-label">vs. 30 dias anteriores</span>
            <span className="kpi-value" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {revDelta == null ? "—" : <>{revDelta >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}{revDelta >= 0 ? "+" : ""}{revDelta}%</>}
            </span>
          </div>
          <div className="kpi"><span className="kpi-label">Pedidos 30 dias</span><span className="kpi-value">{in30.length}</span></div>
          <div className="kpi"><span className="kpi-label">Ticket médio</span><span className="kpi-value">{brl(ticket)}</span></div>
        </section>

        <div className="card stack">
          <div className="intel-head"><Sparkles size={16} /> <h3 className="card-title" style={{ margin: 0 }}>O que fazer hoje</h3>
            <span className="cell-muted" style={{ fontSize: 12 }}>gerado automaticamente a partir dos seus dados</span>
          </div>
          {acoes.length === 0 ? (
            <p className="cell-muted">Tudo em dia. Nenhuma pendência de cobrança, estoque, carrinho ou reativação no momento.</p>
          ) : (
            <div className="intel-list">
              {acoes.slice(0, 8).map((a, i) => (
                <div className="intel-item" key={i}>
                  <span className={`intel-tag ${a.urgencia >= 90 ? "hot" : a.urgencia >= 60 ? "warm" : ""}`}><a.icon size={13} /> {a.tipo}</span>
                  <span className="intel-text">{a.texto}</span>
                  <span className="intel-actions">
                    {a.waHref && <a href={a.waHref} target="_blank" rel="noopener noreferrer" className="adm-btn ghost sm"><MessageCircle size={13} /> WhatsApp</a>}
                    {a.href && <Link href={a.href} className="adm-btn ghost sm">Abrir <ArrowRight size={13} /></Link>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="intel-grid">
          <div className="card stack">
            <h3 className="card-title">Mais vendidos · 30 dias</h3>
            {top.length === 0 ? <p className="cell-muted">Sem vendas registradas nos últimos 30 dias.</p> : top.map((t, i) => (
              <div className="sum-row" key={i}><span>{i + 1}. {t.name}</span><span>{t.qty} un · {brl(t.rev)}</span></div>
            ))}
          </div>

          <div className="card stack">
            <h3 className="card-title">Parados no estoque</h3>
            {parados.length === 0 ? <p className="cell-muted">Nenhum produto ativo com estoque e sem nenhuma venda.</p> : (
              <>
                {parados.map((p) => (
                  <div className="sum-row" key={p.id}><span>{p.name}</span><span>{p.stock_qty} un</span></div>
                ))}
                <p className="cell-muted" style={{ fontSize: 12.5 }}>Sugestão: incluir na próxima campanha ou criar um kit com um best-seller.</p>
              </>
            )}
          </div>

          <div className="card stack">
            <h3 className="card-title">Margens apertadas</h3>
            {comCusto.length === 0 ? (
              <p className="cell-muted">Preencha o <strong>preço de custo</strong> no cadastro dos produtos para eu calcular as margens automaticamente.</p>
            ) : margemBaixa.length === 0 ? (
              <p className="cell-muted">Nenhum produto com margem abaixo de 40%. Saudável.</p>
            ) : margemBaixa.map((p) => (
              <div className="sum-row" key={p.id}><span>{p.name}</span><span className={p.margem < 25 ? "pill out" : "pill low"}>{p.margem}%</span></div>
            ))}
          </div>

          <div className="card stack">
            <h3 className="card-title"><CalendarDays size={15} style={{ verticalAlign: "-2px" }} /> Calendário comercial</h3>
            {datas.map((d) => (
              <div className="intel-date" key={d.name}>
                <div className="sum-row" style={{ marginBottom: 2 }}>
                  <strong>{d.name}</strong>
                  <span className="cell-muted">{fmt(d.date)} · em {emDias(d.date)} dias</span>
                </div>
                <p className="cell-muted" style={{ margin: 0, fontSize: 12.5 }}>{d.tip}</p>
              </div>
            ))}
            <Link href="/admin/campanhas" className="adm-btn ghost sm" style={{ alignSelf: "flex-start" }}>Planejar campanha <ArrowRight size={13} /></Link>
          </div>
        </div>

        {!temDados && (
          <div className="empty">
            <div className="eyebrow"><AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Poucos dados ainda</div>
            <p>Os insights ficam mais precisos conforme os pedidos entram no sistema (pelo site ou registrados manualmente em Pedidos).</p>
          </div>
        )}
      </div>
    </>
  );
}
