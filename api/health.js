// /api/health.js — simple health check
export default function handler(_req, res) {
  res.json({ ok: true, ts: Date.now() });
}
