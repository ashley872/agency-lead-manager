// Netlify serverless function — proxies Beehiiv API calls
// Keeps API keys out of the client-side code

const BEEHIIV_BASE = "https://api.beehiiv.com/v2";

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

  const { api_key, publication_id, action } = body;
  if (!api_key || !publication_id) {
    return respond(400, { error: "api_key and publication_id required" });
  }

  const headers = {
    Authorization: `Bearer ${api_key}`,
    "Content-Type": "application/json",
  };

  try {
    switch (action) {
      case "create_subscription": {
        const res = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/subscriptions`,
          { method: "POST", headers, body: JSON.stringify(body.body) }
        );
        const data = await res.json();
        if (!res.ok) return respond(res.status, data);
        return respond(200, data);
      }

      case "get_subscription": {
        const email = encodeURIComponent(body.body.email);
        const res = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/subscriptions?email=${email}`,
          { method: "GET", headers }
        );
        const data = await res.json();
        if (!res.ok) return respond(res.status, data);
        // Return first match
        const sub = data.data?.[0] || null;
        return respond(200, { data: sub });
      }

      case "list_automations": {
        const res = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/automations`,
          { method: "GET", headers }
        );
        const data = await res.json();
        if (!res.ok) return respond(res.status, data);
        return respond(200, data);
      }

      case "update_subscription": {
        const subId = body.body.subscription_id;
        if (!subId) return respond(400, { error: "subscription_id required" });
        const updateBody = { ...body.body };
        delete updateBody.subscription_id;
        const res = await fetch(
          `${BEEHIIV_BASE}/publications/${publication_id}/subscriptions/${subId}`,
          { method: "PATCH", headers, body: JSON.stringify(updateBody) }
        );
        const data = await res.json();
        if (!res.ok) return respond(res.status, data);
        return respond(200, data);
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
