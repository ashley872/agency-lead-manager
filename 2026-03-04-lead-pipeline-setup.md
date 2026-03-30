# Decision: Building an Agency Lead Management Pipeline

## Date: 2026-03-04
## Author: Ashley
## Category: Lead Generation / Operations

## Context
We have multiple folders of leads in various states — some new, some old, some cleaned, some with generic emails (support@, info@). Cold outreach is inefficient because of all the sorting, and moving leads to the newsletter is hard when we can't personalize.

## Decision
Building a DIY "Agency Clay" — a lead cleaning, scoring, and lookalike pipeline using Apollo API as the primary data source, with Make.com/Zapier for automation.

## Key Components
1. **Lead Cleaning** — consolidate, dedupe, filter generics, validate emails, detect stale contacts
2. **Lead Scoring** — ICP-based scoring system with tier segmentation (A/B/C/D/F)
3. **Lookalike Generation** — use traits from Tier A leads to build Apollo API searches
4. **Weekly Automation** — Monday pull → Tuesday score → Wed-Thu enrich → Friday outreach
5. **Newsletter Integration** — Tier C leads flow into newsletter, cold outreach includes newsletter CTA

## Next Steps
- [ ] Export and consolidate all existing lead folders
- [ ] Set up Apollo.io account and test API
- [ ] Build ICP scoring criteria specific to our niche
- [ ] Run first manual cleaning pass on existing leads
- [ ] Set up Make.com automation for weekly pulls

## See Also
- Full playbook: `insights/playbooks/playbook-agency-lead-management.md`

## Tags: #leads #pipeline #operations #decision
