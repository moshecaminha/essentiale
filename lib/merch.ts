// Merchandising da loja: sugestões de ocasião, link de WhatsApp e
// depoimentos de EXEMPLO (devem ser substituídos por avaliações reais).

export const WHATSAPP = "5581999089912";

export function waLink(productName: string) {
  const msg = `Olá! Tenho interesse no produto "${productName}" e gostaria de tirar uma dúvida.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

type P = { name: string; category: string };

// Sugere ocasiões de presente de forma inteligente, a partir do nome,
// categoria e palavras-chave do produto.
export function occasionsFor(p: P): string[] {
  const t = `${p.name} ${p.category}`.toLowerCase();
  const set = new Set<string>();
  const add = (...xs: string[]) => xs.forEach((x) => set.add(x));

  if (/(coração|coracoes|amor|namorad)/.test(t)) add("Dia dos Namorados", "Aniversário de namoro");
  if (/(mãe|maes|tulipa|jardim de flores|hortênsia|hortensia|buquê|buque|laço|laco|amorelle)/.test(t)) add("Dia das Mães", "Aniversário");
  if (/avós|avos/.test(t)) add("Dia dos Avós", "Homenagem");
  if (/mulher/.test(t)) add("Dia da Mulher", "Reconhecimento");
  if (/páscoa|pascoa/.test(t)) add("Páscoa");
  if (/(kit|10 un|20 un|caixa|atacado)/.test(t)) add("Presentes corporativos", "Eventos e confraternizações", "Lembrancinhas");
  if (/(mini|lembrancinha|envelope|latinha)/.test(t)) add("Lembrancinhas", "Presente para colegas de trabalho", "Casamentos");
  if (/(cartão|cartao|tábua|tabua afetiva)/.test(t)) add("Mensagem de carinho", "Agradecimento");
  if (/(home spray|difusor|sabonete)/.test(t)) add("Casa nova", "Amigo secreto", "Bem-estar no dia a dia");
  if (/escalda/.test(t)) add("Autocuidado", "Presente relaxante");

  // garante ao menos três sugestões
  add("Aniversário", "Agradecimento", "Só porque sim");
  return Array.from(set).slice(0, 4);
}

// Depoimentos de EXEMPLO, alternando perfis: quem comprou para si,
// quem ganhou de presente e quem levou para o trabalho/equipe.
type Depo = { texto: string; nome: string; contexto: string };

const POOL: ((n: string) => Depo)[] = [
  (n) => ({ texto: `Comprei a ${n} para mim depois de uma semana puxada e virou meu ritual do fim do dia. O aroma preenche a sala sem enjoar.`, nome: "Marina C.", contexto: "comprou para si" }),
  (n) => ({ texto: `Ganhei a ${n} de presente e me senti realmente cuidada. A embalagem é um capricho à parte, dá gosto de abrir.`, nome: "Beatriz A.", contexto: "recebeu de presente" }),
  (n) => ({ texto: `Levei a ${n} para o escritório e virou assunto — todo mundo perguntando o cheiro. Acabei pedindo mais para o time inteiro.`, nome: "Patrícia G.", contexto: "presente para o trabalho" }),
  (n) => ({ texto: `Presenteei minha mãe com a ${n} e ela se emocionou. Chegou rapidinho e exatamente como nas fotos.`, nome: "Rafael M.", contexto: "comprou para presentear" }),
  (n) => ({ texto: `Já é a terceira vez que compro a ${n}. Atendimento atencioso no WhatsApp e produto sempre impecável.`, nome: "Fernanda D.", contexto: "cliente recorrente" }),
  (n) => ({ texto: `Coloquei a ${n} na recepção da clínica e os pacientes sempre elogiam o ambiente. Transmite cuidado já na entrada.`, nome: "Juliana R.", contexto: "uso no trabalho" }),
  (n) => ({ texto: `Comprei a ${n} para o quarto e durmo muito melhor com esse aroma. Pequenos gestos que mudam o dia.`, nome: "Camila S.", contexto: "comprou para si" }),
  (n) => ({ texto: `Demos a ${n} como lembrança no nosso casamento e os convidados amaram. Cada detalhe combinou com a festa.`, nome: "Luísa & Thiago", contexto: "evento" }),
];

export function testimonialsFor(p: { name: string; id?: string }): Depo[] {
  const seed = (p.id ?? p.name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const idxs = [seed % POOL.length, (seed + 3) % POOL.length, (seed + 5) % POOL.length];
  const uniq = Array.from(new Set(idxs)).slice(0, 3);
  return uniq.map((i) => POOL[i](p.name));
}
