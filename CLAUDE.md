# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Agency Lead Manager ("Agency Clay") — a browser-based lead management tool for agency cold outreach. Import CSV lead lists, auto-clean them, score against an ICP, assign tiers, and manage a visual pipeline. No backend, no build step.

## Architecture

**Single-file app:** Everything lives in `index.html` — HTML structure, CSS styles, and all JavaScript in one `<script>` block (~1600 lines total).

**Data layer:** localStorage under key `agencyclay_leads`. All leads stored as a JSON array of objects. No server, no API, no database.

**Core data flow:**
1. CSV import → `parseCSV()` → column auto-mapping via `COLUMN_MAP` → `importBuffer`
2. Preview modal → `confirmImport()` → leads array + localStorage
3. `runAutoClean()` — email type detection, deduplication (by email), junk removal, ICP scoring, tier assignment, pipeline stage routing
4. Render loop: `render()` → `renderStats()` + `renderSidebarCounts()` + `renderLeads()` (table) or `renderPipeline()` (kanban)

**Key business logic locations:**
- Generic email detection: `isGenericEmail()` / `GENERIC_PREFIXES` (~line 793)
- ICP scoring: `scoreLead()` (~line 839) — weights for title match, industry, company size, email type, lead freshness
- Tier assignment: `getTier()` (~line 881) — A (60+), B (40-59), C (20-39), D (0-19), F (<0)
- Pipeline stage routing: `getStageFromTier()` (~line 889)
- CSV column mapping: `COLUMN_MAP` (~line 970) — maps common header variations to standard fields

**Lead schema fields:** `id`, `company_name`, `contact_first`, `contact_last`, `email`, `phone`, `title`, `linkedin_url`, `website`, `industry`, `employee_count`, `source_file`, `date_added`, `email_type`, `score`, `tier`, `stage`, `notes`

## Design System

Dark theme using CSS custom properties. Brand colors: accent red `#fe2c55`, cyan `#25f4ee`. Tier colors: green (A), cyan (B), yellow (C), orange (D), red (F).

## Supporting Docs

- `playbooks/playbook-agency-lead-management.md` — Full strategy: ICP scoring criteria, Apollo API lookalike searches, automation blueprints, tool stack options
- `playbooks/playbook-existing-list-cleanup.md` — Step-by-step guide for triaging messy lead lists (audit → import → filter → validate → enrich → score)
- `2026-03-04-lead-pipeline-setup.md` — Decision log and next steps

## Development

Open `index.html` in a browser. No build, no dependencies. To test changes, refresh the page. Data persists in localStorage between refreshes.
