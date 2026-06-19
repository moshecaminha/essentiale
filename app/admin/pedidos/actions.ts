"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { nextStatus } from "@/lib/orders";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const toCents = (v: string) => {
  const n = parseFloat(String(v || "0").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100);
};

export async function createOrder(formData: FormData) {
  const sb = supabaseServer();

  const name = String(formData.get("customer_name") || "").trim();
  const phone = String(formData.get("customer_phone") || "").replace(/\D/g, "");
  const city = String(formData.get("customer_city") || "").trim() || null;
  const uf = (String(formData.get("customer_uf") || "").trim().toUpperCase() || null)?.slice(0, 2) || null;

  const items = JSON.parse(String(formData.get("items") || "[]")) as { id: string; qty: number }[];
  if (!name || items.length === 0) redirect("/admin/pedidos/novo?erro=1");

  // preços vêm do banco (não confia no cliente)
  const ids = items.map((i) => i.id);
  const { data: prods = [] } = await sb.from("products").select("id,name,price_cents,stock_qty").in("id", ids);
  const pmap = new Map((prods as any[]).map((p) => [p.id, p]));

  const lines = items
    .map((i) => {
      const p = pmap.get(i.id);
      if (!p) return null;
      const qty = Math.max(1, i.qty | 0);
      return { product_id: p.id, product_name: p.name, unit_price_cents: p.price_cents, qty, total_cents: p.price_cents * qty };
    })
    .filter(Boolean) as any[];

  const subtotal = lines.reduce((s, l) => s + l.total_cents, 0);
  const shipping = toCents(String(formData.get("shipping") || "0"));
  const discount = toCents(String(formData.get("discount") || "0"));
  const total = subtotal + shipping - discount;

  const method = String(formData.get("method") || "pix");
  const pago = String(formData.get("payment_status") || "pendente") === "aprovado";
  const orderStatus = pago ? "pago" : "aguardando_pagamento";

  // cliente: encontra por telefone ou cria
  let customerId: string | null = null;
  if (phone) {
    const { data } = await sb.from("customers").select("id").eq("phone", phone).maybeSingle();
    if (data) customerId = data.id;
  }
  if (customerId) {
    await sb.from("customers").update({ full_name: name, city, uf }).eq("id", customerId);
  } else {
    const { data } = await sb.from("customers").insert({ full_name: name, phone: phone || null, city, uf }).select("id").single();
    customerId = data?.id ?? null;
  }

  const { data: order } = await sb.from("orders").insert({
    customer_id: customerId,
    status: orderStatus,
    channel: "whatsapp",
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    discount_cents: discount,
    total_cents: total,
    ship_recipient: name,
    ship_city: city,
    ship_uf: uf,
    placed_at: new Date().toISOString(),
  }).select("id").single();

  if (order?.id) {
    await sb.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
    await sb.from("payments").insert({
      order_id: order.id, provider: "manual", method, amount_cents: total,
      status: pago ? "aprovado" : "pendente", paid_at: pago ? new Date().toISOString() : null,
    });
    await sb.from("shipments").insert({ order_id: order.id, status: "preparando" });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  redirect("/admin/pedidos");
}

export async function advanceOrder(formData: FormData) {
  const id = String(formData.get("id") || "");
  const current = String(formData.get("current") || "");
  const next = nextStatus(current);
  if (id && next) {
    const sb = supabaseServer();
    await sb.from("orders").update({ status: next }).eq("id", id);
    if (next === "enviado") await sb.from("shipments").update({ status: "postado", shipped_at: new Date().toISOString() }).eq("order_id", id);
    if (next === "a_caminho") await sb.from("shipments").update({ status: "saiu_para_entrega" }).eq("order_id", id);
    if (next === "entregue") await sb.from("shipments").update({ status: "entregue", delivered_at: new Date().toISOString() }).eq("order_id", id);
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
  }
}
