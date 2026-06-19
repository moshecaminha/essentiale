"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { readCart, writeCart } from "@/lib/cart";

export default function BuyNowButton({ id, name, price, img, disabled }: { id: string; name: string; price: number; img: string | null; disabled?: boolean }) {
  const router = useRouter();
  const buy = () => {
    const cart = readCart();
    const i = cart.findIndex((c) => c.id === id);
    if (i >= 0) cart[i].qty += 1;
    else cart.push({ id, n: name, p: price, img: img ?? null, qty: 1, deal: false });
    writeCart(cart);
    router.push("/checkout");
  };
  return (
    <button className="btn pdp-buy" onClick={buy} disabled={disabled}>
      <ShoppingBag size={18} /> {disabled ? "Produto esgotado" : "Comprar agora"}
    </button>
  );
}
