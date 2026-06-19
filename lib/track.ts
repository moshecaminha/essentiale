// Rastreia intenções de compra sem perder nada, mesmo sem finalizar.
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem("ef_sid");
    if (!s) { s = (crypto as any).randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2); localStorage.setItem("ef_sid", s); }
    return s;
  } catch { return ""; }
}

type TrackOpts = { productId?: string; label?: string; valueCents?: number; cart?: any[]; meta?: any };

export function track(type: string, opts: TrackOpts = {}) {
  if (typeof window === "undefined") return;
  try {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const body = JSON.stringify({ sessionId, type, ...opts });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch { /* nunca quebra o fluxo do cliente */ }
}
