// Vercel Cron Job — auto-drip newsletter leads to Beehiiv daily
// Runs server-side on schedule, no browser needed.
// Reads leads + settings from Supabase, pushes to Beehiiv API, updates Supabase.

const { createClient } = require("@supabase/supabase-js");

const BEEHIIV_BASE = "https://api.beehiiv.com/v2";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role for server-side
const CRON_SECRET = process.env.CRON_SECRET;

const RESTRICTED = [
  "alcohol","wine","spirits","beer","brewery","distillery","liquor",
  "tobacco","vaping","vape","e-cigarette","cigarette","nicotine","smoking",
  "cannabis","cbd","marijuana","hemp","thc",
  "weapons","firearms","ammunition","guns","knives","tactical",
  "gambling","casino","betting","lottery",
  "adult","adult entertainment","xxx",
  "pharmaceutical","prescription","rx",
  "hospitality","hotel","hotels","restaurant","restaurants","catering",
  "real estate","property","mortgage",
  "insurance","banking","financial services",
  "legal","law firm","attorney",
  "accounting","tax services",
  "consulting","management consulting",
  "staffing","recruitment","hr services",
  "construction","plumbing","electrical","hvac",
  "healthcare","dental","medical practice","clinic",
  "education","university","school","training",
  "transportation","logistics","freight","trucking",
  "automotive","car dealership","auto repair",
];

function isRestricted(lead) {
  const industry = (lead.industry || "").toLowerCase();
  const company = (lead.company_name || "").toLowerCase();
  for (const r of RESTRICTED) {
    if (industry.includes(r) || company.includes(r)) return true;
  }
  return false;
}

function getSegment(lead) {
  if (lead.newsletter_segment) return lead.newsletter_segment;
  const emp = parseInt(lead.employee_count) || 0;
  const rev = lead.est_revenue || 0;
  const title = (lead.title || "").toLowerCase();
  if (emp >= 200 || rev >= 50000000) return "enterprise";
  if (["agency","consultant","freelance","strategist","advisor","partner"].some(t => title.includes(t))) return "agency";
  return "new-seller";
}

