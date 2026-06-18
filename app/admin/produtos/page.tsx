import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  name: string;
  price_cents: number;
  stock_qty: number;
  low_stock_threshold: number;
  image_url: string | null;
  category: { name: string } | null;
};

export default async function Produtos() {
  const sb = supabaseServer();
  const { data: products = [] } = await sb
    .from("products")
    .select("id,name,price_cents,stock_qty,low_stock_threshold,image_url,category:categories(name)")
    .order("name");

  const list = (products as unknown as Product[]) ?? [];

  return (
    <>
      <div className="topbar"><h1>Produtos e estoque</h1></div>
      <div className="content stack">
        <header>
          <div className="eyebrow">Catálogo · {list.length} itens</div>
          <p className="reading-line">Catálogo importado do site da Essentiale, vivo no banco de dados.</p>
        </header>

        <div className="card no-pad">
          <div className="tr th products">
            <span>Produto</span><span>Categoria</span>
            <span className="ta-r">Preço</span><span className="ta-r">Estoque</span>
            <span className="ta-r">Situação</span>
          </div>
          {list.map((p) => (
            <div className="tr products" key={p.id}>
              <span className="cell-name">
                {p.image_url && <img src={p.image_url} alt="" className="row-thumb" />}
                {p.name}
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
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
