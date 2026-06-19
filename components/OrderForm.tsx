"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { createOrder } from "@/app/admin/pedidos/actions";

type Prod = { id: string; name: string; price_cents: number };
type Line = { id: string; qty: number };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export default function OrderForm({ products }: { products: Prod[] }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [sel, setSel] = useState("");

  const pmap = new Map(products.map((p) => [p.id, p]));
  const addLine = () => { if (sel && !lines.find((l) => l.id === sel)) { setLines([...lines, { id: sel, qty: 1 }]); setSel(""); } };
  const setQty = (id: string, q: number) => setLines(lines.map((l) => l.id === id ? { ...l, qty: Math.max(1, q) } : l));
  const remove = (id: string) => setLines(lines.filter((l) => l.id !== id));
  const subtotal = lines.reduce((s, l) => s + (pmap.get(l.id)?.price_cents || 0) * l.qty, 0);

  return (
    <form action={createOrder} className="stack">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      <div className="card stack">
        <h3 className="card-title">Cliente</h3>
        <div className="form-grid">
          <div className="field"><label>Nome</label><input name="customer_name" required /></div>
          <div className="field"><label>WhatsApp (com DDD)</label><input name="customer_phone" placeholder="81 99999-9999" /></div>
          <div className="field"><label>Cidade</label><input name="customer_city" /></div>
          <div className="field"><label>UF</label><input name="customer_uf" maxLength={2} placeholder="PE" /></div>
        </div>
      </div>

      <div className="card stack">
        <h3 className="card-title">Itens do pedido</h3>
        <div className="order-add">
          <select value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Selecione um produto…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {brl(p.price_cents)}</option>)}
          </select>
          <button type="button" className="adm-btn" onClick={addLine}><Plus size={15} /> Adicionar</button>
        </div>

        {lines.length === 0 ? (
          <p className="cell-muted">Nenhum item adicionado ainda.</p>
        ) : (
          <div className="order-lines">
            {lines.map((l) => {
              const p = pmap.get(l.id)!;
              return (
                <div className="order-line" key={l.id}>
                  <span className="ol-name">{p.name}</span>
                  <span className="cell-muted">{brl(p.price_cents)}</span>
                  <input type="number" min={1} value={l.qty} onChange={(e) => setQty(l.id, parseInt(e.target.value) || 1)} className="ol-qty" />
                  <span className="cell-strong">{brl(p.price_cents * l.qty)}</span>
                  <button type="button" className="adm-btn danger sm" onClick={() => remove(l.id)}><Trash2 size={14} /></button>
                </div>
              );
            })}
            <div className="order-sub">Subtotal dos itens: <strong>{brl(subtotal)}</strong></div>
          </div>
        )}
      </div>

      <div className="card stack">
        <h3 className="card-title">Pagamento e frete</h3>
        <div className="form-grid">
          <div className="field"><label>Forma de pagamento</label>
            <select name="method"><option value="pix">Pix</option><option value="cartao_credito">Cartão de crédito</option><option value="boleto">Boleto</option><option value="outro">Outro</option></select>
          </div>
          <div className="field"><label>Situação do pagamento</label>
            <select name="payment_status"><option value="pendente">Pendente</option><option value="aprovado">Pago</option></select>
          </div>
          <div className="field"><label>Frete (R$)</label><input name="shipping" placeholder="0,00" /></div>
          <div className="field"><label>Desconto (R$)</label><input name="discount" placeholder="0,00" /></div>
        </div>
        <div className="form-actions">
          <button type="submit" className="adm-btn">Registrar pedido</button>
          <Link href="/admin/pedidos" className="adm-btn ghost">Cancelar</Link>
        </div>
      </div>
    </form>
  );
}
