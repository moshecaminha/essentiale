import { supabaseServer, hasFullAccess } from "@/lib/supabaseServer";
import { brl, num } from "@/lib/format";
import { TriangleAlert, Package, Layers, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  name: string;
  price_cents: number;
  stock_qty: number;
  low_stock_threshold: number;
  active: boolean;
  category: { name: string } | null;
};

export default async function VisaoGeral() {
  const sb = supabaseServer();

  const { data: products = [] } = await sb
    .from("products")
    .select("id,name,price_cents,stock_qty,low_stock_threshold,active,category:categories(name)")
    .order("stock_qty", { ascending: true });

  const list = (products as unknown as Product[]) ?? [];
  const active = list.filter((p) => p.active);
  const lowStock = active.filter((p) => p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold);
  const outOfStock = active.filter((p) => p.stock_qty === 0);
  const inventoryValue = active.reduce((s, p) => s + p.price_cents * p.stock_qty, 0);

  const { count: catCount } = await sb
    .from("categories")
    .select("*", { count: "exact", head: true });

  // Dados protegidos por RLS (precisam da service_role)
  const { count: customerCount } = await sb
    .from("customers")
    .select("*", { count: "exact", head: true });
  const { count: orderCount } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true });

  const full = hasFullAccess();

  return (
    <>
      <div className="topbar"><h1>Visão geral</h1></div>
      <div className="content stack">
        <header>
          <div className="eyebrow">Catálogo conectado · {new Date().toLocaleDateString("pt-BR")}</div>
          <p className="reading-line">
            Seu catálogo tem <em>{active.length} produtos ativos</em> em {catCount ?? 0} categorias.
            {outOfStock.length > 0 && <> {outOfStock.length} estão esgotados e </>}
            {lowStock.length > 0
              ? <> {lowStock.length} com estoque baixo pedem atenção.</>
              : <> o estoque está saudável.</>}
          </p>
        </header>

        <section className="kpis">
          <div className="kpi">
            <span className="kpi-label">Produtos ativos</span>
            <span className="kpi-value">{num(active.length)}</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Categorias</span>
            <span className="kpi-value">{num(catCount ?? 0)}</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Valor em estoque</span>
            <span className="kpi-value">{brl(inventoryValue)}</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Alertas de estoque</span>
            <span className="kpi-value">{num(lowStock.length + outOfStock.length)}</span>
          </div>
        </section>

        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <section className="stack">
            {outOfStock.map((p) => (
              <div className="alert" key={p.id}>
                <TriangleAlert size={16} color="#B5715C" />
                <span><strong>{p.name}</strong> está esgotado. Repor para não perder vendas.</span>
              </div>
            ))}
            {lowStock.map((p) => (
              <div className="alert" key={p.id}>
                <TriangleAlert size={16} color="#C08B4F" />
                <span><strong>{p.name}</strong> com estoque baixo: {p.stock_qty} unidades.</span>
              </div>
            ))}
          </section>
        )}

        <section className="grid-2">
          <div className="card no-pad">
            <div className="tr th products">
              <span>Produto</span><span>Categoria</span>
              <span className="ta-r">Preço</span><span className="ta-r">Estoque</span>
              <span className="ta-r">Situação</span>
            </div>
            {active.slice(0, 8).map((p) => (
              <div className="tr products" key={p.id}>
                <span className="cell-name">{p.name}</span>
                <span className="cell-muted hide-sm">{p.category?.name ?? "—"}</span>
                <span className="ta-r cell-strong hide-sm">{brl(p.price_cents)}</span>
                <span className="ta-r">{p.stock_qty}</span>
                <span className="ta-r">
                  {p.stock_qty === 0
                    ? <span className="pill out">Esgotado</span>
                    : p.stock_qty <= p.low_stock_threshold
                    ? <span className="pill low">Baixo</span>
                    : <span className="pill ok">Ok</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="stack">
            <div className="card">
              <div className="eyebrow">Clientes e vendas</div>
              {full ? (
                <div className="stack" style={{ marginTop: 12 }}>
                  <div>Clientes cadastrados: <strong>{num(customerCount ?? 0)}</strong></div>
                  <div>Pedidos: <strong>{num(orderCount ?? 0)}</strong></div>
                  {(customerCount ?? 0) === 0 && (
                    <p className="cell-muted">Sem clientes ainda. A inteligência liga assim que entrarem os primeiros pedidos.</p>
                  )}
                </div>
              ) : (
                <p className="cell-muted" style={{ marginTop: 10 }}>
                  Adicione a chave <code>SUPABASE_SERVICE_ROLE_KEY</code> ao ambiente para o painel ler
                  clientes, pedidos e a base RFM (protegidos por segurança de linha).
                </p>
              )}
            </div>
            <div className="banner-note">
              Próximas fases: cadastro de clientes com CEP automático, pedidos e entregas,
              e o painel de inteligência com segmentação RFM sobre dados reais.
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
