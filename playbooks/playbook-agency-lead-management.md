# Playbook: Agency Lead Management System ("Agency Clay")

## Overview
A complete system for cleaning messy lead folders, scoring and segmenting contacts, building lookalike profiles, and automating new lead acquisition via Apollo API (and similar sources). Goal: always have a fresh pipeline of high-quality, personally-addressed leads for cold outreach and newsletter growth.

## The Problem
- Lead folders are a mix of new, old, cleaned, and uncleaned contacts
- Some contacts have left their companies (stale leads)
- Many have generic emails (support@, info@, hello@) — useless for cold outreach and newsletter personalization
- No systematic way to find *more* leads that look like your best ones
- Manual sorting is eating time that should go toward outreach

---

## Phase 1: Lead Cleaning & Hygiene

### Step 1: Consolidate All Lead Sources
Dump every lead list into a single master CSV with standardized columns:

```
company_name, contact_first, contact_last, email, phone, title, linkedin_url, source_file, date_added, website, industry, employee_count
```

**Action items:**
1. Export all lead folders into CSVs (Google Sheets, Airtable, or raw files)
2. Map each source's columns to the master schema above
3. Merge into one master file — tag each row with `source_file` so you know where it came from

### Step 2: Deduplicate
Remove duplicates using this priority hierarchy:
1. **Email exact match** — keep the most recent entry
2. **Company + Name match** — fuzzy match (catches "John Smith" at "Acme" appearing twice with different emails)
3. **Domain match** — flag when you have multiple contacts at the same company

### Step 3: Filter Out Generic Emails
Auto-flag and separate any email matching these patterns:
```
support@, info@, hello@, admin@, contact@, sales@, help@,
team@, office@, general@, enquiries@, mail@, noreply@,
no-reply@, billing@, accounts@, service@, customerservice@
```

**What to do with generic email leads:**
- Don't delete them — they still represent a company you want to reach
- Move them to a "needs personal email" queue
- Use Apollo/Hunter/Clearbit enrichment to find the actual decision-maker at that company (see Phase 2)

### Step 4: Validate Remaining Emails
Run all personal emails through a verification service:
- **Tools:** ZeroBounce, NeverBounce, MillionVerifier, or Reoon
- **Remove:** hard bounces, disposable emails, full inboxes
- **Flag:** catch-all domains (they accept everything but may not deliver)

### Step 5: Detect Stale Contacts (People Who've Left)
Check if contacts are still at the company listed:
- **Apollo API** — lookup by email, check if company matches
- **LinkedIn Sales Navigator** — cross-reference current employment
- **Hunter.io** — domain search to see current employees

**For stale contacts:**
- Find their replacement at the same company (the role still exists, just a new person)
- Optionally track where the person went (they might be a lead at their new company too)

### Step 6: Enrich Remaining Records
For every validated lead, fill in missing fields:
- **Apollo.io** — company size, revenue, industry, tech stack, title
- **Clearbit** — company data, social profiles
- **LinkedIn** — current title verification

---

## Phase 2: Lead Scoring & Segmentation

### Build Your Ideal Customer Profile (ICP)

Before you can build lookalikes, define what your best leads look like. Analyze your existing customers/wins.

#### ICP Scoring Criteria

| Signal | Score | Notes |
|--------|-------|-------|
| **Title match** (decision-maker) | +30 | CEO, CMO, Head of Growth, DTC Director, Ecom Manager |
| **Title match** (influencer) | +15 | Marketing Manager, Social Media Manager, Brand Manager |
| **Company size** (sweet spot) | +20 | Define your range, e.g. 10-200 employees |
| **Industry match** | +20 | E-commerce, CPG, beauty, wellness, DTC brands |
| **Has TikTok presence** | +15 | Already on TikTok = warmer lead |
| **Revenue range** (sweet spot) | +10 | e.g. $1M-$50M ARR |
| **Tech stack signals** | +10 | Shopify, WooCommerce, specific tools |
| **Personal email** (not generic) | +10 | Direct contact = higher deliverability |
| **Recent funding** | +5 | Have budget to spend |
| **Generic email only** | -20 | Can't personalize outreach |
| **No LinkedIn profile found** | -10 | Harder to validate/research |
| **Stale contact (left company)** | -50 | Needs replacement lookup |

