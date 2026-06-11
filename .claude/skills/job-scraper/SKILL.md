# Job Scraper

**name:** job-scraper
**description:** Finds new Nordic job postings matching your profile across multiple sources. Pulls Danish postings through the structured Jobindex CLI and everything else (LinkedIn, finn.no, Swedish boards, direct company sites) via web search. Deduplicates across runs. Triggers on: job scrape, find jobs, search jobs, new jobs, job search, scrape jobs, /scrape
**allowed-tools:** Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Agent, AskUserQuestion

---

## Scope

This is a **Nordic** search, not a Danish one: Denmark primary, Sweden and Norway
for the right role. It is multi-source. Danish postings come primarily from the
Jobindex CLI (a structured category pull, best Danish recall). Everything else,
LinkedIn across DK/SE/NO, finn.no for Norway, Swedish boards, and direct company
sites, comes through web search. All jobs are jobs. Jobindex is one source, not
the whole search, and running it never narrows the search to Denmark.

## How It Works

Pulls postings from several sources, deduplicates against previously seen jobs and
the application tracker, and presents new matches with a quick fit signal. The
scraper only gathers. Full fit judgement happens in the job-application-assistant
skill, reading the descriptions this skill fetches.

## Invocation

Triggered by things like "find new jobs", "scrape for jobs", "any new positions?",
"/scrape". Optional arguments: a focus area ("/scrape data") or "broad" to widen
the category and source set.

---

## Execution Steps

### Step 0: Load State

1. Read `job_scraper/seen_jobs.json` (create if missing, start `{"seen": {}}`).
2. Read `job_search_tracker.csv` for already-applied companies and roles.
3. Read `search-queries.md` (this directory) for the web-search strategy used in
   Step 2.

### Step 1: Pull Danish postings via the Jobindex CLI (primary)

Use the structured category browse rather than keyword queries. Titles are
deceptive, so pull broadly by Jobindex's own field categories and let the
evaluation read each description to judge fit.

Run from the repo root:
```
bun run .agents/skills/jobindex-search/cli/src/cli.ts search \
  --category ingenioer,it --jobage 3 --pages 5 --sort date --format json
```

- `--category ingenioer,it` is the default net (engineering, which includes the
  kemi chemistry subcategory, plus IT, which covers ML, data, software, AI).
  Aliases: engineering, it, chemistry, industry, management, teaching. Multi-segment
  slugs work, e.g. `ingenioer/kemi`.
- `--jobage` small (2 to 4) and `--pages` modest keep the pile tractable. A
  three-day five-page pull returns roughly 190 deduped postings.
- Results dedupe by id within the run. Each card has id, title, company, location,
  date, url (`https://www.jobindex.dk/vis-job/{id}`).

For promising cards, get the clean full text and language:
```
bun run .agents/skills/jobindex-search/cli/src/cli.ts detail <id> --format json
```
Returns url, title, `language` (da | en | unknown), employmentType, hours, and a
chrome-free `body` in either language.

The other CLI boards in this repo (jobnet, jobbank, jobdanmark) are broken
upstream and non-functional. Do not call them.

### Step 2: Search other sources via WebSearch (preserve Nordic breadth)

Run the web-search queries from `search-queries.md` to cover what the Jobindex CLI
does not: LinkedIn jobs (Denmark, Sweden, Norway), finn.no for Norway, Swedish
boards, karriere.dk, and direct company career pages. Target the last 14 days.

For each promising result, WebFetch the page and extract title, company, location,
posting date, URL, brief key requirements, and deadline if listed. Pre-filter on
titles and snippets before fetching so you are not fetching every hit.

### Step 3: Quick Fit Assessment

Rapid signal only, not the full `04-job-evaluation.md` pass:
- **High**: role directly involves the candidate's core skills.
- **Medium**: role is adjacent to the candidate's experience.
- **Low**: role needs significant skills the candidate lacks.

### Step 4: Deduplicate & Store

Skip any job whose url or company+title key is already in `seen_jobs.json`, and any
company+role already in `job_search_tracker.csv`. Add ALL fetched jobs (new and
skipped) to `seen_jobs.json`:
```json
{
  "seen": {
    "<url_or_company_title_key>": {
      "title": "...", "company": "...", "url": "...", "source": "jobindex/linkedin/...",
      "first_seen": "YYYY-MM-DD", "fit": "high/medium/low", "status": "new/skipped/evaluated"
    }
  }
}
```
Only present jobs not already in the seen list or tracker.

### Step 5: Present Results

Table sorted by fit (high first):
```
## New Job Matches - YYYY-MM-DD

Found X new positions (Y high, Z medium, W low). Sources: Jobindex, LinkedIn, ...

| # | Fit | Title | Company | Location | Source | Deadline | URL |
|---|-----|-------|---------|----------|--------|----------|-----|

### High-Match Highlights
For each high-match job, 2 to 3 bullets: why it matches, key requirements to check,
any red flags (including language, see below).
```
Then ask: "Want me to evaluate any of these in detail? Give me the number(s)."
If the user picks a number, invoke the **job-application-assistant** skill (fit
evaluation first, then CV and cover letter if approved).

### Step 6: Update Tracker (Optional)

If the user decides to apply, add a row to `job_search_tracker.csv`.

---

## Language handling

The Jobindex `language` field and the ad's own language are a **signal, not a
verdict**. A Danish-language ad at an international engineering or software firm
often still runs in English day to day. The real test is whether the role itself
operates in Danish, public-sector citizen or clinician facing work, Danish-customer
sales, municipal roles. Those are where Danish is genuinely required and, while the
candidate is still learning Danish, are blockers. Do not auto-reject Danish ads.
Read the body and flag a language blocker only when the work runs in Danish daily.
International employers where English is the working language stay in play.

---

## Important Rules

1. **Never fabricate postings.** Only present jobs returned by the Jobindex CLI or
   actual WebSearch/WebFetch results.
2. **Respect deduplication.** Always check `seen_jobs.json` AND
   `job_search_tracker.csv` before presenting.
3. **Nordic geography, not single-area.** Denmark is primary, but Sweden and Norway
   are in scope for the right role. Do NOT skip a job just because it needs
   relocation. Note relocation as a factor for the candidate to weigh, not a reason
   to drop it. Only drop roles clearly outside the Nordics.
4. **Permanent full time only.** Drop temporary, vikar, maternity-cover, and student
   roles (Jobindex `employmentType: Midlertidig` is a tell).
5. **Only open positions.** Skip expired or closed postings.
6. **Be efficient.** Pre-filter on titles and snippets before WebFetch. Use the
   Jobindex CLI for the Danish bulk rather than many individual web searches.
7. **Parallelise** web searches where possible to speed the non-Jobindex phase.
