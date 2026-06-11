# Agentic Job Application System

An end to end job search and application pipeline that runs on
[Claude Code](https://www.anthropic.com/claude-code). It discovers roles,
evaluates fit against a structured profile, drafts a tailored CV and cover
letter through a two agent drafter and reviewer loop, and compiles both to
print ready PDFs with layout verification.

Forked from [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search)
(MIT) and rebuilt around my own document toolchain, writing framework, and fit
methodology.

## What it does

The system runs as a set of Claude Code commands and skills.

1. **Discover.** CLI scrapers pull and rank openings from Danish job boards
   (Jobindex, Jobnet, Jobbank, Jobdanmark), deduplicated and scored against the
   profile. The source layer is built to extend to further feeds, including the
   ReliefWeb API for UN and humanitarian roles.
2. **Evaluate.** Each posting is scored with a requirements based fit framework
   that classifies a role as strong fit, credible stretch, weak fit, or not
   worth applying, and names the right positioning lead for it rather than a
   single generic identity.
3. **Draft and review.** A drafter agent writes a tailored CV and cover letter.
   A separate reviewer agent then researches the company and critiques the
   drafts against the profile, the writing rules, and the candidate's natural
   register, returning structured edits the drafter applies.
4. **Compile and verify.** Both documents are compiled with XeLaTeX and visually
   inspected, iterating until the CV holds its page budget and the cover letter
   sits on a single page with no orphaned entries or broken layout.

## Writing framework

Cover letters follow a fixed four part structure, **Hook, Proof, Range,
Close**, written as prose rather than bullet points, with a hard set of voice
rules (no filler, no self promotional summary lines, no manufactured drama).
The aim is an application that reads as confident and grounded, which is what
Nordic hiring rewards. The full guide lives in
`.claude/skills/job-application-assistant/03-writing-style.md`.

## Document toolchain

- **CV.** A custom LaTeX class (`cv/muratcan_cv.cls`) compiled with XeLaTeX,
  ATS safe single line skill rows, black text with navy links only.
- **Cover letter.** A self contained XeLaTeX template
  (`cover_letters/cover_template.tex`) with the worked exemplar baked in.

## Layout

```
.claude/
  commands/        apply, setup, and helper commands
  skills/
    job-application-assistant/   profile, writing style, fit framework, templates, interview prep
    job-scraper/                 search query config
.agents/skills/    Danish job board scraper CLIs
cv/                LaTeX CV class and template
cover_letters/     LaTeX cover letter template
tools/             salary benchmarking
documents/         personal inputs (gitignored)
```

## Setup

Requires Claude Code, a TeX distribution with XeLaTeX, and Bun for the scraper
CLIs. Copy the three `.example` files to their unsuffixed names and fill in your
own details.

```bash
cp CLAUDE.example.md CLAUDE.md
cp .claude/skills/job-application-assistant/01-candidate-profile.example.md \
   .claude/skills/job-application-assistant/01-candidate-profile.md
cp .claude/skills/job-application-assistant/04-job-evaluation.example.md \
   .claude/skills/job-application-assistant/04-job-evaluation.md
```

Then run `/apply <job url or pasted text>` in Claude Code.

## Privacy

The filled in profile and fit framework (`CLAUDE.md`, `01-candidate-profile.md`,
`04-job-evaluation.md`) are gitignored and never committed. Generated CVs, cover
letters, the application tracker, and everything under `documents/` are
gitignored as well. The repository ships only the system and the `.example`
templates.

## Credits

Forked from [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search),
MIT licensed. The Danish scraper CLIs and the drafter and reviewer command
structure originate there. The document toolchain, writing framework, and fit
methodology in this fork are my own.

## License

MIT. See `LICENSE`.