#### Segment Leads Into Tiers

| Tier | Score Range | Action |
|------|-------------|--------|
| **A — Hot** | 80+ | Priority outreach, personalized messaging, research the company |
| **B — Warm** | 50-79 | Standard cold email sequence |
| **C — Nurture** | 30-49 | Add to newsletter, low-touch drip |
| **D — Enrich First** | 0-29 | Missing data, generic emails — enrich before outreach |
| **F — Dead** | Below 0 | Stale contacts, invalid emails — archive |

---

## Phase 3: Lookalike Lead Generation

### The Logic: "Find More Like My Best Ones"

Take your Tier A and Tier B leads and extract their common traits to build a lookalike filter.

### Step 1: Analyze Your Top Leads
From your scored Tier A leads, pull out:
- **Top 5 job titles** (what titles keep showing up?)
- **Top 5 industries** (what sectors are they in?)
- **Company size range** (min/max employees)
- **Revenue range** (if available)
- **Geographic clusters** (any location patterns?)
- **Tech stack commonalities** (all on Shopify? Using Klaviyo?)
- **Common keywords** in company descriptions

### Step 2: Build Apollo API Lookalike Searches

Use the Apollo People Search API to pull matching leads:

```
Apollo API — People Search
POST https://api.apollo.io/api/v1/mixed_people/search

Key filters to set:
{
  "person_titles": ["CEO", "CMO", "Head of Growth", "Ecommerce Director"],
  "person_not_titles": ["Intern", "Assistant", "Student"],
  "organization_industry_tag_ids": ["{your_industry_ids}"],
  "organization_num_employees_ranges": ["11,50", "51,200"],
  "person_locations": ["United States"],
  "organization_latest_funding_stage_cd": ["series_a", "series_b"],
  "contact_email_status": ["verified"],
  "page": 1,
  "per_page": 100
}
```

**Important Apollo API notes:**
- Free tier: 10,000 credits/month (each enriched contact = 1 credit)
- Rate limits apply — batch requests, don't hammer the API
- Always filter for `contact_email_status: "verified"` to avoid bounces
- Use `organization_industry_tag_ids` rather than freetext for accuracy

### Step 3: Build Multiple Lookalike Segments
Don't run one massive search. Build 3-5 targeted segments:

| Segment | Filter Logic | Volume Goal |
|---------|-------------|-------------|
| **Mirror Match** | Exact ICP: same titles + industries + size | 50/week |
| **Adjacent Industry** | Same titles, related industries | 30/week |
| **Upmarket** | Same profile but larger companies | 20/week |
| **Emerging** | Recently funded companies in your space | 20/week |
| **TikTok Active** | Companies with TikTok presence + right profile | 30/week |

### Step 4: Deduplicate Against Existing Leads
Before adding any new leads from Apollo:
1. Check email against your master list
2. Check company domain against your master list
3. Only add net-new contacts

---

## Phase 4: Automation & Recurring Pipeline

### Weekly Lead Machine

```
MONDAY
├── Apollo API pulls new leads from 5 lookalike segments
├── Auto-deduplicate against master list
└── Raw leads land in "New Leads" queue

TUESDAY
├── Auto-score all new leads (ICP scoring criteria)
├── Auto-filter generic emails → "Needs Enrichment" queue
└── Tier A/B leads → "Ready for Outreach" queue

WEDNESDAY-THURSDAY
├── Enrichment pass on "Needs Enrichment" queue
│   ├── Find personal emails via Hunter.io / Apollo
│   └── Re-score enriched leads
└── Newly enriched Tier A/B → "Ready for Outreach"

FRIDAY
├── Review "Ready for Outreach" queue
├── Tier A → Personalized outreach sequence
├── Tier B → Standard cold email sequence
└── Tier C → Add to newsletter drip list

ONGOING
├── Bounce monitoring → update lead status
├── Reply tracking → move to CRM/deal pipeline
└── Monthly: re-validate stale leads, refresh Apollo searches
```

### Tool Stack Options

