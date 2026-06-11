// Self-contained CLI for Jobindex search and detail.
// Replaces the previous @bunli/core version whose ./commands/*.js files
// were never committed upstream. Uses the existing helpers.ts, so the
// fetch and HTML parsing logic is unchanged.

import {
  BASE_URL,
  htmlFetch,
  parseJobCards,
  parseHitCount,
  writeError,
  type JobCard,
} from "./helpers.js"

type Args = Record<string, string | boolean>

function parseArgs(argv: string[]): { cmd: string; rest: string[]; args: Args } {
  const args: Args = {}
  const rest: string[] = []
  const short: Record<string, string> = { q: "query" }
  let cmd = ""
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--")) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith("-")) { args[key] = next; i++ } else { args[key] = true }
    } else if (a.startsWith("-") && a.length === 2) {
      const key = short[a.slice(1)] ?? a.slice(1)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith("-")) { args[key] = next; i++ } else { args[key] = true }
    } else if (!cmd) {
      cmd = a
    } else {
      rest.push(a)
    }
  }
  return { cmd, rest, args }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/\s+/g, " ")
    .trim()
}

function printSearch(cards: JobCard[], total: number, format: string): void {
  if (format === "table") {
    const rows = cards.map((c) => [
      c.id,
      (c.title ?? "").slice(0, 52),
      (c.company ?? "").slice(0, 24),
      (c.location ?? "").slice(0, 18),
      c.date ?? "",
    ])
    const head = ["ID", "TITLE", "COMPANY", "LOCATION", "DATE"]
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
    const line = (r: string[]) => r.map((c, i) => c.padEnd(widths[i])).join("  ")
    console.log(line(head))
    console.log(widths.map((w) => "-".repeat(w)).join("  "))
    rows.forEach((r) => console.log(line(r)))
    console.log(`\n${cards.length} shown of ${total} total`)
  } else if (format === "plain") {
    for (const c of cards) {
      console.log(`${c.id}  ${c.title}  |  ${c.company ?? ""}  |  ${c.location ?? ""}  |  ${c.date ?? ""}`)
      console.log(`   ${c.url}`)
    }
  } else {
    console.log(JSON.stringify({ meta: { total, count: cards.length }, results: cards }, null, 2))
  }
}

// English -> Jobindex slug, so both `--category engineering` and the raw
// `--category ingenioer` work. Multi-segment slugs are fine too, e.g.
// `--category ingenioer/kemi` browses just the chemistry subcategory.
const CATEGORY_ALIASES: Record<string, string> = {
  engineering: "ingenioer",
  ingenioer: "ingenioer",
  it: "it",
  chemistry: "ingenioer/kemi", // chemistry sits under engineering on Jobindex
  kemi: "ingenioer/kemi",
  industry: "industri",
  industri: "industri",
  management: "ledelse",
  ledelse: "ledelse",
  teaching: "undervisning",
  undervisning: "undervisning",
}
// Default bundle for Joshua. ingenioer (Engineering and technology) already
// contains the kemi chemistry subcategory, so engineering plus IT is the broad
// net for his profile. Both slugs confirmed against Jobindex.
const DEFAULT_CATEGORIES = ["ingenioer", "it"]

// Fetch one results page (search or category), unescape the JSON-embedded
// cards, and parse them. Same parser for both URL shapes.
async function fetchPage(path: string): Promise<{ cards: JobCard[]; total: number }> {
  const raw = await htmlFetch(`${BASE_URL}${path}`)
  const html = raw
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\r/g, " ")
  const cards = parseJobCards(html).map((c) => ({ ...c, url: `${BASE_URL}/vis-job/${c.id}` }))
  return { cards, total: parseHitCount(html) }
}

async function runSearch(args: Args): Promise<void> {
  const q = typeof args.query === "string" ? args.query : ""
  const hasCategory = args.category !== undefined
  if (!q && !hasCategory) {
    writeError("provide --query or --category", "MISSING_REQUIRED")
    process.exit(1)
  }

  const pages = args.pages ? Math.max(1, Number(args.pages)) : 1
  const common = new URLSearchParams()
  if (args.jobage) common.set("jobage", String(args.jobage))
  if (args.sort) common.set("sort", String(args.sort))

  const seen = new Map<string, JobCard>()
  let total = 0

  const addPage = (cards: JobCard[]): number => {
    let added = 0
    for (const c of cards) if (!seen.has(c.id)) { seen.set(c.id, c); added++ }
    return added
  }

  if (hasCategory) {
    const raw = typeof args.category === "string" ? args.category : ""
    const slugs = (raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_CATEGORIES)
      .map((s) => CATEGORY_ALIASES[s.toLowerCase()] ?? s)
    const uniqueSlugs = [...new Set(slugs)]
    for (const slug of uniqueSlugs) {
      let slugCount = 0
      for (let page = 1; page <= pages; page++) {
        try {
          const p = new URLSearchParams(common)
          if (page > 1) p.set("page", String(page))
          const qs = p.toString()
          const { cards, total: t } = await fetchPage(`/jobsoegning/${slug}${qs ? `?${qs}` : ""}`)
          if (page === 1) total += t
          addPage(cards)
          slugCount += cards.length
          if (cards.length === 0) break // end of results, or unknown slug
        } catch (e: any) {
          console.error(`[category ${slug}] skipped (${e?.message ?? e})`)
          break
        }
      }
      if (slugCount > 0) console.error(`[category ${slug}] ${slugCount} cards`)
    }
  } else {
    for (let page = 1; page <= pages; page++) {
      const p = new URLSearchParams(common)
      p.set("q", q)
      if (page > 1) p.set("page", String(page))
      const { cards, total: t } = await fetchPage(`/jobsoegning?${p.toString()}`)
      if (page === 1) total = t
      addPage(cards)
      if (cards.length === 0) break
    }
  }

  let cards = [...seen.values()]
  if (args.limit) cards = cards.slice(0, Number(args.limit))
  const format = typeof args.format === "string" ? args.format : "json"
  printSearch(cards, total, format)
}

