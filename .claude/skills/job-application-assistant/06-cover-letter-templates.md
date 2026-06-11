# Cover Letter Templates

The cover letter is built from `cover_letters/cover_template.tex` compiled with
**XeLaTeX**. It is PROSE, four paragraphs, one page. No bullet points. No
subheadings. Write `cover_letters/cover_<company>_<role>.tex` per role.

## Framework: Hook, Proof, Range, Close

1. HOOK. Open on a concrete thing that actually happened, chosen because it maps
   onto the role's core problem. Never "I am applying for", never an abstraction
   about the role. The adoption story (a built system becoming the default and
   replacing manual work) is the strongest hook for most roles.
2. PROOF. Speak to the role's central function in plain prose. Name the actual
   work. Show the all-in-one value, that he runs a thing and builds, documents,
   and measures it.
3. RANGE plus MOTIVATION. State the multi-country, multi-discipline path
   (Ghana, Egypt, Denmark) as range, never as apology for the degree. Then why
   this employer, honest and specific to their actual situation.
4. CLOSE. Location, availability, openness. Short. Based in the Copenhagen area,
   available to start now, ready to relocate for the right role.

## Voice rules (hard)

- Concrete grounded open, never intent or editorial about the role.
- No serial lists, no rhetorical tricolons. Max two items joined by "and". The
  only permitted three-part constructions are the country and discipline career
  arc and the standard location, availability, openness close.
- No negative to positive pivots, no "but" pivots, no "although X, I".
- No colons in body, no em dashes or hyphen separators.
- No self-promotional summary lines ("I would bring a combination of"). Let the
  work state the fit.
- No punchy fragments planted for drama.
- Honesty as a confidence move. "The model itself was the smallest part of it"
  reads as command of the work and redirects to the transferable part.
- Every claim survives an interview.

## Mechanics

- Match the language of the posting (Danish posting to Danish letter).
- Address a named person if the posting gives one, else "Dear Hiring Team".
- AI tooling references name the real tools (Claude Code, Codex, GitHub Copilot).
- The worked exemplar is the UNOPS letter baked into `cover_template.tex`. Reuse
  the structure and voice, swap the content per role.

## Layout verification (compile and read the PDF)

- Exactly 1 page, signature block included, never spilling to page 2.
- Bold renders (use the explicit fontspec bold command, verify visually).
- Prose only, no bullet lists.
- No colons in body, no em dashes.

If it spills to page 2, trim with relevance-weighted cutting. First cut
sentences that restate a point already made. Never reduce geometry or line
spacing, and never add bullets to save space.