| Function | Budget Option | Mid Option | Premium Option |
|----------|--------------|------------|----------------|
| **Lead Database** | Google Sheets | Airtable | HubSpot/Salesforce |
| **Lead Sourcing** | Apollo.io (free tier) | Apollo.io (paid) | Apollo + ZoomInfo |
| **Email Finder** | Hunter.io (free tier) | Hunter.io (paid) | Clearbit + Hunter |
| **Email Verification** | MillionVerifier | ZeroBounce | NeverBounce |
| **Enrichment** | Apollo (built-in) | Clearbit | Clay.com |
| **Cold Email** | GMass / Lemlist | Instantly.ai | Smartlead + Instantly |
| **Automation** | Google Apps Script | Make.com / Zapier | n8n (self-hosted) |
| **Newsletter** | Mailchimp (free) | ConvertKit | Beehiiv / Klaviyo |

### Make.com / Zapier Automation Blueprints

**Automation 1: Weekly Apollo Pull**
```
Trigger: Schedule (every Monday 6am)
→ Apollo API: Search people (Segment 1-5)
→ Google Sheets / Airtable: Add new rows
→ Filter: Remove if email exists in master list
→ Score: Apply ICP scoring formula
→ Route:
   → Score 80+ → Tag "Tier A"
   → Score 50-79 → Tag "Tier B"
   → Score 30-49 → Tag "Tier C"
   → Generic email → Tag "Needs Enrichment"
```

**Automation 2: Enrichment Pipeline**
```
Trigger: New row tagged "Needs Enrichment"
→ Hunter.io: Domain search (find people at company)
→ If personal email found:
   → Update lead record → Re-score → Move to appropriate tier
→ If no personal email found:
   → LinkedIn profile lookup → Flag for manual research
```

**Automation 3: Outreach Routing**
```
Trigger: Lead tagged "Ready for Outreach"
→ If Tier A: Add to personalized sequence (Instantly.ai / Smartlead)
→ If Tier B: Add to standard cold email sequence
→ If Tier C: Add to newsletter list (Beehiiv / ConvertKit)
```

---

## Phase 5: Newsletter List Building From Cleaned Leads

### The Newsletter Funnel

**Path 1: Direct Add (Tier C leads)**
- Not ready for cold outreach but are in your target market
- Add to newsletter with proper opt-in compliance (CAN-SPAM / GDPR)
- Send value-first content, not sales pitches
- Track engagement — if they open/click consistently, upgrade to Tier B

**Path 2: Cold Outreach → Newsletter**
- In your cold email sequence, offer the newsletter as a soft CTA
- "PS - We send weekly TikTok Shop tips to 2,000+ sellers. Want in? [link]"
- People who don't buy often subscribe — keeps them in your ecosystem

### Newsletter Segmentation From Lead Data

| Segment | Based On | Content They Get |
|---------|----------|------------------|
| **New sellers** | Company has no TikTok Shop yet | Getting started content |
| **Active sellers** | Already on TikTok Shop | Growth and optimization tips |
| **Agency leads** | Title suggests agency/consultant | Case studies, white-label info |
| **Enterprise** | 200+ employees | Enterprise features, managed service |

---

## Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| New leads sourced/week | 100-150 | Weekly |
| Lead-to-valid rate (after cleaning) | >70% | Weekly |
| Generic email resolution rate | >40% | Monthly |
| Stale contact detection rate | Track trend | Monthly |
| Cold email reply rate | >3% | Per campaign |
| Newsletter signup rate from outreach | >5% | Monthly |
| Tier A leads generated/month | 200+ | Monthly |
| Cost per qualified lead | <$0.50 | Monthly |

---

## Quick Start: Do This Today

1. **Export all your lead folders** into CSVs
2. **Merge into one master sheet** with the standardized columns from Step 1
3. **Run the generic email filter** — separate support@/info@ leads immediately
4. **Sign up for Apollo.io** (free tier gives you 10K credits/month)
5. **Enrich your top 100 leads** — fill in missing titles, company data
6. **Score them** using the ICP table above
7. **Set up one Apollo saved search** matching your Tier A profile
8. **Run it weekly** — even manually at first, automate later

## Tags: #leads #pipeline #outreach #automation #apollo #agency #playbook
