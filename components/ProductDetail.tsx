import Link from "next/link";
import { ArrowLeft, MessageCircle, Truck, ShieldCheck, Heart, Quote } from "lucide-react";
import { waLink, occasionsFor, testimonialsFor } from "@/lib/merch";
import AccountMenu from "@/components/AccountMenu";

type P = {
  id: string; name: string; slug: string; price_cents: number; stock_qty: number;
  image_url: string | null; description: string | null; category: { name: string } | null;
};

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const parcela = (p: number) => p >= 6000 ? `ou 3x de ${brl(p / 3)} sem juros` : p >= 3000 ? `ou 2x de ${brl(p / 2)} sem juros` : "à vista no Pix";

export default function ProductDetail({ p }: { p: P }) {
  const out = p.stock_qty === 0;
  const cat = p.category?.name ?? "Essentiale";
  const occasions = occasionsFor({ name: p.name, category: cat });
  const depos = testimonialsFor({ name: p.name, id: p.id });
  const wa = waLink(p.name);

  return (
    <div className="store">
      <div className="announce">Enviamos para todo o Brasil · Parcele em até 3x sem juros · Use <strong>CUPOM10</strong> e ganhe 10% na primeira compra</div>

      <header className="hdr">
        <Link href="/" className="logo-link" aria-label="Início"><img src="/logo.png" alt="Essentiale Fragrance" className="logo-img" /></Link>
        <div className="hdr-icons" style={{ marginLeft: "auto" }}>
          <AccountMenu />
          <a className="icon-btn" href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={19} /></a>
        </div>
      </header>

      <div className="pdp">
        <Link href="/" className="pdp-back"><ArrowLeft size={15} /> Voltar à loja</Link>

        <div className="pdp-grid">
          <div className={`pdp-art ${p.image_url ? "has-img" : ""}`}>
            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="pdp-ph" />}
            {out && <span className="tag-out">Esgotado</span>}
          </div>

          <div className="pdp-info">
            <span className="eyebrow">{cat}</span>
            <h1>{p.name}</h1>
            <div className="pdp-price">{brl(p.price_cents)}</div>
            <div className="pdp-parcela">{parcela(p.price_cents)}</div>
            {p.description && <p className="pdp-desc">{p.description}</p>}

            <a className="btn wa-btn" href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} /> Tirar dúvida no WhatsApp
            </a>
            <span className="pdp-hint">Resposta rápida, de segunda a sexta, das 9h às 18h.</span>

            <div className="pdp-occ">
              <span className="eyebrow">Ideal para presentear em</span>
              <div className="occ-tags">
                {occasions.map((o) => <span className="occ-tag" key={o}><Heart size={12} /> {o}</span>)}
              </div>
            </div>

            <div className="pdp-trust">
              <span><Truck size={15} /> Frete para todo o Brasil</span>
              <span><ShieldCheck size={15} /> Compra segura</span>
            </div>
          </div>
        </div>

        <section className="depos">
          <div className="depos-head">
            <span className="eyebrow">Quem viveu essa experiência</span>
            <h2>Histórias de quem levou a Essentiale</h2>
          </div>
          <div className="depos-grid">
            {depos.map((d, i) => (
              <figure className="depo" key={i}>
                <Quote size={20} className="depo-q" />
                <blockquote>{d.texto}</blockquote>
                <figcaption><strong>{d.nome}</strong><span>{d.contexto}</span></figcaption>
              </figure>
            ))}
          </div>
          <p className="depos-note">Depoimentos ilustrativos — serão substituídos pelas avaliações reais das clientes.</p>
        </section>
      </div>

      <footer className="ftr">
        <div className="ftr-cols">
          <div className="ftr-brand">
            <img src="/logo.png" alt="Essentiale" className="ftr-logo" />
            <p>Recife · PE</p>
          </div>
          <div className="ftr-col"><h4>Atendimento</h4><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp (81) 99908-9912</a><a href="/">Voltar à loja</a></div>
          <div className="ftr-col"><h4>Institucional</h4><a href="#">Sobre nós</a><a href="#">Trocas e devoluções</a></div>
        </div>
        <div className="ftr-base">Essentiale Ind. e Com. Ltda · CNPJ 51.550.281/0001-97 · {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
