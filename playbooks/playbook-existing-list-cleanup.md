# Playbook: Cleaning Your Existing Lead Lists (Day 1 Triage)

## Overview
You've got folders of leads — some new, some old, some cleaned, some not, some with people who've left, some with generic emails. This is the practical, hands-on guide for turning that mess into a usable pipeline. Do this BEFORE setting up the automated system.

**Time estimate:** 2-4 hours for initial triage, then ongoing enrichment over the following week.

---

## Step 1: Audit What You Actually Have (30 mins)

Before touching any data, inventory your lead sources:

### Create a Source Audit Sheet

| Source File/Folder | Approx Count | Date Range | Already Cleaned? | Notes |
|--------------------|-------------|------------|-------------------|-------|
| *e.g. leads-jan-export.csv* | *500* | *Jan 2025* | *No* | *From Apollo pull* |
| *e.g. event-leads-2024/* | *200* | *Oct 2024* | *Partial* | *Trade show scans* |
| *e.g. old-outreach-list.xlsx* | *1,200* | *2023-2024* | *Yes* | *Already emailed some* |

**Why this matters:** You need to know what you're working with before merging. Some lists may be mostly junk. Some may have already been contacted (you don't want to cold email someone you already pitched).

### Flag These During Audit
- Which lists have already been used for outreach? (tag as "previously contacted")
- Which lists are oldest? (highest chance of stale contacts)
- Which lists came from paid sources vs organic? (quality indicator)
- Which lists are missing key fields like name or title?

---

## Step 2: Build the Master Sheet (30 mins)

### Standard Column Schema
Create one Google Sheet or Airtable base with these columns:

```
| Column              | Required? | Notes                                    |
|---------------------|-----------|------------------------------------------|
| company_name        | Yes       |                                          |
| contact_first       | Yes       | If only full name, split it              |
| contact_last        | Yes       |                                          |
| email               | Yes       |                                          |
| phone               | No        | Nice to have                             |
| title               | Yes       | Critical for scoring                     |
| linkedin_url        | No        | Helps with validation                    |
| website             | Yes       | Used for deduplication + enrichment      |
| industry            | No        | Will enrich later if missing             |
| employee_count      | No        | Will enrich later if missing             |
| source_file         | Yes       | Which list did this come from?           |
| date_added          | Yes       | When was this lead originally captured?  |
| previously_contacted| Yes       | Yes/No — have we already emailed them?   |
| cleanup_status      | Yes       | raw / validated / enriched / dead        |
| email_type          | Auto      | personal / generic / unknown             |
| lead_tier           | Auto      | A / B / C / D / F (filled after scoring) |
| notes               | No        | Any context from original list           |
```

### Import Process
1. Open each source file
2. Map its columns to the schema above (some will need renaming)
3. Copy data into the master sheet
4. Fill in `source_file` and `date_added` for each batch
5. Mark `previously_contacted` based on your audit
6. Set `cleanup_status` = "raw" for everything

**Tip:** Don't try to clean while importing. Just get everything into one place first.

---

## Step 3: Instant Wins — Automated Filtering (30 mins)

These filters can be run immediately with zero cost, no tools needed.

### Filter 1: Remove Obvious Junk
Delete or archive rows where:
- Email is blank
- Company name is blank AND email is blank
- Email is clearly fake (test@test.com, asdf@asdf.com, etc.)
- Duplicate rows (exact email match — keep the most recent)

### Filter 2: Tag Generic Emails
In Google Sheets, use this formula to auto-tag generic emails:

```
=IF(OR(
  REGEXMATCH(LOWER(E2), "^(support|info|hello|admin|contact|sales|help|team|office|general|enquiries|mail|noreply|no-reply|billing|accounts|service|customerservice|hr|marketing|press|media|webmaster|postmaster)@"),
  REGEXMATCH(LOWER(E2), "^(feedback|careers|jobs|legal|compliance|privacy|abuse|security|operations|ops|orders|returns|shipping|warehouse|reception|frontdesk|studio|bookings|reservations|events|partnerships|pr|communications|editorial|news|subscribe|unsubscribe)@")
), "generic", "personal")
```

Put this in the `email_type` column. This instantly separates your list into two pools.

### Filter 3: Tag by Age
Flag leads by how old they are:

| Age | Tag | Risk Level |
|-----|-----|------------|
| 0-3 months | Fresh | Low — likely still valid |
| 3-6 months | Recent | Medium — worth validating |
| 6-12 months | Aging | High — many may have moved |
| 12+ months | Stale | Very High — expect 30-50% to be dead |

### After Filtering You'll Have:
```
Total leads: [X]
├── Personal emails (fresh): [X] ← Your best leads, ready for validation
├── Personal emails (aging/stale): [X] ← Need validation before use
├── Generic emails: [X] ← Need enrichment to find real contacts
├── Junk/removed: [X] ← Archived
└── Previously contacted: [X] ← Handle separately
```

---

## Step 4: Validate Personal Emails (1-2 hours, some cost)

### Batch 1: Fresh Personal Emails (Priority)
Take all personal emails from the last 6 months and run them through a verification service.

**Cheapest options:**
- **MillionVerifier** — ~$37 for 10,000 verifications
- **Reoon** — ~$2 for 1,000 verifications (great for small batches)
- **ZeroBounce** — 100 free/month, then $0.008 each

**What you'll get back:**
| Result | Action |
|--------|--------|
| Valid | Keep — ready for outreach |
| Invalid | Remove — email doesn't exist |
| Catch-all | Keep but flag — domain accepts all, delivery uncertain |
| Disposable | Remove — temporary email |
| Unknown | Keep but deprioritize — couldn't verify |

### Batch 2: Aging/Stale Personal Emails
Same process, but expect a higher invalid rate. Budget for ~30-40% of these to come back invalid.

### Batch 3: Previously Contacted
Verify these too, but keep them in a separate segment. You'll handle outreach differently (re-engagement vs cold).

---

## Step 5: Enrich Generic Email Leads (Ongoing over 1 week)

These are leads where you have a company but only a generic email. The company is still a valid target — you just need to find the right person.

### Option A: Apollo.io (Recommended — Free Tier)
1. Sign up for Apollo (10,000 credits/month free)
2. For each generic-email lead, search by company domain
3. Apollo returns employees with verified personal emails
4. Look for decision-maker titles (CEO, CMO, Head of Marketing, etc.)
5. Replace the generic email lead with the enriched personal contact

### Option B: Hunter.io
1. Use Domain Search — enter the company domain
2. Returns all email addresses found for that domain
3. Filter for relevant titles
4. 25 free searches/month, then $49/month for 500

### Option C: LinkedIn + Manual
For high-value leads where tools don't return results:
1. Search the company on LinkedIn
2. Find the right contact by title
3. Use Apollo/Hunter to find their email
4. Takes longer but higher accuracy for important targets

### Enrichment Priority
Don't enrich all generic leads equally. Prioritize:
1. Companies you recognize or know are in your ICP
2. Companies with signals you care about (right industry, right size)
3. Larger companies (more likely to have budget)
4. Skip very small or irrelevant companies

---

## Step 6: Handle Previously Contacted Leads

These need special treatment — you can't just dump them back into a cold sequence.

### Segment by Previous Outcome

| Previous Outcome | Action |
|-----------------|--------|
| **Replied positively** (but didn't convert) | Re-engage sequence — reference previous conversation |
| **Replied negatively** (not interested) | Respect the no — add to newsletter only (if they opted in) |
| **No reply** | Can re-enter cold sequence with new angle/offer |
| **Bounced** | Re-validate email, find new contact if they've left |
| **Unsubscribed** | Do NOT contact again — CAN-SPAM compliance |

### For No-Reply Leads
- Wait at least 90 days since last outreach before re-contacting
- Use a completely different angle/subject line
- Don't reference the old email ("I emailed you before..." feels desperate)
- Treat it as a fresh cold email with new value proposition

---

## Step 7: Score Everything and Assign Tiers

Once cleaning and enrichment are done, run every lead through the ICP scoring system from the main playbook (`playbook-agency-lead-management.md`).

### Quick Scoring for Existing Lists
If you don't have full data on every lead, use this simplified scoring:

| Has This? | Points |
|-----------|--------|
| Personal verified email | +20 |
| Decision-maker title | +25 |
| Company in your target industry | +20 |
| Company in your size range | +15 |
| Fresh lead (< 6 months) | +10 |
| Has LinkedIn URL | +5 |
| Has phone number | +5 |
| Generic email only | -15 |
| Stale (12+ months, unverified) | -20 |
| Previously contacted, no reply | -10 |

### Then Tier and Route

| Tier | Score | What Happens |
|------|-------|-------------|
| **A** | 60+ | Personalized outreach this week |
| **B** | 40-59 | Standard cold sequence |
| **C** | 20-39 | Newsletter drip |
| **D** | 0-19 | Park — enrich more before doing anything |
| **F** | <0 | Archive — don't waste time |

---

## Step 8: Set Up Your Clean Ongoing Structure

After the initial cleanup, organize your master sheet with these views/tabs:

### Active Views
- **Outreach Queue** — Tier A + B, validated, not previously contacted
- **Re-engagement Queue** — Previously contacted no-replies (90+ days old)
- **Enrichment Queue** — Generic emails and incomplete records
- **Newsletter Queue** — Tier C leads ready for drip
- **Archive** — Dead leads, unsubscribes, do-not-contact

### Weekly Maintenance
- **Monday:** New Apollo leads come in (automated later, manual for now)
- **Wednesday:** Enrichment batch on generic email queue
- **Friday:** Move newly enriched leads to appropriate queues
- **Monthly:** Re-validate aging leads, archive newly dead ones

---

## Realistic Expectations

Based on typical lead list health, here's what to expect from your cleanup:

| Starting With | Expect After Cleanup |
|--------------|---------------------|
| 1,000 raw leads | ~600-700 usable contacts |
| Of those usable | ~200 Tier A/B (outreach-ready) |
| | ~250 Tier C (newsletter) |
| | ~150 Tier D (need more enrichment) |
| Generic emails | ~40% can be resolved to personal emails |
| Stale leads (12+ months) | ~30-40% will be invalid/moved on |

**The key insight:** You probably have fewer *usable* leads than you think, but the ones that survive the cleanup are genuinely valuable. Quality over quantity — 200 well-scored, verified Tier A leads will outperform 1,000 unfiltered ones every time.

---

## Checklist: Your First Week

### Day 1
- [ ] Audit all lead sources (Step 1)
- [ ] Build master sheet with standard columns (Step 2)
- [ ] Import all leads into master sheet
- [ ] Run automated filters — junk, generics, age tags (Step 3)

### Day 2
- [ ] Run email verification on fresh personal emails (Step 4, Batch 1)
- [ ] Sign up for Apollo.io free account
- [ ] Start enriching top 50 generic-email leads (Step 5)

### Day 3
- [ ] Run email verification on aging/stale leads (Step 4, Batch 2)
- [ ] Continue enrichment on generic email queue
- [ ] Segment previously contacted leads (Step 6)

### Day 4
- [ ] Score all cleaned leads (Step 7)
- [ ] Assign tiers
- [ ] Set up master sheet views (Step 8)

### Day 5
- [ ] Start outreach on Tier A leads
- [ ] Add Tier C to newsletter
- [ ] Set up first Apollo lookalike search for next week's fresh leads

## Tags: #leads #cleanup #existing-lists #triage #playbook
