// Netlify serverless function — proxies SmartLead API calls
// Keeps API key server-side

const SL_BASE = "https://server.smartlead.ai/api/v1";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { error: "Invalid JSON" });
  }

  const { api_key, action, campaign_id } = body;
  if (!api_key) {
    return respond(400, { error: "api_key required" });
  }

  try {
    switch (action) {
      case "list_campaigns": {
        const res = await fetch(`${SL_BASE}/campaigns?api_key=${api_key}`);
        return respond(res.status, await res.json());
      }

      case "campaign_analytics": {
        if (!campaign_id) return respond(400, { error: "campaign_id required" });
        const res = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/analytics?api_key=${api_key}`
        );
        return respond(res.status, await res.json());
      }

      case "lead_statistics": {
        if (!campaign_id) return respond(400, { error: "campaign_id required" });
        const res = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads/statistics?api_key=${api_key}`
        );
        return respond(res.status, await res.json());
      }

      case "list_leads": {
        if (!campaign_id) return respond(400, { error: "campaign_id required" });
        const offset = body.body?.offset || 0;
        const limit = body.body?.limit || 100;
        const res = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads?api_key=${api_key}&offset=${offset}&limit=${limit}`
        );
        return respond(res.status, await res.json());
      }

      case "add_leads": {
        if (!campaign_id) return respond(400, { error: "campaign_id required" });
        const res = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads?api_key=${api_key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body.body),
          }
        );
        return respond(res.status, await res.json());
      }

      case "get_lead_by_email": {
        if (!campaign_id || !body.body?.email)
          return respond(400, { error: "campaign_id and email required" });
        const res = await fetch(
          `${SL_BASE}/campaigns/${campaign_id}/leads?api_key=${api_key}&email=${encodeURIComponent(body.body.email)}`
        );
        return respond(res.status, await res.json());
      }

      default:
        return respond(400, { error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return respond(500, { error: err.message });
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function respond(status, data) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(data),
  };
}
