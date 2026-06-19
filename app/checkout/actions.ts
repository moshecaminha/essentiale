"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentCustomer } from "@/lib/customer";
import { sendOrderConfirmation } from "@/lib/email";
import { METHOD_LABEL } from "@/lib/orders";
import { revalidatePath } from "next/cache";

type CartItem = { id: string; qty: number; deal?: boolean };
type Address = {
  id?: string; label?: string; cep: string; street: string; number: string;
  complement: string; district: string; city: string; uf: string; phone: string;
};

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

  // resolve o endereço: salvo (id) ou novo (salva para reuso)
  let ship = { cep: address.cep, street: address.street, number: address.number, complement: address.complement, district: address.district, city: address.city, uf: address.uf };
  let addressId: string | null = null;

  if (address.id) {
    const { data: saved } = await sb.from("addresses").select("*").eq("id", address.id).eq("customer_id", customer.id).maybeSingle();
    if (saved) {
      ship = { cep: saved.cep, street: saved.street, number: saved.number, complement: saved.complement, district: saved.district, city: saved.city, uf: saved.uf };
      addressId = saved.id;
    }
  }
  if (!addressId) {
    const { data: novo } = await sb.from("addresses").insert({
      customer_id: customer.id,
      label: (address.label || "").trim() || "Endereço",
      recipient: customer.full_name,
      cep: ship.cep, street: ship.street, number: ship.number, complement: ship.complement,
      district: ship.district, city: ship.city, uf: ship.uf, is_default: true,
    }).select("id").single();
    addressId = novo?.id ?? null;
  }
  if (addressId) {
    await sb.from("addresses").update({ is_default: false }).eq("customer_id", customer.id).neq("id", addressId);
    await sb.from("addresses").update({ is_default: true }).eq("id", addressId);
  }

  // mantém os dados do cliente atualizados (último endereço / telefone)
  await sb.from("customers").update({
    phone: address.phone || customer.phone,
    cep: ship.cep, street: ship.street, number: ship.number,
    complement: ship.complement, district: ship.district, city: ship.city, uf: ship.uf,
  }).eq("id", customer.id);

  const { data: order, error } = await sb.from("orders").insert({
    customer_id: customer.id,
    status: "aguardando_pagamento",
    channel: "web",
    subtotal_cents: subtotal,
    total_cents: total,
    ship_recipient: customer.full_name,
    ship_cep: ship.cep, ship_street: ship.street, ship_number: ship.number,
    ship_complement: ship.complement, ship_district: ship.district,
    ship_city: ship.city, ship_uf: ship.uf,
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
  revalidatePath("/conta/enderecos");
  revalidatePath("/admin/pedidos");
  return { ok: true, orderId: order.id };
}
