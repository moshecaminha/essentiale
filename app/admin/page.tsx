import Link from "next/link";
import { supabaseServer, hasFullAccess } from "@/lib/supabaseServer";
import { brl, num } from "@/lib/format";
import { TriangleAlert, TrendingUp, ShoppingCart, Users, Gift, Wallet, Package, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const PERIODS = [{ d: 7, l: "7 dias" }, { d: 30, l: "30 dias" }, { d: 90, l: "90 dias" }, { d: 365, l: "12 meses" }];

// datas comemorativas relevantes para presentes
function nthSunday(year: number, month0: number, n: number) {
  const d = new Date(year, month0, 1);
  const add = (7 - d.getDay()) % 7;
  return new Date(year, month0, 1 + add + (n - 1) * 7);
}
function lastFriday(year: number, month0: number) {
  const d = new Date(year, month0 + 1, 0);
  return new Date(year, month0 + 1, 0 - ((d.getDay() - 5 + 7) % 7));
}
function commemorations(now: Date) {
  const y = now.getFullYear();
  const build = (yr: number) => [
    { name: "Dia da Mulher", date: new Date(yr, 2, 8), tip: "Mini velas e cartões afetivos para reconhecer clientes e equipes." },
    { name: "Dia das Mães", date: nthSunday(yr, 4, 2), tip: "Linha Essência do Sentir e kits — o pico de vendas do semestre." },
    { name: "Dia dos Namorados", date: new Date(yr, 5, 12), tip: "Velas Corações e Envelope do Amor; combos para presentear." },
    { name: "Dia dos Pais", date: nthSunday(yr, 7, 2), tip: "Difusores e home sprays amadeirados; kits masculinos." },
    { name: "Dia do Cliente", date: new Date(yr, 8, 15), tip: "Recompense clientes fiéis (campeãs/fiéis) com brinde ou cupom." },
    { name: "Black Friday", date: lastFriday(yr, 10), tip: "Kits e atacado; recupere carrinhos abandonados com oferta." },
    { name: "Natal", date: new Date(yr, 11, 25), tip: "Lembrancinhas corporativas e kits presente — antecipe estoque." },
  ];
  const all = [...build(y), ...build(y + 1)];
  return all
    .map((c) => ({ ...c, days: Math.ceil((c.date.getTime() - now.getTime()) / 86400000) }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
}

export default async function VisaoGeral({ searchParams }: { searchParams: { p?: string } }) {
  const sb = supabaseServer();
  const full = hasFullAccess();
  const days = [7, 30, 90, 365].includes(Number(searchParams?.p)) ? Number(searchParams.p) : 30;

  const { data: products = [] } = await sb
    .from("products")
    .select("id,name,price_cents,stock_qty,low_stock_threshold,active")
    .order("stock_qty", { ascending: true });
  const list = (products as any[]) ?? [];
  const active = list.filter((p) => p.active);
  const lowStock = active.filter((p) => p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold);
  const outOfStock = active.filter((p) => p.stock_qty === 0);
  const inventoryValue = active.reduce((s, p) => s + p.price_cents * p.stock_qty, 0);

  let r: any = null;
  if (full) {
    const { data } = await sb.rpc("report_overview", { days });
    r = data;
  }

  const salesByDay: { day: string; revenue_cents: number; orders: number }[] = r?.sales_by_day ?? [];
  const maxRev = Math.max(1, ...salesByDay.map((d) => d.revenue_cents));
  const bestSellers: { product_name: string; qty: number; revenue_cents: number }[] = r?.best_sellers ?? [];
  const conv = r && r.checkout_starts > 0 ? Math.round((r.purchases / r.checkout_starts) * 100) : 0;
  const datas = commemorations(new Date());

  return (
    <>
      <div className="topbar">
        <h1>Visão geral</h1>
        <div className="period">
          {PERIODS.map((pp) => (
            <Link key={pp.d} href={`/admin?p=${pp.d}`} className={`period-btn ${days === pp.d ? "on" : ""}`}>{pp.l}</Link>
          ))}
        </div>
      </div>

      <div className="content stack">
        {!full ? (
          <div className="empty">
            <div className="eyebrow">Relatório protegido</div>
            <p>Adicione a <code>SUPABASE_SERVICE_ROLE_KEY</code> ao ambiente para o painel calcular vendas, clientes e métricas.</p>
          </div>
        ) : (
          <>
            <header>
              <div className="eyebrow">Relatório de vendas · últimos {days === 365 ? "12 meses" : `${days} dias`}</div>
              <p className="reading-line">
                {r?.orders_count > 0
                  ? <>Você teve <em>{num(r.orders_count)} pedido(s)</em> no período, com ticket médio de <em>{brl(r.avg_ticket_cents)}</em>. {r.abandoned_count > 0 && <>Há {num(r.abandoned_count)} carrinho(s) em aberto somando {brl(r.abandoned_value_cents)} para recuperar.</>}</>
                  : <>Ainda sem pedidos neste período. Assim que as vendas entrarem, o relatório se preenche automaticamente.</>}
              </p>
            </header>

            <section className="kpis">
              <div className="kpi"><span className="kpi-label"><TrendingUp size={13} /> Receita confirmada</span><span className="kpi-value">{brl(r?.revenue_paid_cents ?? 0)}</span></div>
              <div className="kpi"><span className="kpi-label"><Clock size={13} /> Aguardando pagamento</span><span className="kpi-value">{brl(r?.revenue_pending_cents ?? 0)}</span></div>
              <div className="kpi"><span className="kpi-label"><ShoppingCart size={13} /> Pedidos</span><span className="kpi-value">{num(r?.orders_count ?? 0)}</span></div>
              <div className="kpi"><span className="kpi-label"><Wallet size={13} /> Ticket médio</span><span className="kpi-value">{brl(r?.avg_ticket_cents ?? 0)}</span></div>
            </section>
            <section className="kpis">
              <div className="kpi"><span className="kpi-label"><Users size={13} /> Novos clientes</span><span className="kpi-value">{num(r?.new_customers ?? 0)}</span></div>
              <div className="kpi"><span className="kpi-label"><ShoppingCart size={13} /> Carrinhos em aberto</span><span className="kpi-value">{num(r?.abandoned_count ?? 0)}</span><span className="kpi-sub">{brl(r?.abandoned_value_cents ?? 0)} a recuperar</span></div>
              <div className="kpi"><span className="kpi-label"><TrendingUp size={13} /> Conversão</span><span className="kpi-value">{conv}%</span><span className="kpi-sub">{num(r?.purchases ?? 0)} de {num(r?.checkout_starts ?? 0)} checkouts</span></div>
              <div className="kpi"><span className="kpi-label"><Users size={13} /> Clientes na base</span><span className="kpi-value">{num(r?.total_customers ?? 0)}</span></div>
            </section>

            <div className="card">
              <div className="eyebrow">Vendas por dia</div>
              {salesByDay.length === 0 ? (
                <p className="cell-muted" style={{ marginTop: 10 }}>Sem vendas registradas no período.</p>
              ) : (
                <div className="chart">
                  {salesByDay.map((d) => (
                    <div className="chart-col" key={d.day} title={`${d.day}: ${brl(d.revenue_cents)} · ${d.orders} pedido(s)`}>
                      <div className="chart-bar" style={{ height: `${Math.max(4, (d.revenue_cents / maxRev) * 100)}%` }} />
                      <span className="chart-x">{d.day.slice(8, 10)}/{d.day.slice(5, 7)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <section className="grid-2">
              <div className="card no-pad">
                <div className="card-head pad"><h3 className="card-title">Mais vendidos no período</h3></div>
                {bestSellers.length === 0 ? (
                  <p className="cell-muted" style={{ padding: "0 20px 18px" }}>Sem vendas ainda.</p>
                ) : (
                  <div className="table">
                    {bestSellers.map((b, i) => (
                      <div className="tr" key={i} style={{ gridTemplateColumns: "1.8fr .5fr 1fr" }}>
                        <span className="cell-name">{b.product_name}</span>
                        <span className="cell-muted">{b.qty}x</span>
                        <span className="ta-r cell-strong">{brl(b.revenue_cents)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="eyebrow"><Gift size={13} /> Datas comemorativas — prepare-se</div>
                <div className="stack" style={{ marginTop: 12, gap: 12 }}>
                  {datas.map((d) => (
                    <div className="comm" key={d.name}>
                      <div className="comm-top"><strong>{d.name}</strong><span className="comm-days">{d.days === 0 ? "hoje" : `em ${d.days} dia(s)`}</span></div>
                      <span className="cell-muted">{d.tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {(outOfStock.length > 0 || lowStock.length > 0) && (
              <div className="card">
                <div className="eyebrow"><Package size={13} /> Estoque · {active.length} ativos · {brl(inventoryValue)} parados</div>
                <div className="stack" style={{ marginTop: 12 }}>
                  {outOfStock.map((p) => (
                    <div className="alert" key={p.id}><TriangleAlert size={16} color="#B5715C" /><span><strong>{p.name}</strong> está esgotado. Repor para não perder vendas.</span></div>
                  ))}
                  {lowStock.map((p) => (
                    <div className="alert" key={p.id}><TriangleAlert size={16} color="#C08B4F" /><span><strong>{p.name}</strong> com estoque baixo: {p.stock_qty} unidades.</span></div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
