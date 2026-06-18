"use client";

import Link from "next/link";
import { saveProduct } from "@/app/admin/produtos/actions";

type Cat = { id: string; name: string };
type Product = {
  id: string; name: string; slug: string; price_cents: number;
  compare_at_cents: number | null; stock_qty: number; low_stock_threshold: number;
  description: string | null; active: boolean; image_url: string | null;
  category_id: string | null;
} | null;

const reais = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

export default function ProductForm({ product, categories }: { product: Product; categories: Cat[] }) {
  const novo = !product;
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
            <label>Preço (R$)</label>
            <input name="price" defaultValue={reais(product?.price_cents ?? null)} placeholder="0,00" required />
          </div>
          <div className="field">
            <label>Preço &quot;de&quot; (opcional)</label>
            <input name="compare_at" defaultValue={reais(product?.compare_at_cents ?? null)} placeholder="0,00" />
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
          <div className="field full field-check">
            <input id="active" name="active" type="checkbox" defaultChecked={product?.active ?? true} />
            <label htmlFor="active" style={{ color: "var(--ink)" }}>Produto ativo (visível na loja)</label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="adm-btn">{novo ? "Criar produto" : "Salvar alterações"}</button>
          <Link href="/admin/produtos" className="adm-btn ghost">Cancelar</Link>
        </div>
      </div>
    </form>
  );
}
