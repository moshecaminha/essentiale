"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { readCart, writeCart } from "@/lib/cart";
import { track } from "@/lib/track";

export default function BuyNowButton({ id, name, price, img, disabled }: { id: string; name: string; price: number; img: string | null; disabled?: boolean }) {
  const router = useRouter();

  useEffect(() => { track("product_view", { productId: id, label: name, valueCents: price }); }, [id, name, price]);

  const buy = () => {
    const cart = readCart();
    const i = cart.findIndex((c) => c.id === id);
    if (i >= 0) cart[i].qty += 1;
    else cart.push({ id, n: name, p: price, img: img ?? null, qty: 1, deal: false });
    writeCart(cart);
    track("add_to_cart", { productId: id, label: name, valueCents: price, cart });
    // abre a loja com o carrinho lateral aberto (cross-sell + continuar comprando)
    router.push("/?cart=1");
  };

  return (
    <button className="btn pdp-buy" onClick={buy} disabled={disabled}>
      <ShoppingBag size={18} /> {disabled ? "Produto esgotado" : "Comprar agora"}
    </button>
  );
}
