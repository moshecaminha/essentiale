import { NextResponse } from "next/server";

// Autenticação por chave de integração (Bearer token ou header x-api-key).
// Defina INTEGRATION_API_KEY no ambiente e entregue ao desenvolvedor do WhatsApp.
export function authorized(req: Request): boolean {
  const key = process.env.INTEGRATION_API_KEY;
  if (!key) return false; // sem chave configurada => API fechada
  const h = req.headers.get("authorization") || "";
  const bearer = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
  const xkey = req.headers.get("x-api-key") || "";
  return bearer === key || xkey === key;
}

export const ok = (data: any, status = 200) => NextResponse.json(data, { status });
export const unauthorized = () => NextResponse.json({ error: "unauthorized", message: "Chave de integração ausente ou inválida (use Authorization: Bearer <chave>)." }, { status: 401 });
export const badRequest = (message: string) => NextResponse.json({ error: "bad_request", message }, { status: 400 });
export const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });
export const serverError = (message = "internal_error") => NextResponse.json({ error: "server_error", message }, { status: 500 });

export function toCents(v: any): number {
  if (typeof v === "number") return Math.round(v);
  const n = parseFloat(String(v || "0").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// Aceita preço em centavos (price_cents) ou em reais (price)
export function priceToCents(body: any): number | undefined {
  if (body.price_cents != null) return Math.round(Number(body.price_cents));
  if (body.price != null) return toCents(body.price);
  return undefined;
}