function generateTags(lead, bh) {
  const tags = [];
  const country = (lead.country || "").toLowerCase().replace(/\s+/g, "-");
  if (country) tags.push((bh.tag_country || "country-") + country);
  const seg = getSegment(lead);
  if (seg) tags.push((bh.tag_segment || "nl-") + seg);
  const tier = (lead.tier || "").toLowerCase();
  if (tier) tags.push((bh.tag_tier || "tier-") + tier);
  const industry = (lead.industry || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  if (industry) tags.push((bh.tag_industry || "ind-") + industry);
  return tags;
}

function getAutomationId(lead, bh) {
  const seg = getSegment(lead);
  const map = {
    "new-seller": bh.aut_new_seller,
    "active-seller": bh.aut_active_seller,
    "agency": bh.aut_agency,
    "enterprise": bh.aut_enterprise,
  };
  return map[seg] || bh.automation_id || "";
}

async function beehiivCreate(bh, payload) {
  const resp = await fetch(`${BEEHIIV_BASE}/publications/${bh.publication_id}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bh.api_key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || data.error || `Beehiiv ${resp.status}`);
  return data;
}

async function beehiivCheck(bh, email) {
  const resp = await fetch(
    `${BEEHIIV_BASE}/publications/${bh.publication_id}/subscriptions?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${bh.api_key}` } }
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.data?.[0] || null;
}

module.exports = async function handler(req, res) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers["authorization"];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "SUPABASE_URL and SUPABASE_SERVICE_KEY env vars required" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const log = [];

  try {
    // 1. Get Beehiiv settings from team_settings
    const { data: settingsRow, error: settingsErr } = await sb
      .from("team_settings")
      .select("data")
      .eq("id", "shared")
      .single();
    if (settingsErr || !settingsRow) {
      return res.status(500).json({ error: "No team_settings found in Supabase. Save settings in the UI first." });
    }

    const bh = settingsRow.data?.beehiiv;
    if (!bh || !bh.api_key || !bh.publication_id) {
      return res.status(400).json({ error: "Beehiiv API key and Publication ID not configured. Set up in Newsletter → Settings." });
    }
    if (!bh.autopilot) {
      return res.json({ status: "skipped", reason: "Autopilot not enabled" });
    }

    const dailyLimit = bh.daily_limit || 300;

    // 2. Check today's drip count (stored in team_settings as drip_log)
    const today = new Date().toISOString().split("T")[0];
    const { data: dripLogRow } = await sb
      .from("team_settings")
      .select("data")
      .eq("id", "drip_log")
      .single();
    const dripLog = dripLogRow?.data || {};
    const todayCount = dripLog[today] || 0;
    const remaining = Math.max(0, dailyLimit - todayCount);

    if (remaining === 0) {
      return res.json({ status: "skipped", reason: `Daily limit reached (${todayCount}/${dailyLimit})` });
    }
    log.push(`Remaining today: ${remaining}/${dailyLimit}`);

    // 3. Fetch newsletter-stage leads from Supabase
    let allLeads = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data, error } = await sb
        .from("leads")
        .select("id, data")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allLeads = allLeads.concat(data);
      if (data.length < PAGE_SIZE) break;
      page++;
    }
    log.push(`Total leads in DB: ${allLeads.length}`);

    // 4. Auto-pull: move eligible clean leads to newsletter stage
    let autoPulled = 0;
    for (const row of allLeads) {
      const l = row.data;
      if (!l.email || !l.email.includes("@")) continue;
      if (l.stage !== "new" && l.stage !== "enrich") continue;
      if (l.email_type === "generic") continue;
      if (l.email_verified !== "valid") continue;
      if (isRestricted(l)) continue;
      l.stage = "newsletter";
      autoPulled++;
    }
    if (autoPulled > 0) log.push(`Auto-pulled ${autoPulled} leads to newsletter`);

    // 5. Filter to unpushed newsletter leads
    let unpushed = allLeads.filter(row => {
      const l = row.data;
      if (l.stage !== "newsletter" || !l.email) return false;
      if (l.email_verified !== "valid") return false;
      if (l.beehiiv_status === "pushed" || l.beehiiv_status === "failed") return false;
      if (isRestricted(l)) return false;
      return true;
    });

    // 6. One per brand per day
    const seenBrands = new Set();
    const todayBrandsKey = `brands_${today}`;
    const alreadyDripped = new Set(dripLog[todayBrandsKey] || []);
    unpushed = unpushed.filter(row => {
      const brandKey = (row.data.company_name || row.data.email || "").toLowerCase().trim();
      if (alreadyDripped.has(brandKey) || seenBrands.has(brandKey)) return false;
      seenBrands.add(brandKey);
      return true;
    });

    const toPush = unpushed.slice(0, remaining);
    log.push(`Pushing ${toPush.length} leads (${unpushed.length} eligible, ${remaining} remaining)`);

    if (toPush.length === 0) {
      return res.json({ status: "ok", log, pushed: 0, reason: "No eligible leads to push" });
    }

    // 7. Push to Beehiiv
    let pushed = 0, failed = 0;
    const drippedBrands = [...alreadyDripped];

    for (const row of toPush) {
      const lead = row.data;
      try {
        // Check existing
        const existing = await beehiivCheck(bh, lead.email);
        if (existing && existing.id) {
          lead.beehiiv_status = "pushed";
          lead.beehiiv_subscription_id = existing.id;
          lead.beehiiv_pushed_at = new Date().toISOString();
          pushed++;
        } else {
          // Create subscription
          const tags = generateTags(lead, bh);
          tags.push("in-drip");
          const payload = {
            email: lead.email,
            reactivate_existing: true,
            send_welcome_email: !bh.double_opt_in,
            utm_source: "agencyclay",
            referring_site: "agencyclay",
            custom_fields: [],
          };
          if (lead.contact_first) payload.custom_fields.push({ name: "first_name", value: lead.contact_first });
          if (lead.contact_last) payload.custom_fields.push({ name: "last_name", value: lead.contact_last });
          if (lead.company_name) payload.custom_fields.push({ name: "company", value: lead.company_name });
          if (lead.title) payload.custom_fields.push({ name: "title", value: lead.title });
          if (tags.length > 0) payload.tags = tags;
          const autId = getAutomationId(lead, bh);
          if (autId) payload.automation_ids = [autId];
          if (bh.double_opt_in) payload.double_opt_in = true;

          const result = await beehiivCreate(bh, payload);
          lead.beehiiv_status = "pushed";
          lead.beehiiv_subscription_id = result.data?.id || "";
          lead.beehiiv_pushed_at = new Date().toISOString();
          lead.beehiiv_tags = tags;
          pushed++;
        }

        const brandKey = (lead.company_name || lead.email || "").toLowerCase().trim();
        drippedBrands.push(brandKey);
      } catch (err) {
        lead.beehiiv_status = "failed";
        lead.beehiiv_error = err.message;
        failed++;
        log.push(`Failed: ${lead.email} — ${err.message}`);
      }

      // Rate limit: 50ms between calls
      await new Promise(r => setTimeout(r, 50));
    }

    // 8. Update leads in Supabase
    const toUpdate = toPush.concat(autoPulled > 0 ? allLeads.filter(r => r.data.stage === "newsletter" && !toPush.includes(r)) : []);
    const BATCH = 500;
    for (let i = 0; i < toPush.length; i += BATCH) {
      const batch = toPush.slice(i, i + BATCH).map(row => ({
        id: row.id,
        data: row.data,
        updated_at: new Date().toISOString(),
      }));
      await sb.from("leads").upsert(batch, { onConflict: "id" });
    }

    // Also update auto-pulled leads
    if (autoPulled > 0) {
      const pulledRows = allLeads.filter(r => r.data.stage === "newsletter" && !r.data.beehiiv_status);
      for (let i = 0; i < pulledRows.length; i += BATCH) {
        const batch = pulledRows.slice(i, i + BATCH).map(row => ({
          id: row.id,
          data: row.data,
          updated_at: new Date().toISOString(),
        }));
        await sb.from("leads").upsert(batch, { onConflict: "id" });
      }
    }

    // 9. Update drip log
    dripLog[today] = todayCount + pushed;
    dripLog[todayBrandsKey] = drippedBrands;
    // Clean old entries (keep 7 days)
    for (const key of Object.keys(dripLog)) {
      if (key.match(/^\d{4}-\d{2}-\d{2}$/) && key < new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]) {
        delete dripLog[key];
        delete dripLog[`brands_${key}`];
      }
    }
    await sb.from("team_settings").upsert(
      { id: "drip_log", data: dripLog, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    log.push(`Done: ${pushed} pushed, ${failed} failed`);
    return res.json({ status: "ok", pushed, failed, autoPulled, log });

  } catch (err) {
    log.push(`Error: ${err.message}`);
    return res.status(500).json({ error: err.message, log });
  }
};
