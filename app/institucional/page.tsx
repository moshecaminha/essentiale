import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { waLink } from "@/lib/merch";
import AccountMenu from "@/components/AccountMenu";

export const dynamic = "force-static";
export const metadata = { title: "Institucional — Essentiale Fragrance" };

const wa = waLink("Atendimento");

const secoes = [
  {
    id: "sobre", t: "Sobre a Essentiale",
    p: ["A Essentiale Fragrance é uma marca autoral de fragrâncias para ambientes e bem-estar, feita à mão em Recife. Criamos velas, difusores, home sprays e sabonetes pensados para transformar momentos simples em memórias afetivas.", "Cada produto é desenvolvido com essências de alto padrão e acabamento artesanal, com um cuidado que começa no aroma e termina na embalagem."],
  },
  {
    id: "entrega", t: "Entrega e frete",
    p: ["Enviamos para todo o Brasil. O prazo e o valor do frete são calculados no fechamento do pedido, de acordo com o seu CEP.", "Após a confirmação do pagamento, o pedido é preparado com carinho e postado em até 2 dias úteis."],
  },
  {
    id: "trocas", t: "Trocas e devoluções",
    p: ["Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.", "Para iniciar, fale com a gente pelo WhatsApp com o número do pedido em mãos."],
  },
  {
    id: "pagamento", t: "Formas de pagamento",
    p: ["Aceitamos Pix, cartão de crédito (em até 3x sem juros) e boleto. Compra protegida e dados tratados com segurança."],
  },
  {
    id: "faq", t: "Perguntas frequentes",
    p: ["As velas são de cera vegetal e produção artesanal — pequenas variações fazem parte do feito à mão.", "Quer um aroma específico ou um presente personalizado para um evento ou empresa? Fale com a gente pelo WhatsApp que montamos junto."],
  },
];

export default function Institucional() {
  return (
    <div className="store">
      <div className="announce">Enviamos para todo o Brasil · Parcele em até 3x sem juros · Use <strong>CUPOM10</strong> e ganhe 10% na primeira compra</div>
      <header className="hdr">
        <Link href="/" className="logo-link"><img src="/logo.png" alt="Essentiale Fragrance" className="logo-img" /></Link>
        <div className="hdr-icons" style={{ marginLeft: "auto" }}>
          <AccountMenu />
          <a className="icon-btn" href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={19} /></a>
        </div>
      </header>

      <div className="inst">
        <Link href="/" className="pdp-back"><ArrowLeft size={15} /> Voltar à loja</Link>
        <h1>Institucional</h1>
        {secoes.map((s) => (
          <section className="inst-sec" id={s.id} key={s.id}>
            <h2>{s.t}</h2>
            {s.p.map((par, i) => <p key={i}>{par}</p>)}
          </section>
        ))}
        <section className="inst-sec" id="contato">
          <h2>Contato</h2>
          <p>Atendimento de segunda a sexta, das 9h às 18h.</p>
          <a className="btn wa-btn" href={wa} target="_blank" rel="noopener noreferrer" style={{ maxWidth: 320 }}><MessageCircle size={18} /> Falar no WhatsApp</a>
        </section>
      </div>

      <footer className="ftr">
        <div className="ftr-cols">
          <div className="ftr-brand">
            <img src="/logo.png" alt="Essentiale" className="ftr-logo" />
            <p>Recife · PE</p>
          </div>
          <div className="ftr-col"><h4>Institucional</h4><Link href="/institucional#sobre">Sobre nós</Link><Link href="/institucional#trocas">Trocas e devoluções</Link><Link href="/institucional#faq">Perguntas frequentes</Link></div>
          <div className="ftr-col"><h4>Atendimento</h4><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp (81) 99908-9912</a><Link href="/">Voltar à loja</Link></div>
        </div>
        <div className="ftr-base">Essentiale Ind. e Com. Ltda · CNPJ 51.550.281/0001-97 · {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
