"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toCents = (v: string) => {
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100);
};

async function uploadIfPresent(formData: FormData): Promise<string | null> {
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return null;
  const sb = supabaseServer();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await sb.storage.from("product-images").upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return null;
  return sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export async function saveProduct(formData: FormData) {
  const sb = supabaseServer();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  if (!slug) slug = slugify(name);

  const uploaded = await uploadIfPresent(formData);
  const image_url = uploaded ?? (String(formData.get("current_image_url") || "") || null);

  const fields: Record<string, any> = {
    name,
    slug,
    category_id: String(formData.get("category_id") || "") || null,
    price_cents: toCents(String(formData.get("price") || "0")),
    compare_at_cents: formData.get("compare_at") ? toCents(String(formData.get("compare_at"))) : null,
    stock_qty: parseInt(String(formData.get("stock_qty") || "0"), 10) || 0,
    low_stock_threshold: parseInt(String(formData.get("low_stock_threshold") || "10"), 10) || 10,
    description: String(formData.get("description") || "") || null,
    fragrance: String(formData.get("fragrance") || "").trim() || null,
    is_wholesale: formData.get("is_wholesale") === "on",
    active: formData.get("active") === "on",
    image_url,
  };

  if (id && id !== "novo") {
    await sb.from("products").update(fields).eq("id", id);
  } else {
    await sb.from("products").insert(fields);
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (id) {
    const sb = supabaseServer();
    await sb.from("products").delete().eq("id", id);
    revalidatePath("/admin/produtos");
    revalidatePath("/");
  }
}

export async function duplicateProduct(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const sb = supabaseServer();
  const { data: orig } = await sb
    .from("products")
    .select("name,category_id,price_cents,compare_at_cents,stock_qty,low_stock_threshold,description,image_url")
    .eq("id", id)
    .maybeSingle();
  if (!orig) return;
  const rnd = Math.random().toString(36).slice(2, 7);
  await sb.from("products").insert({
    ...orig,
    name: `${orig.name} (cópia)`,
    slug: `${slugify(orig.name)}-copia-${rnd}`,
    active: false,
  });
  revalidatePath("/admin/produtos");
}
