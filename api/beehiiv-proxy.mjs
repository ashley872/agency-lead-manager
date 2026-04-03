// Vercel serverless function — proxies Beehiiv API calls

const BEEHIIV_BASE = "https://api.beehiiv.com/v2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body;
  const { api_key, publication_id, action } = body;
  if (!api_key || !publication_id) {
    return res.status(400).json({ error: "api_key and publication_id required" });
  }

  const headers = {
    Authorization: `Bearer ${api_key}`,
    "Content-Type": "application/json",
  };

  try {
    switch (action) {
      case "create_subscription": {
        const r = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/subscriptions`,
          { method: "POST", headers, body: JSON.stringify(body.body) }
        );
        const data = await r.json();
        return res.status(r.status).json(data);
      }

      case "get_subscription": {
        const email = encodeURIComponent(body.body.email);
        const r = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/subscriptions?email=${email}`,
          { method: "GET", headers }
        );
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        const sub = data.data?.[0] || null;
        return res.status(200).json({ data: sub });
      }

      case "list_automations": {
        const r = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/automations`,
          { method: "GET", headers }
        );
        const data = await r.json();
        return res.status(r.status).json(data);
      }

      case "update_subscription": {
        const subId = body.body.subscription_id;
        if (!subId) return res.status(400).json({ error: "subscription_id required" });
        const updateBody = { ...body.body };
        delete updateBody.subscription_id;
        const r = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/subscriptions/${subId}`,
          { method: "PATCH", headers, body: JSON.stringify(updateBody) }
        );
        const data = await r.json();
        return res.status(r.status).json(data);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
