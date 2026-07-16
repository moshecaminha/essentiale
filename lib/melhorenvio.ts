// Integração com o Melhor Envio (cotação de frete).
// Configuração via variáveis de ambiente na Vercel:
//   MELHOR_ENVIO_TOKEN     -> token de API gerado no painel do Melhor Envio
//   MELHOR_ENVIO_FROM_CEP  -> CEP de origem (onde os pedidos são postados)
//   MELHOR_ENVIO_SANDBOX=1 -> opcional, usa o ambiente de testes
// Sem essas variáveis o checkout continua funcionando com "frete a combinar".

const BASE = process.env.MELHOR_ENVIO_SANDBOX === "1"
  ? "https://sandbox.melhorenvio.com.br"
  : "https://melhorenvio.com.br";

const UA = "Essentiale Fragrance (essentialefragrance@gmail.com)";

export type QuoteItem = {
  id: string;
  qty: number;
  // dimensões do cadastro do produto; usa padrões seguros quando não preenchidas
  peso_gramas?: number | null;
  altura_cm?: number | null;
  largura_cm?: number | null;
  profundidade_cm?: number | null;
  price_cents?: number | null;
};

export type FreightOption = {
  serviceId: number;
  name: string;      // Ex: PAC, SEDEX, .Package
  company: string;   // Ex: Correios, Jadlog
  priceCents: number;
  days: number;      // prazo em dias úteis
};

export function melhorEnvioConfigured(): boolean {
  return Boolean(process.env.MELHOR_ENVIO_TOKEN && process.env.MELHOR_ENVIO_FROM_CEP);
}

// Padrões quando o produto ainda não tem dimensões cadastradas
// (caixa pequena típica de vela/home spray).
const DEF = { weight_kg: 0.35, height: 12, width: 12, length: 12 };

export async function quoteShipping(toCep: string, items: QuoteItem[]): Promise<FreightOption[]> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const fromCep = process.env.MELHOR_ENVIO_FROM_CEP;
  if (!token || !fromCep) return [];

  const to = toCep.replace(/\D/g, "");
  if (to.length !== 8) return [];

  const products = items.map((i) => ({
    id: i.id,
    quantity: Math.max(1, i.qty | 0),
    weight: i.peso_gramas ? Math.max(0.05, i.peso_gramas / 1000) : DEF.weight_kg, // kg
    height: i.altura_cm && i.altura_cm > 0 ? i.altura_cm : DEF.height,            // cm
    width: i.largura_cm && i.largura_cm > 0 ? i.largura_cm : DEF.width,
    length: i.profundidade_cm && i.profundidade_cm > 0 ? i.profundidade_cm : DEF.length,
    insurance_value: i.price_cents ? i.price_cents / 100 : 0,
  }));

  try {
    const res = await fetch(`${BASE}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({
        from: { postal_code: fromCep.replace(/\D/g, "") },
        to: { postal_code: to },
        products,
      }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((s: any) => !s.error && s.price)
      .map((s: any) => ({
        serviceId: Number(s.id),
        name: String(s.name ?? ""),
        company: String(s.company?.name ?? ""),
        priceCents: Math.round(parseFloat(String(s.price)) * 100),
        days: Number(s.delivery_time ?? s.delivery_range?.max ?? 0),
      }))
      .sort((a: FreightOption, b: FreightOption) => a.priceCents - b.priceCents);
  } catch {
    return [];
  }
}
