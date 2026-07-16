// Motor de recomendação de cross-sell / upsell.
// Pontua candidatos por afinidade com o que o cliente está comprando ou vendo,
// em vez de sugerir itens aleatórios ou apenas os mais baratos.
//
// Sinais usados (em ordem de força):
//   1. Mesma fragrância de algum item do contexto (o cliente já demonstrou gostar do aroma)
//   2. Categoria complementar (vela combina com home spray/difusor; sabonete com home spray...)
//   3. Mesma categoria (colecionar variações)
//   4. Faixa de preço compatível com o ticket do contexto
//   5. Bônus para itens de "adição fácil" (mini vela, cartão) quando o carrinho já tem valor

export type RelatedItem = {
  id: string;
  n: string;             // nome
  c: string;             // categoria
  p: number;             // preço em centavos
  s: number;             // estoque
  fr?: string | null;    // fragrância
  img?: string | null;
  slug?: string;
};

// Categorias que se complementam (nomes oficiais do site)
const COMPLEMENT: Record<string, string[]> = {
  "Velas": ["Home Sprays", "Difusores", "Acessórios", "Afetos"],
  "Home Sprays": ["Difusores", "Velas", "Sabonetes"],
  "Difusores": ["Home Sprays", "Velas", "Essências"],
  "Sabonetes": ["Home Sprays", "Velas"],
  "Essências": ["Difusores", "Home Sprays"],
  "Afetos": ["Velas", "Home Sprays"],
  "Namorados": ["Velas", "Afetos", "Kits"],
  "Kits": ["Velas", "Home Sprays"],
  "Acessórios": ["Velas", "Difusores"],
  "Corporativo e Eventos": ["Corporativo e Eventos"],
};

const ADDON_RE = /(mini|cartão|cartao|escalda|lembrancinha|envelope|latinha)/i;

export function scoreRelated(context: RelatedItem[], cand: RelatedItem): number {
  if (context.length === 0) return 0;
  let score = 0;

  const ctxFrags = new Set(context.map((i) => (i.fr ?? "").toLowerCase()).filter(Boolean));
  const ctxCats = context.map((i) => i.c);
  const avg = context.reduce((s, i) => s + i.p, 0) / context.length;

  // 1. Mesma fragrância: o sinal mais forte
  if (cand.fr && ctxFrags.has(cand.fr.toLowerCase())) score += 50;

  // 2/3. Categoria complementar ou igual
  const isComplement = ctxCats.some((c) => (COMPLEMENT[c] ?? []).includes(cand.c));
  const isSame = ctxCats.includes(cand.c);
  if (isComplement) score += 30;
  else if (isSame) score += 18;

  // 4. Faixa de preço compatível (nem muito acima, nem irrelevante)
  const ratio = avg > 0 ? cand.p / avg : 1;
  if (ratio >= 0.35 && ratio <= 1.6) score += 12;   // faixa natural de combinação
  else if (ratio > 2.5) score -= 20;                 // upsell agressivo demais
  else if (ratio > 1.6) score += 4;                  // upsell moderado ainda vale

  // 5. Adição de baixo atrito quando o carrinho já tem valor
  if (ADDON_RE.test(cand.n) && avg >= 6000) score += 8;

  return score;
}

// Retorna até n sugestões ordenadas por afinidade.
// Se não houver afinidade suficiente, completa com os itens mais acessíveis em estoque.
export function suggestRelated(context: RelatedItem[], candidates: RelatedItem[], n = 3): RelatedItem[] {
  const inCtx = new Set(context.map((i) => i.id));
  const pool = candidates.filter((c) => !inCtx.has(c.id) && c.s > 0);

  const scored = pool
    .map((c) => ({ c, score: scoreRelated(context, c) }))
    .sort((a, b) => b.score - a.score || a.c.p - b.c.p);

  const picked = scored.filter((x) => x.score > 0).slice(0, n).map((x) => x.c);
  if (picked.length < n) {
    const have = new Set(picked.map((p) => p.id));
    const fill = pool.filter((c) => !have.has(c.id)).sort((a, b) => a.p - b.p).slice(0, n - picked.length);
    picked.push(...fill);
  }
  return picked;
}
