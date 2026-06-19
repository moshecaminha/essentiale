"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { waLink, WHATSAPP } from "@/lib/merch";
import {
  Search, ShoppingBag, Menu, X, Plus, Minus,
  Truck, ShieldCheck, Heart, Instagram, MessageCircle, ChevronRight,
} from "lucide-react";

type Product = { id: string; n: string; slug: string; c: string; p: number; s: number; img?: string | null; d?: string | null };

const CATS = ["Todos", "Velas Aromáticas", "Difusores", "Home Sprays", "Sabonetes", "Essências", "Afetos & Cartões", "Bem-estar", "Kits & Atacado"];
const NAV = ["Velas Aromáticas", "Difusores", "Home Sprays", "Afetos & Cartões", "Kits & Atacado"];

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const parcela = (p: number) => p >= 6000 ? `ou 3x de ${brl(p / 3)} sem juros` : p >= 3000 ? `ou 2x de ${brl(p / 2)} sem juros` : "à vista no Pix";

function Motif({ cat }: { cat: string }) {
  const s = { stroke: "#5E7357", strokeWidth: 1.4, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const c = { width: "100%", height: "100%", viewBox: "0 0 120 120", style: { opacity: 0.9 } };
  if (cat === "Difusores") return <svg {...c}><path {...s} d="M48 78h24l-3 14a5 5 0 0 1-5 4h-8a5 5 0 0 1-5-4z" /><path {...s} d="M54 78v-6h12v6" /><path {...s} d="M58 72c0-22-10-30-10-44M60 72c0-26 0-34 0-46M62 72c0-22 10-30 10-44" /></svg>;
  if (cat === "Home Sprays") return <svg {...c}><rect {...s} x="50" y="58" width="20" height="36" rx="4" /><path {...s} d="M54 58v-8h12v8" /><path {...s} d="M66 50h8v-8h-8z" /><path {...s} d="M82 40h2M86 36h2M84 46h2M88 42h2M82 50h2" /></svg>;
  if (cat === "Sabonetes") return <svg {...c}><rect {...s} x="42" y="58" width="36" height="26" rx="8" /><path {...s} d="M54 50a6 6 0 1 1 12 0M62 44a5 5 0 1 1 10 0" /></svg>;
  if (cat === "Essências") return <svg {...c}><path {...s} d="M60 36c8 14 14 20 14 30a14 14 0 0 1-28 0c0-10 6-16 14-30z" /></svg>;
  if (cat === "Afetos & Cartões") return <svg {...c}><path {...s} d="M60 86s-22-13-22-29a12 12 0 0 1 22-7 12 12 0 0 1 22 7c0 16-22 29-22 29z" /></svg>;
  if (cat === "Bem-estar") return <svg {...c}><path {...s} d="M60 90c0-26 8-44 28-52-2 24-12 42-28 52z" /><path {...s} d="M60 90C44 80 36 62 34 40c14 6 22 18 26 34" /></svg>;
  if (cat === "Kits & Atacado") return <svg {...c}><path {...s} d="M40 54l20-10 20 10-20 10z" /><path {...s} d="M40 54v22l20 10 20-10V54" /><path {...s} d="M60 64v22" /></svg>;
  return <svg {...c}><rect {...s} x="48" y="56" width="24" height="38" rx="3" /><path {...s} d="M60 56v-8" /><path {...s} d="M60 48c0-6-5-7-5-12 0 0 5 2 5 8 0-6 5-8 5-8 0 5-5 6-5 12z" /></svg>;
}

export default function Storefront({ products }: { products: Product[] }) {
  const [cat, setCat] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    let r = cat === "Todos" ? products : products.filter((p) => p.c === cat);
    const term = query.trim().toLowerCase();
    if (term) r = r.filter((p) => p.n.toLowerCase().includes(term));
    return r;
  }, [cat, query, products]);
  const [deals, setDeals] = useState<Record<string, boolean>>({});
  const add = (p: Product) => { setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })); setCartOpen(true); };
  const inc = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: string) => setCart((c) => { const q = (c[id] || 0) - 1; const n = { ...c }; if (q <= 0) { delete n[id]; setDeals((d) => { const nd = { ...d }; delete nd[id]; return nd; }); } else n[id] = q; return n; });
  const addDeal = (p: Product) => { setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })); setDeals((d) => ({ ...d, [p.id]: true })); };

  const items = Object.entries(cart).map(([id, q]) => ({ ...products.find((p) => p.id === id)!, q }));
  const count = items.reduce((s, i) => s + i.q, 0);
  const subtotal = items.reduce((s, i) => s + i.p * i.q, 0);
  const discount = items.reduce((s, i) => s + (deals[i.id] ? i.p * i.q * 0.05 : 0), 0);
  const total = subtotal - discount;

  // Sugestões de cross-sell: produtos mais baratos ainda não no carrinho
  const suggestions = useMemo(() => {
    const inCart = new Set(Object.keys(cart));
    return products.filter((p) => !inCart.has(p.id) && p.s > 0).sort((a, b) => a.p - b.p).slice(0, 3);
  }, [cart, products]);

  const goCat = (c: string) => { setCat(c); document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }); };

  const checkout = () => {
    if (items.length === 0) return;
    const lines = items.map((i) => {
      const unit = deals[i.id] ? i.p * 0.95 : i.p;
      return `• ${i.q}x ${i.n} — ${brl(unit * i.q)}`;
    }).join("\n");
    let msg = `Olá! Quero finalizar meu pedido na Essentiale:\n\n${lines}\n\nTotal: ${brl(total)}`;
    if (discount > 0) msg += `\n(já com desconto combinado de ${brl(discount)})`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="store">
      <div className="announce">Enviamos para todo o Brasil · Parcele em até 3x sem juros · Use <strong>CUPOM10</strong> e ganhe 10% na primeira compra</div>

      <header className="hdr">
        <button className="icon-btn only-mobile" onClick={() => setCartOpen(true)} aria-label="menu"><Menu size={20} /></button>
        <img src="/logo.png" alt="Essentiale Fragrance" className="logo-img" />
        <nav className="nav-main">
          {NAV.map((x) => <button key={x} className={`navlink ${cat === x ? "on" : ""}`} onClick={() => goCat(x)}>{x}</button>)}
        </nav>
        <div className="hdr-icons">
          <button className="icon-btn" aria-label="buscar" onClick={() => { document.getElementById("busca")?.focus(); document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }); }}><Search size={19} /></button>
          <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="carrinho">
            <ShoppingBag size={19} />{count > 0 && <span className="cart-count">{count}</span>}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">Marca própria · feito à mão em Recife</span>
          <h1>Aromas que transformam<br />o seu dia em memória.</h1>
          <p>Velas, difusores e home sprays de fragrância autoral, com design minimalista e a sensação de cuidado em cada detalhe.</p>
          <div className="hero-cta">
            <button className="btn" onClick={() => goCat("Velas Aromáticas")}>Ver coleção</button>
            <button className="btn ghost" onClick={() => goCat("Afetos & Cartões")}>Presentear <ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-card c1"><Motif cat="Velas Aromáticas" /></div>
          <div className="hero-card c2"><Motif cat="Difusores" /></div>
          <div className="hero-card c3"><Motif cat="Home Sprays" /></div>
          <div className="hero-card c4"><Motif cat="Afetos & Cartões" /></div>
        </div>
      </section>

      <div className="strip">
        <span><Truck size={16} /> Frete para todo o Brasil</span>
        <span><ShieldCheck size={16} /> Compra segura · Pix, cartão e boleto</span>
        <span><Heart size={16} /> Produção artesanal</span>
      </div>

      <main className="shop" id="catalogo">
        <div className="shop-head">
          <div><span className="eyebrow">Nossa loja</span><h2>Escolha o seu aroma</h2></div>
          <span className="count-note">{list.length} produtos</span>
        </div>
        <div className="searchbar">
          <Search size={16} />
          <input id="busca" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto pelo nome..." />
          {query && <button className="search-clear" onClick={() => setQuery("")} aria-label="limpar"><X size={15} /></button>}
        </div>
        <div className="cats">
          {CATS.map((x) => <button key={x} className={`cat ${cat === x ? "on" : ""}`} onClick={() => setCat(x)}>{x}</button>)}
        </div>
        <div className="grid">
          {list.map((p) => {
            const out = p.s === 0;
            return (
              <article className={`pcard ${out ? "out" : ""}`} key={p.id}>
                <a className="wa-fab" href={waLink(p.n)} target="_blank" rel="noopener noreferrer" title="Tirar dúvida no WhatsApp" aria-label="Tirar dúvida no WhatsApp">
                  <MessageCircle size={16} />
                </a>
                <Link href={`/produto/${p.slug}`} className="pcard-link">
                  <div className={`pcard-art ${p.img ? "has-img" : ""}`}>
                    {p.img ? <img src={p.img} alt={p.n} loading="lazy" /> : <Motif cat={p.c} />}
                    {out && <span className="tag-out">Esgotado</span>}
                  </div>
                  <div className="pcard-body">
                    <span className="pcard-cat">{p.c}</span>
                    <h3>{p.n}</h3>
                    {p.d && <p className="pcard-desc">{p.d}</p>}
                  </div>
                </Link>
                <div className="pcard-foot">
                  <div>
                    <div className="price">{brl(p.p)}</div>
                    <div className="parcela">{parcela(p.p)}</div>
                  </div>
                  <button className="btn add" disabled={out} onClick={() => add(p)}>{out ? "Indisponível" : <>Adicionar <Plus size={15} /></>}</button>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <section className="story">
        <div className="story-inner">
          <span className="eyebrow light">Quem somos</span>
          <p className="story-line">Uma marca de produtos de luxo que inspiram, decoram e cuidam de você — design moderno e minimalista, feito à mão, para criar momentos inesquecíveis.</p>
        </div>
      </section>

      <footer className="ftr">
        <div className="ftr-cols">
          <div className="ftr-brand">
            <img src="/logo.png" alt="Essentiale" className="ftr-logo" />
            <p>Recife · PE</p>
            <div className="socials">
              <a href="https://instagram.com/essentialefragrance" target="_blank" rel="noopener noreferrer" className="icon-btn"><Instagram size={18} /></a>
              <a href={waLink("Atendimento")} target="_blank" rel="noopener noreferrer" className="icon-btn"><MessageCircle size={18} /></a>
            </div>
          </div>
          <div className="ftr-col"><h4>Institucional</h4><Link href="/institucional#sobre">Sobre nós</Link><Link href="/institucional#contato">Fale conosco</Link><Link href="/institucional#faq">Perguntas frequentes</Link></div>
          <div className="ftr-col"><h4>Ajuda</h4><Link href="/institucional#trocas">Trocas e devoluções</Link><Link href="/institucional#entrega">Entrega e frete</Link><Link href="/institucional#pagamento">Formas de pagamento</Link></div>
          <div className="ftr-col"><h4>Atendimento</h4><a href={waLink("Atendimento")} target="_blank" rel="noopener noreferrer">WhatsApp (81) 99908-9912</a><span>Showroom em Recife/PE</span><span>Seg a sex, 9h às 18h</span></div>
        </div>
        <div className="ftr-base">Essentiale Ind. e Com. Ltda · CNPJ 51.550.281/0001-97 · {new Date().getFullYear()}</div>
      </footer>

      {cartOpen && <div className="overlay show" onClick={() => setCartOpen(false)} />}
      <aside className={`drawer ${cartOpen ? "open" : ""}`}>
        <div className="drawer-head"><h3>Seu carrinho</h3><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="fechar"><X size={20} /></button></div>
        {items.length === 0 ? (
          <div className="drawer-empty"><ShoppingBag size={30} color="#8DA585" /><p>Seu carrinho está vazio.</p><button className="btn" onClick={() => setCartOpen(false)}>Continuar comprando</button></div>
        ) : (
          <>
            <div className="drawer-items">
              {items.map((i) => (
                <div className="ditem" key={i.id}>
                  <div className={`ditem-art ${i.img ? "has-img" : ""}`}>{i.img ? <img src={i.img} alt={i.n} /> : <Motif cat={i.c} />}</div>
                  <div className="ditem-info">
                    <span className="ditem-name">{i.n}</span>
                    <span className="ditem-price">{brl(i.p)}</span>
                    <div className="qty"><button onClick={() => dec(i.id)}><Minus size={13} /></button><span>{i.q}</span><button onClick={() => inc(i.id)}><Plus size={13} /></button></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="xsell">
              <div className="xsell-head">Aproveite e combine <span>5% OFF</span></div>
              {suggestions.map((s) => (
                <div className="xsell-item" key={s.id}>
                  <div className={`xsell-art ${s.img ? "has-img" : ""}`}>{s.img ? <img src={s.img} alt={s.n} /> : <Motif cat={s.c} />}</div>
                  <div className="xsell-info">
                    <span className="xsell-name">{s.n}</span>
                    <span className="xsell-price"><s>{brl(s.p)}</s> por <strong>{brl(s.p * 0.95)}</strong></span>
                  </div>
                  <button className="xsell-add" onClick={() => addDeal(s)} aria-label="Adicionar com desconto"><Plus size={15} /></button>
                </div>
              ))}
            </div>
            <div className="drawer-foot">
              <div className="ship-note"><Truck size={14} /> Calcule o frete no checkout</div>
              <div className="sum-line"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
              {discount > 0 && <div className="sum-line disc"><span>Desconto combinado (5%)</span><span>- {brl(discount)}</span></div>}
              <div className="subtotal"><span>Total</span><strong>{brl(total)}</strong></div>
              <button className="btn full" onClick={checkout}>Finalizar pelo WhatsApp</button>
              <span className="coupon">Cupom CUPOM10 aplicável na primeira compra</span>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
