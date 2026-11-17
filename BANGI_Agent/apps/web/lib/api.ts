// Bangi Gateway client — used by Next.js + Flutter (same /api surface)
export const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || ""; // empty = same origin via rewrites → :8001
const base = GATEWAY ? GATEWAY.replace(/\/$/, "") : "";

export async function apiTask(prompt: string) {
  const r = await fetch(`${base}/api/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiHealth() {
  const r = await fetch(`${base}/api/health`, { cache: "no-store" });
  return r.json();
}

export async function apiReport() {
  const r = await fetch(`${base}/api/hermes/report`, { cache: "no-store" });
  return r.json();
}

export async function apiCampaign(corridor_id: string) {
  const r = await fetch(`${base}/api/hermes/campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ corridor_id }),
  });
  return r.json();
}

// WebSocket helper
export function connectWS(onMsg: (m: any) => void) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const url = GATEWAY ? GATEWAY.replace(/^http/, "ws") + "/ws" : `${proto}//${location.host}/ws`;
  const ws = new WebSocket(url);
  ws.onmessage = (e) => {
    try { onMsg(JSON.parse(e.data)); } catch { onMsg({ raw: e.data }); }
  };
  return ws;
}
