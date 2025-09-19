// /api/rank.js — RankGun Backend (c) BL4ZE
// Serverless function for Vercel. Promotes a user to a new role via Roblox Open Cloud (cloud v2).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const OPEN_CLOUD_KEY = process.env.ROBLOX_OPEN_CLOUD_KEY; // REQUIRED — set in Vercel env
  const SHARED_SECRET  = process.env.SHARED_SECRET || null; // RECOMMENDED — set same value in Roblox header
  const OPEN_CLOUD_BASE = process.env.OPEN_CLOUD_BASE || "https://apis.roblox.com";

  if (!OPEN_CLOUD_KEY) {
    return res.status(500).json({ error: "server-misconfigured: ROBLOX_OPEN_CLOUD_KEY missing" });
  }

  // Optional shared-secret check so only your game can call this
  if (SHARED_SECRET) {
    const header = req.headers["x-rg-shared"];
    if (!header || header !== SHARED_SECRET) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  try {
    const { groupId, targetUserId, newRoleId, reason } = req.body || {};
    if (!groupId || !targetUserId || !newRoleId) {
      return res.status(400).json({ error: "missing params" });
    }

    // cloud v2 membership update — must include updateMask
    const url = `${OPEN_CLOUD_BASE}/cloud/v2/groups/${groupId}/memberships/${targetUserId}?updateMask=role`;

    const r = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": OPEN_CLOUD_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: { id: Number(newRoleId) },             // role *Id* (not rank)
        reason: reason || "RankGun promotion (c) BL4ZE"
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: "open-cloud", status: r.status, detail: text });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server" });
  }
}
