// /api/rank.js — RankGun Backend (c) BL4ZE
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const OPEN_CLOUD_KEY = process.env.ROBLOX_OPEN_CLOUD_KEY;
  const SHARED_SECRET  = process.env.SHARED_SECRET || null;
  const OPEN_CLOUD_BASE = process.env.OPEN_CLOUD_BASE || "https://apis.roblox.com";

  if (!OPEN_CLOUD_KEY) return res.status(500).json({ error: "server-misconfigured: ROBLOX_OPEN_CLOUD_KEY missing" });

  // optional shared-secret gate
  if (SHARED_SECRET) {
    const clientSecret = req.headers["x-rg-shared"];
    if (!clientSecret || clientSecret !== SHARED_SECRET) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  try {
    const { groupId, targetUserId, newRoleId, reason } = req.body || {};
    if (!groupId || !targetUserId || !newRoleId) {
      return res.status(400).json({ error: "missing params" });
    }

    const base = `${OPEN_CLOUD_BASE}/cloud/v2/groups/${Number(groupId)}/memberships/${Number(targetUserId)}`;
    const commonHeaders = {
      "x-api-key": OPEN_CLOUD_KEY,
      "Content-Type": "application/json"
    };

    // We’ll try up to 3 payload styles that different tenants accept.
    const attempts = [
      {
        // #1: updateMask=role  (most common)
        url: `${base}?updateMask=role`,
        body: { role: { id: Number(newRoleId) }, reason: reason || "RankGun promotion (c) BL4ZE" }
      },
      {
        // #2: updateMask=role.id
        url: `${base}?updateMask=role.id`,
        body: { role: { id: Number(newRoleId) }, reason: reason || "RankGun promotion (c) BL4ZE" }
      },
      {
        // #3: nested 'membership' wrapper with updateMask=membership.role
        url: `${base}?updateMask=membership.role`,
        body: { membership: { role: { id: Number(newRoleId) } }, reason: reason || "RankGun promotion (c) BL4ZE" }
      }
    ];

    let lastDetail = null;
    for (const a of attempts) {
      const r = await fetch(a.url, {
        method: "PATCH",
        headers: commonHeaders,
        body: JSON.stringify(a.body)
      });
      if (r.ok) return res.json({ ok: true });
      const text = await r.text();
      lastDetail = { status: r.status, detail: text, tried: a.url };
      // Only keep trying if this looks like a formatting problem
      if (r.status !== 400) break;
    }

    return res.status(502).json({ error: "open-cloud", ...lastDetail });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server" });
  }
}
