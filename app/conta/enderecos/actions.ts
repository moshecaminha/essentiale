"use server";

import { getCurrentCustomer } from "@/lib/customer";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function addAddress(formData: FormData) {
  const { customer } = await getCurrentCustomer();
  if (!customer) return;
  const sb = supabaseServer();
  const { count } = await sb.from("addresses").select("*", { count: "exact", head: true }).eq("customer_id", customer.id);
  await sb.from("addresses").insert({
    customer_id: customer.id,
    label: String(formData.get("label") || "").trim() || "Endereço",
    recipient: customer.full_name,
    cep: String(formData.get("cep") || ""),
    street: String(formData.get("street") || ""),
    number: String(formData.get("number") || ""),
    complement: String(formData.get("complement") || ""),
    district: String(formData.get("district") || ""),
    city: String(formData.get("city") || ""),
    uf: String(formData.get("uf") || "").toUpperCase().slice(0, 2),
    is_default: (count ?? 0) === 0,
  });
  revalidatePath("/conta/enderecos");
}

export async function deleteAddress(formData: FormData) {
  const { customer } = await getCurrentCustomer();
  if (!customer) return;
  const id = String(formData.get("id") || "");
  if (id) {
    const sb = supabaseServer();
    await sb.from("addresses").delete().eq("id", id).eq("customer_id", customer.id);
    revalidatePath("/conta/enderecos");
  }
}

export async function setDefaultAddress(formData: FormData) {
  const { customer } = await getCurrentCustomer();
  if (!customer) return;
  const id = String(formData.get("id") || "");
  if (id) {
    const sb = supabaseServer();
    await sb.from("addresses").update({ is_default: false }).eq("customer_id", customer.id);
    await sb.from("addresses").update({ is_default: true }).eq("id", id).eq("customer_id", customer.id);
    revalidatePath("/conta/enderecos");
  }
}
