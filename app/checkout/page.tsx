"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Plus, Store, MapPin, Check } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { readCart, writeCart, clearCart, CartLine } from "@/lib/cart";
import { track } from "@/lib/track";
import { placeOrder } from "./actions";
import AccountMenu from "@/components/AccountMenu";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

type Prod = { id: string; n: string; c: string; p: number; s: number; img: string | null };
type Addr = { id: string; label: string | null; cep: string | null; street: string | null; number: string | null; complement: string | null; district: string | null; city: string | null; uf: string | null; is_default: boolean };

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [user, setUser] = useState<any>(undefined);
  const [products, setProducts] = useState<Prod[]>([]);
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [a, setA] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", uf: "", phone: "" });
  const [method, setMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCart(readCart());
    supabaseBrowser().auth.getUser().then(({ data }) => setUser(data.user ?? null));
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products || [])).catch(() => {});
    fetch("/api/addresses").then((r) => r.json()).then((d) => {
      const list: Addr[] = d.addresses || [];
      setAddresses(list);
      if (d.phone) setA((s) => ({ ...s, phone: s.phone || d.phone }));
      setSelectedId(list.length ? (list.find((x) => x.is_default)?.id || list[0].id) : "new");
    }).catch(() => setSelectedId("new"));
  }, []);

  const unit = (i: CartLine) => (i.deal ? Math.round(i.p * 0.95) : i.p);
  const total = cart.reduce((s, i) => s + unit(i) * i.qty, 0);
  const inCart = new Set(cart.map((c) => c.id));
  const suggestions = products.filter((p) => !inCart.has(p.id) && p.s > 0).slice(0, 3);

  const addSuggestion = (p: Prod) => {
    const nc = [...cart];
    const i = nc.findIndex((c) => c.id === p.id);
    if (i >= 0) nc[i].qty += 1;
    else nc.push({ id: p.id, n: p.n, p: p.p, img: p.img ?? null, qty: 1, deal: true });
    setCart(nc); writeCart(nc);
    track("add_to_cart_deal", { productId: p.id, label: p.n, valueCents: Math.round(p.p * 0.95), cart: nc });
  };

  const buscarCep = async (cep: string) => {
    const c = cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const d = await r.json();
      if (!d.erro) setA((s) => ({ ...s, street: d.logradouro || s.street, district: d.bairro || s.district, city: d.localidade || s.city, uf: d.uf || s.uf }));
    } catch { /* ignore */ }
  };

  const addrSummary = (x: Addr) => `${x.street || ""}${x.number ? ", " + x.number : ""}${x.district ? " — " + x.district : ""}${x.city ? ", " + x.city : ""}${x.uf ? "/" + x.uf : ""}`;

  const confirmar = async () => {
    setErro(null); setLoading(true);
    const addr = (selectedId && selectedId !== "new")
      ? { id: selectedId, cep: "", street: "", number: "", complement: "", district: "", city: "", uf: "", phone: a.phone }
      : { ...a, label };
    const res = await placeOrder(cart.map((c) => ({ id: c.id, qty: c.qty, deal: c.deal })), addr, method);
    setLoading(false);
    if (res.ok && res.orderId) {
      track("purchase", { valueCents: total, cart, meta: { orderId: res.orderId } });
      clearCart();
      router.push(`/conta/pedidos/${res.orderId}?novo=1`);
    } else setErro(res.error || "Não foi possível finalizar.");
  };

  const showForm = selectedId === "new" || (user && addresses.length === 0);

  const Resumo = (
    <div className="card stack checkout-sum">
      <h3 className="card-title">Resumo</h3>
      {cart.map((i) => (
        <div className="sum-row" key={i.id}><span>{i.qty}x {i.n}{i.deal ? " (-5%)" : ""}</span><span>{brl(unit(i) * i.qty)}</span></div>
      ))}
      <div className="sum-row total"><strong>Total</strong><strong>{brl(total)}</strong></div>
      {suggestions.length > 0 && (
        <div className="xsell" style={{ borderTop: "1px solid var(--line)", paddingLeft: 0, paddingRight: 0 }}>
          <div className="xsell-head">Leve também <span>5% OFF</span></div>
          {suggestions.map((s) => (
            <div className="xsell-item" key={s.id}>
              <div className={`xsell-art ${s.img ? "has-img" : ""}`}>{s.img && <img src={s.img} alt={s.n} />}</div>
              <div className="xsell-info"><span className="xsell-name">{s.n}</span><span className="xsell-price"><s>{brl(s.p)}</s> por <strong>{brl(Math.round(s.p * 0.95))}</strong></span></div>
              <button className="xsell-add" onClick={() => addSuggestion(s)} aria-label="Adicionar"><Plus size={15} /></button>
            </div>
          ))}
        </div>
      )}
      {erro && <div className="auth-erro">{erro}</div>}
      {user ? (
        <button className="btn full" onClick={confirmar} disabled={loading}>{loading ? "Registrando…" : "Confirmar pedido"}</button>
      ) : (
        <Link href="/entrar?next=/checkout" className="btn full" style={{ textDecoration: "none", textAlign: "center" }}>Entrar para finalizar</Link>
      )}
      <Link href="/" className="btn ghost full" style={{ textDecoration: "none", textAlign: "center" }}><Store size={15} /> Continuar comprando</Link>
      <a className="checkout-wa-link" href={`https://wa.me/5581999089912?text=${encodeURIComponent("Olá! Quero finalizar meu pedido na Essentiale.")}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} /> Finalizar ou tirar dúvida no WhatsApp</a>
    </div>
  );

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
        ) : (
          <div className="checkout-grid">
            <div className="stack">
              {user === undefined ? (
                <div className="card"><p className="cell-muted">Carregando…</p></div>
              ) : !user ? (
                <div className="card stack">
                  <h3 className="card-title">Entre para finalizar</h3>
                  <p className="cell-muted">Crie sua conta em segundos ou entre para acompanhar seu pedido, ver o histórico, salvar endereços e comprar mais rápido da próxima vez.</p>
                  <Link href="/entrar?next=/checkout" className="btn full" style={{ textDecoration: "none", textAlign: "center" }}>Entrar ou criar conta</Link>
                </div>
              ) : (
                <>
                  <div className="card stack">
                    <h3 className="card-title">Endereço de entrega</h3>

                    {addresses.length > 0 && (
                      <div className="addr-list">
                        {addresses.map((x) => (
                          <button type="button" key={x.id} className={`addr-card ${selectedId === x.id ? "on" : ""}`} onClick={() => setSelectedId(x.id)}>
                            <span className="addr-check">{selectedId === x.id && <Check size={13} />}</span>
                            <span className="addr-body">
                              <strong>{x.label || "Endereço"}{x.is_default ? " · padrão" : ""}</strong>
                              <span className="cell-muted">{addrSummary(x)}</span>
                            </span>
                          </button>
                        ))}
                        <button type="button" className={`addr-card add ${selectedId === "new" ? "on" : ""}`} onClick={() => setSelectedId("new")}>
                          <span className="addr-check"><Plus size={13} /></span>
                          <span className="addr-body"><strong>Adicionar outro endereço</strong><span className="cell-muted">Entregar em um novo lugar</span></span>
                        </button>
                      </div>
                    )}

                    {showForm && (
                      <div className="stack" style={{ marginTop: addresses.length ? 8 : 0 }}>
                        <div className="field"><label>Nome deste endereço (ex: Casa, Trabalho)</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Casa" /></div>
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
                    )}
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
                </>
              )}
            </div>
            {Resumo}
          </div>
        )}
      </div>
    </div>
  );
}
