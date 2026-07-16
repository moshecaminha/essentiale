"use client";

import Link from "next/link";
import { saveProduct } from "@/app/admin/produtos/actions";
import { FRAGRANCES_ADMIN } from "@/lib/catalog";

type Cat = { id: string; name: string };
type Product = {
  id: string; name: string; slug: string; price_cents: number;
  compare_at_cents: number | null; stock_qty: number; low_stock_threshold: number;
  description: string | null; active: boolean; image_url: string | null;
  category_id: string | null; fragrance: string | null; is_wholesale: boolean;
  cost_cents: number | null; sku: string | null; gtin: string | null;
  ncm: string | null; cest: string | null; cfop: string | null;
  origem: number | null; csosn: string | null; cst_icms: string | null;
  aliq_icms: number | null; aliq_pis: number | null; aliq_cofins: number | null;
  unidade: string | null; peso_gramas: number | null;
  altura_cm: number | null; largura_cm: number | null; profundidade_cm: number | null;
} | null;

const reais = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

const ORIGENS = [
  { v: 0, l: "0 — Nacional" },
  { v: 1, l: "1 — Estrangeira (importação direta)" },
  { v: 2, l: "2 — Estrangeira (adquirida no mercado interno)" },
  { v: 3, l: "3 — Nacional, importação entre 40% e 70%" },
  { v: 4, l: "4 — Nacional, processos produtivos básicos" },
  { v: 5, l: "5 — Nacional, importação até 40%" },
  { v: 6, l: "6 — Estrangeira sem similar nacional (importação direta)" },
  { v: 7, l: "7 — Estrangeira sem similar nacional (mercado interno)" },
  { v: 8, l: "8 — Nacional, importação acima de 70%" },
];

const UNIDADES = ["UN", "KIT", "CX", "PC", "PAR", "ML", "L", "G", "KG"];

