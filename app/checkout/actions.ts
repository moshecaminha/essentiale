"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentCustomer } from "@/lib/customer";
import { sendOrderConfirmation } from "@/lib/email";
import { METHOD_LABEL } from "@/lib/orders";
import { revalidatePath } from "next/cache";

type CartItem = { id: string; qty: number; deal?: boolean };
type Address = { cep: string; street: string; number: string; complement: string; district: string; city: string; uf: string; phone: string };

export async function placeOrder(cart: CartItem[], address: Address, method: string): Promise<{ ok: boolean; orderId?: string; error?: string }> {
  const { user, customer } = await getCurrentCustomer();
  if (!user || !customer) return { ok: false, error: "Faça login para finalizar a compra." };
  if (!cart || cart.length === 0) return { ok: false, error: "Carrinho vazio." };

  const sb = supabaseServer();

  // preços do banco (não confia no cliente)
  const ids = cart.map((c) => c.id);
  const { data: prods = [] } = await sb.from("products").select("id,name,price_cents,stock_qty").in("id", ids);
  const pmap = new Map((prods as any[]).map((p) => [p.id, p]));

  const lines = cart.map((c) => {
    const p = pmap.get(c.id);
    if (!p) return null;
    const qty = Math.max(1, c.qty | 0);
    const unit = c.deal ? Math.round(p.price_cents * 0.95) : p.price_cents;
    return { product_id: p.id, product_name: p.name, unit_price_cents: unit, qty, total_cents: unit * qty };
  }).filter(Boolean) as any[];
  if (lines.length === 0) return { ok: false, error: "Produtos indisponíveis." };

  const subtotal = lines.reduce((s, l) => s + l.total_cents, 0);
  const total = subtotal; // frete calculado na confirmação do pagamento

  // atualiza dados do cliente (endereço por CEP)
  await sb.from("customers").update({
    phone: address.phone || customer.phone,
    cep: address.cep, street: address.street, number: address.number,
    complement: address.complement, district: address.district, city: address.city, uf: address.uf,
  }).eq("id", customer.id);

  const { data: order, error } = await sb.from("orders").insert({
    customer_id: customer.id,
    status: "aguardando_pagamento",
    channel: "web",
    subtotal_cents: subtotal,
    total_cents: total,
    ship_recipient: customer.full_name,
    ship_cep: address.cep, ship_street: address.street, ship_number: address.number,
    ship_complement: address.complement, ship_district: address.district,
    ship_city: address.city, ship_uf: address.uf,
    placed_at: new Date().toISOString(),
  }).select("id,order_number").single();

  if (error || !order) return { ok: false, error: "Não foi possível registrar o pedido." };

  await sb.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
  await sb.from("payments").insert({ order_id: order.id, provider: "manual", method, amount_cents: total, status: "pendente" });
  await sb.from("shipments").insert({ order_id: order.id, status: "preparando" });

  if (customer.email) {
    await sendOrderConfirmation({
      to: customer.email, customerName: customer.full_name, orderNumber: order.order_number,
      items: lines.map((l) => ({ name: l.product_name, qty: l.qty, total: l.total_cents })),
      total, method: METHOD_LABEL[method] ?? method,
    });
  }

  revalidatePath("/conta/pedidos");
  revalidatePath("/admin/pedidos");
  return { ok: true, orderId: order.id };
}
