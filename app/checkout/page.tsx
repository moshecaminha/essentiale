"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { readCart, clearCart, CartLine } from "@/lib/cart";
import { placeOrder } from "./actions";
import AccountMenu from "@/components/AccountMenu";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [user, setUser] = useState<any>(undefined); // undefined = carregando
  const [a, setA] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", uf: "", phone: "" });
  const [method, setMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCart(readCart());
    supabaseBrowser().auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  const total = cart.reduce((s, i) => s + (i.deal ? Math.round(i.p * 0.95) : i.p) * i.qty, 0);

  const buscarCep = async (cep: string) => {
    const c = cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const d = await r.json();
      if (!d.erro) setA((s) => ({ ...s, street: d.logradouro || s.street, district: d.bairro || s.district, city: d.localidade || s.city, uf: d.uf || s.uf }));
    } catch { /* ignore */ }
  };

  const confirmar = async () => {
    setErro(null); setLoading(true);
    const res = await placeOrder(cart.map((c) => ({ id: c.id, qty: c.qty, deal: c.deal })), a, method);
    setLoading(false);
    if (res.ok && res.orderId) { clearCart(); router.push(`/conta/pedidos/${res.orderId}?novo=1`); }
    else setErro(res.error || "Não foi possível finalizar.");
  };

  return (
    <div className="store">
      <header className="hdr">
        <Link href="/" className="logo-link"><img src="/logo.png" alt="Essentiale" className="logo-img" /></Link>
        <div className="hdr-icons" style={{ marginLeft: "auto" }}><AccountMenu /></div>
      </header>

      <div className="checkout">
        <h1>Finalizar compra</h1>

        {cart.length === 0 ? (
          <div className="empty"><div className="eyebrow">Carrinho vazio</div><p>Adicione produtos antes de finalizar.</p><Link href="/" className="btn">Ver a loja</Link></div>
        ) : user === undefined ? (
          <p className="cell-muted">Carregando…</p>
        ) : !user ? (
          <div className="card stack" style={{ maxWidth: 460 }}>
            <h3 className="card-title">Entre para finalizar</h3>
            <p className="cell-muted">Crie sua conta em segundos ou entre para acompanhar seu pedido, ver o histórico e receber atualizações.</p>
            <Link href="/entrar?next=/checkout" className="btn full" style={{ textDecoration: "none" }}>Entrar ou criar conta</Link>
          </div>
        ) : (
          <div className="checkout-grid">
            <div className="stack">
              <div className="card stack">
                <h3 className="card-title">Endereço de entrega</h3>
                <div className="form-grid">
                  <div className="field"><label>CEP</label><input value={a.cep} onChange={(e) => setA({ ...a, cep: e.target.value })} onBlur={(e) => buscarCep(e.target.value)} placeholder="00000-000" /></div>
                  <div className="field"><label>WhatsApp</label><input value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} placeholder="81 99999-9999" /></div>
                  <div className="field full"><label>Rua</label><input value={a.street} onChange={(e) => setA({ ...a, street: e.target.value })} /></div>
                  <div className="field"><label>Número</label><input value={a.number} onChange={(e) => setA({ ...a, number: e.target.value })} /></div>
                  <div className="field"><label>Complemento</label><input value={a.complement} onChange={(e) => setA({ ...a, complement: e.target.value })} /></div>
                  <div className="field"><label>Bairro</label><input value={a.district} onChange={(e) => setA({ ...a, district: e.target.value })} /></div>
                  <div className="field"><label>Cidade</label><input value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} /></div>
                  <div className="field"><label>UF</label><input value={a.uf} maxLength={2} onChange={(e) => setA({ ...a, uf: e.target.value })} /></div>
                </div>
              </div>
              <div className="card stack">
                <h3 className="card-title">Pagamento</h3>
                <div className="field"><label>Forma de pagamento</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="pix">Pix</option><option value="cartao_credito">Cartão de crédito</option><option value="boleto">Boleto</option>
                  </select>
                </div>
                <p className="cell-muted" style={{ fontSize: 12.5 }}>Você receberá as instruções de pagamento por e-mail e WhatsApp. O pedido é confirmado assim que o pagamento for identificado.</p>
              </div>
            </div>

            <div className="card stack checkout-sum">
              <h3 className="card-title">Resumo</h3>
              {cart.map((i) => (
                <div className="sum-row" key={i.id}>
                  <span>{i.qty}x {i.n}</span>
                  <span>{brl((i.deal ? Math.round(i.p * 0.95) : i.p) * i.qty)}</span>
                </div>
              ))}
              <div className="sum-row total"><strong>Total</strong><strong>{brl(total)}</strong></div>
              {erro && <div className="auth-erro">{erro}</div>}
              <button className="btn full" onClick={confirmar} disabled={loading}>
                {loading ? "Registrando…" : "Confirmar pedido"}
              </button>
              <a className="checkout-wa" href={`https://wa.me/5581999089912?text=${encodeURIComponent("Olá! Quero finalizar meu pedido na Essentiale.")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} /> Prefiro finalizar pelo WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