export default function ProductForm({ product, categories }: { product: Product; categories: Cat[] }) {
  const novo = !product;
  const fragAtual = product?.fragrance ?? "";
  const fragList = fragAtual && !FRAGRANCES_ADMIN.includes(fragAtual as any)
    ? [fragAtual, ...FRAGRANCES_ADMIN]
    : [...FRAGRANCES_ADMIN];
  return (
    <form action={saveProduct} className="stack">
      <input type="hidden" name="id" value={product?.id ?? "novo"} />
      <input type="hidden" name="current_image_url" value={product?.image_url ?? ""} />

      <div className="card stack">
        <div className="img-edit">
          {product?.image_url
            ? <img src={product.image_url} alt="" />
            : <div className="img-ph">sem foto</div>}
          <div className="field" style={{ flex: 1 }}>
            <label>Foto do produto</label>
            <input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/avif" />
            <small style={{ color: "var(--muted)" }}>PNG, JPG ou WebP até 5MB. A imagem fica guardada no Supabase Storage.</small>
          </div>
        </div>

        <div className="form-grid">
          <div className="field full">
            <label>Nome</label>
            <input name="name" defaultValue={product?.name ?? ""} required />
          </div>
          <div className="field">
            <label>Categoria</label>
            <select name="category_id" defaultValue={product?.category_id ?? ""}>
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Slug (link). Deixe vazio para gerar do nome.</label>
            <input name="slug" defaultValue={product?.slug ?? ""} placeholder="gerado-automaticamente" />
          </div>
          <div className="field">
            <label>Fragrância (menu oficial do site)</label>
            <select name="fragrance" defaultValue={fragAtual}>
              <option value="">Sem fragrância</option>
              {fragList.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Estoque</label>
            <input name="stock_qty" type="number" min="0" defaultValue={product?.stock_qty ?? 0} />
          </div>
          <div className="field">
            <label>Alerta de estoque baixo</label>
            <input name="low_stock_threshold" type="number" min="0" defaultValue={product?.low_stock_threshold ?? 10} />
          </div>
          <div className="field full">
            <label>Descrição</label>
            <textarea name="description" defaultValue={product?.description ?? ""} />
          </div>
          <div className="field field-check">
            <input id="is_wholesale" name="is_wholesale" type="checkbox" defaultChecked={product?.is_wholesale ?? false} />
            <label htmlFor="is_wholesale" style={{ color: "var(--ink)" }}>Venda em volume / corporativo (fica fora da aba &quot;Todos&quot; da loja)</label>
          </div>
          <div className="field full field-check">
            <input id="active" name="active" type="checkbox" defaultChecked={product?.active ?? true} />
            <label htmlFor="active" style={{ color: "var(--ink)" }}>Produto ativo (visível na loja)</label>
          </div>
        </div>
      </div>

      <div className="card stack">
        <div><span className="eyebrow">Preços</span></div>
        <div className="form-grid">
          <div className="field">
            <label>Preço de venda (R$)</label>
            <input name="price" defaultValue={reais(product?.price_cents ?? null)} placeholder="0,00" required />
          </div>
          <div className="field">
            <label>Preço &quot;de&quot; (riscado — ativa a aba Ofertas)</label>
            <input name="compare_at" defaultValue={reais(product?.compare_at_cents ?? null)} placeholder="0,00" />
          </div>
          <div className="field">
            <label>Preço de custo (R$) — para cálculo de margem</label>
            <input name="cost" defaultValue={reais(product?.cost_cents ?? null)} placeholder="0,00" />
          </div>
        </div>
      </div>

      <div className="card stack">
        <div>
          <span className="eyebrow">Fiscal (nota fiscal / NF-e)</span>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Preencha conforme o regime da empresa: no Simples Nacional use o CSOSN; no regime normal use o CST de ICMS. Todos os campos são opcionais e ficam guardados para a emissão de notas.
          </p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>SKU (código interno)</label>
            <input name="sku" defaultValue={product?.sku ?? ""} placeholder="Ex: VELA-FEL-145" />
          </div>
          <div className="field">
            <label>EAN / GTIN (código de barras)</label>
            <input name="gtin" defaultValue={product?.gtin ?? ""} placeholder="Ex: 7891234567890 ou SEM GTIN" />
          </div>
          <div className="field">
            <label>NCM</label>
            <input name="ncm" defaultValue={product?.ncm ?? ""} placeholder="Ex: 3406.00.00 (velas)" />
          </div>
          <div className="field">
            <label>CEST (se houver ST)</label>
            <input name="cest" defaultValue={product?.cest ?? ""} placeholder="Ex: 28.038.00" />
          </div>
          <div className="field">
            <label>CFOP padrão de venda</label>
            <input name="cfop" defaultValue={product?.cfop ?? ""} placeholder="Ex: 5102 (dentro do estado) / 6102" />
          </div>
          <div className="field">
            <label>Origem da mercadoria</label>
            <select name="origem" defaultValue={String(product?.origem ?? 0)}>
              {ORIGENS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="field">
            <label>CSOSN (Simples Nacional)</label>
            <input name="csosn" defaultValue={product?.csosn ?? ""} placeholder="Ex: 102" />
          </div>
          <div className="field">
            <label>CST de ICMS (regime normal)</label>
            <input name="cst_icms" defaultValue={product?.cst_icms ?? ""} placeholder="Ex: 00" />
          </div>
          <div className="field">
            <label>Alíquota ICMS (%)</label>
            <input name="aliq_icms" defaultValue={product?.aliq_icms ?? ""} placeholder="Ex: 18" />
          </div>
          <div className="field">
            <label>Alíquota PIS (%)</label>
            <input name="aliq_pis" defaultValue={product?.aliq_pis ?? ""} placeholder="Ex: 0,65" />
          </div>
          <div className="field">
            <label>Alíquota COFINS (%)</label>
            <input name="aliq_cofins" defaultValue={product?.aliq_cofins ?? ""} placeholder="Ex: 3" />
          </div>
          <div className="field">
            <label>Unidade comercial</label>
            <select name="unidade" defaultValue={product?.unidade ?? "UN"}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card stack">
        <div>
          <span className="eyebrow">Logística (frete)</span>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Peso e dimensões da embalagem. Serão usados no cálculo automático de frete quando a integração de envio for ativada.
          </p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Peso (gramas)</label>
            <input name="peso_gramas" type="number" min="0" defaultValue={product?.peso_gramas ?? ""} placeholder="Ex: 350" />
          </div>
          <div className="field">
            <label>Altura (cm)</label>
            <input name="altura_cm" defaultValue={product?.altura_cm ?? ""} placeholder="Ex: 10" />
          </div>
          <div className="field">
            <label>Largura (cm)</label>
            <input name="largura_cm" defaultValue={product?.largura_cm ?? ""} placeholder="Ex: 8" />
          </div>
          <div className="field">
            <label>Profundidade (cm)</label>
            <input name="profundidade_cm" defaultValue={product?.profundidade_cm ?? ""} placeholder="Ex: 8" />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="adm-btn">{novo ? "Criar produto" : "Salvar alterações"}</button>
        <Link href="/admin/produtos" className="adm-btn ghost">Cancelar</Link>
      </div>
    </form>
  );
}