// Cut Jobindex's page chrome away from the actual ad. The ad body sits between
// the share/travel-time UI and the company/recommendation blocks, so we slice
// from the last lead-in marker to the first trailing marker, then scrub the
// residual button strings. Jobindex renders its chrome in the same language as
// the ad, so both the Danish and English label sets are listed.
function extractAdBody(fullText: string): string {
  let t = fullText
  let start = 0
  for (const m of ["Se rejsetid", "See travel time", "Via apps Facebook LinkedIn"]) {
    const i = t.indexOf(m)
    if (i >= 0) start = Math.max(start, i + m.length)
  }
  t = t.slice(start)
  let end = t.length
  for (const m of [
    "Om virksomheden",
    "About the company",
    "Anbefalede job",
    "Recommended jobs",
    "Vil du også følge",
    "Do you also want to follow",
    "Vil du vise interesse",
    "Do you want to show interest",
    "For jobsøgere Din side",
    "For jobseekers",
  ]) {
    const i = t.indexOf(m)
    if (i >= 0) end = Math.min(end, i)
  }
  return t
    .slice(0, end)
    .replace(/Gem job\s*Ans(ø|o)g\s*Se jobbet/gi, " ")
    .replace(/Save job\s*(?:Apply\s*)?View job(?:\s*View job)?/gi, " ")
    .replace(/Vis interesse\s*Fejlmeld annonce\s*Del annoncen\s*Kopier link/gi, " ")
    .replace(/Show interest\s*Report ad\s*Share ad\s*Copy link/gi, " ")
    .replace(/Indrykket:.*$/i, " ")
    .replace(/Published:.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Rough language flag so triage can weight Danish-operating roles. Counts
// distinctive Danish vs English function words plus the æøå tell.
function detectLang(text: string): "da" | "en" | "unknown" {
  let da = (text.match(/\b(og|til|med|som|vil|dig|vores|ansvar|erfaring|arbejde|søger)\b/gi) || []).length
  const en = (text.match(/\b(and|the|with|you|our|will|experience|work|seeking|join|team)\b/gi) || []).length
  if (/[æøå]/i.test(text)) da += 2
  if (da === 0 && en === 0) return "unknown"
  return da >= en ? "da" : "en"
}

async function runDetail(rest: string[], args: Args): Promise<void> {
  const idOrUrl = rest[0]
  if (!idOrUrl) { writeError("job id or url is required", "MISSING_REQUIRED"); process.exit(1) }
  const url = idOrUrl.startsWith("http") ? idOrUrl : `${BASE_URL}/vis-job/${idOrUrl}`
  const html = await htmlFetch(url)

  const titleMatch =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i)
  const title = titleMatch
    ? stripTags(titleMatch[1])
        .replace(/\s*\|\s*Jobindex.*$/i, "")
        .replace(/\s*-\s*\d+\s*$/i, "")
        .replace(/^\s*(?:Jobannonce|Job ad)\s*:\s*/i, "")
        .trim()
    : null

  const body = extractAdBody(stripTags(html))
  const language = detectLang(body)
  const employmentType = /Fastansættelse|Permanent|Fast stilling/i.test(body)
    ? "Fastansættelse"
    : /Midlertidig|Vikariat|Tidsbegrænset|Temporary|Maternity/i.test(body)
      ? "Midlertidig"
      : null
  const hours = /Fuldtid|Full.?time/i.test(body) ? "Fuldtid" : /Deltid|Part.?time/i.test(body) ? "Deltid" : null

  const format = typeof args.format === "string" ? args.format : "json"
  if (format === "plain") {
    console.log(
      `${title ?? ""}\n${url}` +
        `\nLanguage: ${language}   Type: ${employmentType ?? "?"}   Hours: ${hours ?? "?"}\n\n${body.slice(0, 8000)}`,
    )
  } else {
    console.log(
      JSON.stringify(
        { url, title, language, employmentType, hours, body: body.slice(0, 8000) },
        null,
        2,
      ),
    )
  }
}

async function main(): Promise<void> {
  const { cmd, rest, args } = parseArgs(process.argv.slice(2))
  try {
    if (cmd === "search") await runSearch(args)
    else if (cmd === "detail") await runDetail(rest, args)
    else {
      writeError(`Unknown command: ${cmd || "(none)"}. Use 'search' or 'detail'.`, "BAD_COMMAND")
      process.exit(1)
    }
  } catch (err: any) {
    writeError(err?.message ?? String(err), "ERROR")
    process.exit(1)
  }
}

main()
