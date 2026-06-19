export type CartLine = { id: string; n: string; p: number; img: string | null; qty: number; deal: boolean };

const KEY = "ef_cart";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function writeCart(lines: CartLine[]) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* ignore */ }
}
export function clearCart() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
