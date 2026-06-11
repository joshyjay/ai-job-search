# /apply - Drafter-Reviewer Job Application Workflow

You are orchestrating a two-agent job application workflow. The job posting is
provided below as `$ARGUMENTS` (either a URL or pasted text).

Follow these steps **exactly in order**. Do not skip steps.

**Token-efficiency rules:**
- Never re-Read a file already in your context from an earlier step.
- When dispatching the reviewer, pass draft content inline in the prompt.
- Run the full verification checklist once, at the end (Step 6).
- Step 5 (compile and inspect PDFs) is mandatory. LaTeX page breaks are
  unpredictable and `.tex` that looks fine often produces broken PDFs.

---

## Step 0: Parse Input

- If `$ARGUMENTS` is a URL, use WebFetch to retrieve the posting.
- If pasted text, use it directly.
- Extract company, role title, department, location, and language (Danish or
  English). Store for the workflow.

---

## Step 1: DRAFTER - Evaluate Fit

Read `.claude/skills/job-application-assistant/04-job-evaluation.md` and
`.claude/skills/job-application-assistant/01-candidate-profile.md`.

Evaluate the posting against the profile using the requirements-based framework
in `04-job-evaluation.md`. If `salary_data.json` is configured, run
`python salary_lookup.py "<Company>" --json` (add `--city` if known) and include
the benchmark. Present the verdict (strong fit / credible stretch / weak fit /
not worth applying), what they are really hiring for, requirement-by-requirement
matches, strongest evidence, gaps, and CV strategy.

On a strong domain match, proceed to draft without waiting. On a weak or
credible stretch, ask the user before drafting. If the user says no, stop.

---

## Step 2: DRAFTER - Draft CV + Cover Letter

You already have `01` and `04` in context. Read only:
- `.claude/skills/job-application-assistant/03-writing-style.md`
- `.claude/skills/job-application-assistant/05-cv-templates.md`
- `.claude/skills/job-application-assistant/06-cover-letter-templates.md`
- `cv/main_template.tex` and `cover_letters/cover_template.tex` as structural
  references (or the most recent existing `cv/main_*.tex` and
  `cover_letters/cover_*.tex`).

### CV (`cv/main_<company>.tex`)
- English. Built with `muratcan_cv.cls`, compiled with **XeLaTeX**.
- Follow the muratcan format from `05-cv-templates.md`.
- Rewrite the profile and reorder/reframe bullets to the role using the right
  positioning lead. Keep ML and image processing visible.
- 2 pages for substantive roles, 1 page for junior or software roles.

### Cover Letter (`cover_letters/cover_<company>_<role>.tex`)
- Match the language of the posting.
- Follow the Hook, Proof, Range, Close framework from `06-cover-letter-templates.md`.
  Prose, four paragraphs, one page. No bullets, no subheadings.
- Use `cover_template.tex` as the base.
- Address a named person if available, else "Dear Hiring Team".
- AI tooling references name the real tools (Claude Code, Codex, GitHub Copilot).

Write both to disk. Keep the exact text in working memory for Steps 3 and 4.

---

## Step 3: REVIEWER - Research & Critique

Spawn a `general-purpose` reviewer agent with a fresh context. Pass the drafts
inline. Scope its reads to content critique:
- `01-candidate-profile.md`
- `02-behavioral-profile.md` (check the letter's voice matches the natural
  register: confident and grounded, never apologetic or solo-hero)
- `03-writing-style.md`
- `04-job-evaluation.md`

The reviewer researches the company (WebSearch, WebFetch), then returns:
- Part A, a JSON array of concrete `old_string`/`new_string` edits.
- Part B, narrative suggestions grouped as missed keywords, company-specific
  angles, action-oriented reframing, and tone and style issues checked against
  `03` and `02`.

CRITICAL: all suggestions grounded in real profile data. Never fabricate. If a
requirement is a gap, say so and frame adjacent experience instead. The reviewer
does not run the verification checklist.

---

## Step 4: DRAFTER - Revise

Apply Part A edits directly with Edit (do not re-read the drafts). Apply Part B
with judgment: add missed keywords where they fit (prefer experience bullets),
weave verified company angles into the cover letter, rewrite passive phrasing,
and apply the style rules (no colons, no em dashes, no tricolons, no self
promotion). Verify every company claim via WebFetch/WebSearch before including
it. Skip anything that would fabricate experience.

---

## Step 5: DRAFTER - Compile & Inspect PDFs (MANDATORY)

### 5a. Compile (both XeLaTeX)

```bash
cd cv && xelatex -interaction=nonstopmode main_<company>.tex
cd ../cover_letters && xelatex -interaction=nonstopmode cover_<company>_<role>.tex
```

Both documents use **XeLaTeX**. `muratcan_cv.cls` and the cover template both
require fontspec. Do not use pdflatex or lualatex. If a compile fails, fix and
recompile until clean.

### 5b. Inspect layout

Rasterize and Read both PDFs (`pdftoppm -png -r 150 <file>.pdf preview`):

CV:
- [ ] 2 pages for substantive roles, 1 page for junior or software roles
- [ ] No `\datedexperience` entry title orphaned at a page bottom with its
      bullets on the next page (most common failure)
- [ ] No section heading isolated at the top of a page with 1-2 lines below
- [ ] **Bold renders.** `\textbf` can silently fail. If bold is missing, switch
      to the explicit fontspec bold command and recompile
- [ ] All text black, links navy, no bare URLs

Cover letter:
- [ ] Exactly 1 page, signature block included
- [ ] Prose only, no bullet lists
- [ ] Bold renders, no colons in body, no em dashes

### 5c. Iterate

- Orphaned CV entry title: reorder or trim bullets so the title and its first
  bullets stay together. Never shrink the font or geometry.
- CV spills past its page budget: cut with relevance-weighted cutting (see
  `05-cv-templates.md`). Lowest relevance-and-uniqueness line goes first,
  regardless of section.
- Cover letter spills to 2 pages: trim restated sentences first, then a sentence
  that does not hit posting keywords. Never add bullets, never reduce spacing.
- Bold missing: use `{\fontspec{DejaVuSans-Bold.ttf}[Path=/usr/share/fonts/truetype/dejavu/]...}`.

### 5d. Clean up

Delete `.aux`, `.log`, `.out` after the final clean compile. Keep `.tex` and `.pdf`.

---

## Step 6: Present Final Output

Run the full verification checklist from `CLAUDE.md` once here. Re-read both
files to confirm final state. Report pass/fail. Summarize 3-5 key tailoring
decisions, list the files created, and tell the user both are ready for review.
