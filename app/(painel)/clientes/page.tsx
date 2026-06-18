import { supabaseServer, hasFullAccess } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEG_LABEL: Record<string, string> = {
  campeas: "Campeãs", fieis: "Fiéis", promissoras: "Promissoras",
  em_risco: "Em risco", hibernando: "Hibernando", novas: "Novas",
};

type Rfm = {
  id: string; full_name: string; city: string | null; uf: string | null;
  frequency: number; monetary_cents: number; recency_days: number | null; segment: string;
};

export default async function Clientes() {
  const sb = supabaseServer();
  const full = hasFullAccess();

  const { data: rfm = [] } = await sb
    .from("customer_rfm")
    .select("*")
    .order("monetary_cents", { ascending: false })
    .limit(50);

  const list = (rfm as unknown as Rfm[]) ?? [];

  return (
    <>
      <div className="topbar"><h1>Clientes</h1></div>
      <div className="content stack">
        <header>
          <div className="eyebrow">CRM · Segmentação automática (RFM)</div>
          <p className="reading-line">
            Cada cliente é classificado por <em>recência, frequência e valor</em> assim que começa a comprar.
          </p>
        </header>

        {!full ? (
          <div className="empty">
            <div className="eyebrow">Acesso protegido</div>
            <p>
              Os dados de clientes são protegidos por segurança de linha. Adicione a
              <code> SUPABASE_SERVICE_ROLE_KEY</code> ao ambiente para visualizá-los aqui no painel.
            </p>
          </div>
        ) : list.length === 0 ? (
          <div className="empty">
            <div className="eyebrow">Sem clientes ainda</div>
            <p>
              A segmentação RFM aparece automaticamente quando entrarem os primeiros pedidos.
              O cálculo já está pronto no banco — é só os dados começarem a fluir.
            </p>
          </div>
        ) : (
          <div className="card no-pad">
            <div className="tr th" style={{ gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.8fr 1fr" }}>
              <span>Cliente</span><span>Local</span><span>Segmento</span>
              <span className="ta-r">Última</span><span className="ta-r">Pedidos</span>
              <span className="ta-r">Total</span>
            </div>
            {list.map((c) => (
              <div className="tr" key={c.id} style={{ gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.8fr 1fr" }}>
                <span className="cell-name">{c.full_name}</span>
                <span className="cell-muted">{c.city ? `${c.city}/${c.uf}` : "—"}</span>
                <span>{SEG_LABEL[c.segment] ?? c.segment}</span>
                <span className="ta-r">{c.recency_days != null ? `${c.recency_days}d` : "—"}</span>
                <span className="ta-r">{c.frequency}</span>
                <span className="ta-r cell-strong">{brl(c.monetary_cents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
