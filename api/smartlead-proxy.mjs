// Vercel serverless function — proxies SmartLead API calls

const SL_BASE = "https://server.smartlead.ai/api/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body;
  const { api_key, action, campaign_id } = body;
  if (!api_key) {
    return res.status(400).json({ error: "api_key required" });
  }

  try {
    switch (action) {
      case "list_campaigns": {
        const r = await fetch(`${SL_BASE}/campaigns?api_key=${api_key}`);
        return res.status(r.status).json(await r.json());
      }

      case "campaign_analytics": {
        if (!campaign_id) return res.status(400).json({ error: "campaign_id required" });
        const r = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/analytics?api_key=${api_key}`
        );
        return res.status(r.status).json(await r.json());
      }

      case "lead_statistics": {
        if (!campaign_id) return res.status(400).json({ error: "campaign_id required" });
        const r = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads/statistics?api_key=${api_key}`
        );
        return res.status(r.status).json(await r.json());
      }

      case "list_leads": {
        if (!campaign_id) return res.status(400).json({ error: "campaign_id required" });
        const offset = body.body?.offset || 0;
        const limit = body.body?.limit || 100;
        const r = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads?api_key=${api_key}&offset=${offset}&limit=${limit}`
        );
        return res.status(r.status).json(await r.json());
      }

      case "add_leads": {
        if (!campaign_id) return res.status(400).json({ error: "campaign_id required" });
        const r = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads?api_key=${api_key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body.body),
          }
        );
        return res.status(r.status).json(await r.json());
      }

      case "get_lead_by_email": {
        if (!campaign_id || !body.body?.email)
          return res.status(400).json({ error: "campaign_id and email required" });
        const r = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads?api_key=${api_key}&email=${encodeURIComponent(body.body.email)}`
        );
        return res.status(r.status).json(await r.json());
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
