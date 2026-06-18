import Link from "next/link";
import { Plus } from "lucide-react";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";
import ProductRowActions from "@/components/ProductRowActions";

export const dynamic = "force-dynamic";

type Product = {
  id: string; name: string; price_cents: number; stock_qty: number;
  low_stock_threshold: number; active: boolean; image_url: string | null;
  category: { name: string } | null;
};

export default async function Produtos() {
  const sb = supabaseServer();
  const { data: products = [] } = await sb
    .from("products")
    .select("id,name,price_cents,stock_qty,low_stock_threshold,active,image_url,category:categories(name)")
    .order("name");

  const list = (products as unknown as Product[]) ?? [];
  const ativos = list.filter((p) => p.active);
  const esgotados = list.filter((p) => p.stock_qty === 0).length;
  const baixo = list.filter((p) => p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold).length;
  const valor = list.reduce((s, p) => s + p.price_cents * p.stock_qty, 0);

  const resumo = [
    { l: "Produtos", v: String(list.length) },
    { l: "Ativos", v: String(ativos.length) },
    { l: "Esgotados", v: String(esgotados) },
    { l: "Estoque baixo", v: String(baixo) },
    { l: "Valor em estoque", v: brl(valor) },
  ];

  return (
    <>
      <div className="topbar">
        <h1>Produtos e estoque</h1>
        <Link href="/admin/produtos/novo" className="adm-btn"><Plus size={16} /> Novo produto</Link>
      </div>
      <div className="content stack">
        <section className="summary">
          {resumo.map((r) => (
            <div className="kpi" key={r.l}>
              <span className="kpi-label">{r.l}</span>
              <span className="kpi-value">{r.v}</span>
            </div>
          ))}
        </section>

        <div className="card no-pad">
          <div className="tr th pmanage">
            <span>Produto</span><span>Categoria</span>
            <span className="ta-r">Preço</span><span className="ta-r">Estoque</span>
            <span className="ta-r">Situação</span><span className="ta-r">Ações</span>
          </div>
          {list.map((p) => (
            <div className="tr pmanage" key={p.id}>
              <span className="cell-name">
                {p.image_url && <img src={p.image_url} alt="" className="row-thumb" />}
                {p.name}{!p.active && <small style={{ color: "var(--muted)" }}> · inativo</small>}
              </span>
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
              <span className="ta-r"><ProductRowActions id={p.id} /></span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
