# CV Templates

The CV is built with `cv/muratcan_cv.cls` compiled with **XeLaTeX**. Start from
`cv/main_template.tex` and write `cv/main_<company>.tex` per role. All colours
black, links navy only.

## Toolchain rules (do not deviate)

- Compile with XeLaTeX, not pdflatex or lualatex. The class needs fontspec.
- Font is DejaVu Sans by explicit path
  (`/usr/share/fonts/truetype/dejavu/`). On a machine with Noto Sans installed,
  Noto is acceptable, otherwise keep DejaVu.
- `\textbf` can silently fail in some setups. If bold does not render, use the
  explicit fontspec bold command and verify visually with `pdftoppm -png -r 150`.
- Skills are single `\mbox` lines per category so they survive ATS parsing. Keep
  each line short enough to fit one line or it overflows the margin.

## Length

- Two pages for substantive roles.
- One page for junior or software developer roles.
- Where the degree is the primary filter, move Education above Experience.

## Section order (reorder per role)

Profile, Experience, Skills, Education, Publications, Languages. Reorder so the
strongest evidence for THIS role leads. Lead with the positioning identity from
`04-job-evaluation.md`.

## Tailoring process

1. Read the posting, identify the top five hiring signals.
2. Rewrite the Profile for the role (one short paragraph, the right positioning
   lead, no duplication of facts that appear in Experience).
3. Reorder and trim bullets to the most relevant. Keep ownership and adoption
   signals. The strongest is the camera systems becoming standard infrastructure
   and replacing manual inspection.
4. Weave the employer's own keywords in naturally.
5. Keep ML and image processing visible regardless of the lead.

## Bullet standard

Action, then technical method, then result, then relevance to the target role.
Ownership verbs. Single line where possible.
- Weak: Used machine learning for barnacle height prediction.
- Better: Built and validated an XGBoost regression model on morphometric and
  spatial features to estimate barnacle height, supporting drag assessment.

## Hard style rules

No colons in body text or headings. No em dashes or hyphen separators. No
negative to positive pivots. No tricolons. No generic filler. English Native,
Danish Actively learning. No phone number. No gaps section in a submission.
Publications grouped peer reviewed then submitted and in preparation.

## Layout verification (compile and read the PDF)

- 2 pages substantive, 1 page junior or software.
- No `\datedexperience` entry title orphaned at a page bottom with its bullets
  spilling to the next page. Reorder or trim to fix, never shrink the font.
- Bold renders (verify visually).
- All text black, links navy behind words.

## Relevance-weighted cutting

When content overflows the page budget, score each candidate line by relevance
to this posting's keywords, uniqueness (is it duplicated), and narrative load
(does the cover letter depend on it). Cut the lowest total score first,
regardless of section. An older bullet that hits posting keywords outranks a
recent bullet that does not.
