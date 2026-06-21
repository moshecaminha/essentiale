import { authorized, ok, unauthorized, badRequest, serverError } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
const digits = (s: any) => String(s || "").replace(/\D/g, "");

// GET /api/v1/orders?status=&phone=&limit=50
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const u = new URL(req.url);
  const sb = supabaseServer();
  let q = sb.from("orders")
    .select("id,order_number,status,channel,subtotal_cents,discount_cents,shipping_cents,total_cents,ship_recipient,ship_city,ship_uf,placed_at,customer:customers(id,full_name,phone,email)")
    .order("placed_at", { ascending: false })
    .limit(Math.min(200, Number(u.searchParams.get("limit") || 50)));
  const status = u.searchParams.get("status");
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return badRequest(error.message);
  let rows = data ?? [];
  const phone = u.searchParams.get("phone");
  if (phone) { const d = digits(phone); rows = (rows as any[]).filter((o) => digits(o.customer?.phone).endsWith(d.slice(-8))); }
  return ok({ orders: rows, count: rows.length });
}

// POST /api/v1/orders  (cria pedido vindo do WhatsApp)
export async function POST(req: Request) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  if (!Array.isArray(b.items) || b.items.length === 0) return badRequest("Informe 'items' (lista com product_id/slug e qty).");
  const sb = supabaseServer();

  // 1) cliente: por customer_id, ou upsert por telefone
  let customerId = b.customer_id ?? null;
  const cust = b.customer || {};
  const phone = digits(cust.phone || b.phone);
  if (!customerId) {
    if (phone) {
      const { data: found } = await sb.from("customers").select("id").eq("phone", phone).maybeSingle();
      customerId = found?.id ?? null;
    }
    if (!customerId) {
      const { data: created, error: ce } = await sb.from("customers").insert({
        full_name: cust.name || cust.full_name || "Cliente WhatsApp",
        phone: phone || null, email: cust.email || null,
        cep: cust.cep || null, street: cust.street || null, number: cust.number || null,
        complement: cust.complement || null, district: cust.district || null, city: cust.city || null, uf: cust.uf || null,
      }).select("id").single();
      if (ce) return badRequest("Cliente: " + ce.message);
      customerId = created.id;
    }
  }

  // 2) itens: preço do banco (permite override unit_price_cents p/ descontos do bot)
  const keys = b.items.map((i: any) => i.product_id || i.slug || i.id).filter(Boolean);
  const { data: prods = [] } = await sb.from("products").select("id,slug,name,price_cents").or(keys.map((k: string) => (/^[0-9a-f-]{36}$/i.test(k) ? `id.eq.${k}` : `slug.eq.${k}`)).join(","));
  const byId = new Map((prods as any[]).map((p) => [p.id, p]));
  const bySlug = new Map((prods as any[]).map((p) => [p.slug, p]));

  const lines = b.items.map((i: any) => {
    const key = i.product_id || i.slug || i.id;
    const p = byId.get(key) || bySlug.get(key);
    if (!p) return null;
    const qty = Math.max(1, Number(i.qty || 1));
    const unit = i.unit_price_cents != null ? Math.round(Number(i.unit_price_cents)) : p.price_cents;
    return { product_id: p.id, product_name: p.name, unit_price_cents: unit, qty, total_cents: unit * qty };
  }).filter(Boolean) as any[];
  if (lines.length === 0) return badRequest("Nenhum item válido (verifique product_id/slug).");

  const subtotal = lines.reduce((s, l) => s + l.total_cents, 0);
  const discount = Math.round(Number(b.discount_cents || 0));
  const shipping = Math.round(Number(b.shipping_cents || 0));
  const total = subtotal - discount + shipping;

  const ship = b.ship || cust;
  const { data: order, error } = await sb.from("orders").insert({
    customer_id: customerId,
    status: b.payment_status === "aprovado" ? "pago" : "aguardando_pagamento",
    channel: ["web", "whatsapp", "manual"].includes(b.channel) ? b.channel : "whatsapp",
    subtotal_cents: subtotal, discount_cents: discount, shipping_cents: shipping, total_cents: total,
    ship_recipient: ship.recipient || cust.name || cust.full_name || null,
    ship_cep: ship.cep || null, ship_street: ship.street || null, ship_number: ship.number || null,
    ship_complement: ship.complement || null, ship_district: ship.district || null,
    ship_city: ship.city || null, ship_uf: ship.uf || null,
    placed_at: new Date().toISOString(),
  }).select("id,order_number,status,total_cents").single();
  if (error || !order) return serverError("Pedido: " + (error?.message || "falha"));

  await sb.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
  await sb.from("payments").insert({
    order_id: order.id, provider: "manual",
    method: ["pix", "cartao_credito", "boleto", "outro"].includes(b.method) ? b.method : "pix",
    amount_cents: total, status: b.payment_status === "aprovado" ? "aprovado" : "pendente",
    paid_at: b.payment_status === "aprovado" ? new Date().toISOString() : null,
  });
  await sb.from("shipments").insert({ order_id: order.id, status: "preparando" });

  return ok({ order: { ...order, items: lines, customer_id: customerId } }, 201);
}
