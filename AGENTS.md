<!-- shared-agent-skills: generated from ~/.agents/AGENTS.md by agent-sync; edit there -->
Global rules: use the already-loaded tool global instructions. If absent, read
`/Users/gloomcheng/.agents/AGENTS.md` before work. Do not reload them when already present.
<!-- /shared-agent-skills -->

# AGENTS.md instructions for `115-digital-illustration`

## Course identity

- Official course name: `數位插畫與動態繪本創作`。
- Academic year: `115`；semester: `115-1`。
- Repository shorthand: `115-digital-illustration`。
- `AI + IP` describes the internal teaching spine. It is not the course title or repository name.
- This is a co-taught course. AI tools, prompting, style observation, rapid trial-and-error, asset organization, and IP packaging belong to the AI tool line. Story scripts, storyboards, and camera language belong to the co-instructor line.

## Audience and language

- Write student-facing narrative in Traditional Chinese.
- Keep code, identifiers, and code comments in English.
- Target a college student who can use a browser and basic files but has not learned professional illustration software or AI production workflows.
- Open with a concrete visual problem, a tool result, or a failed experiment. Do not begin with an abstract definition when an observation can come first.

## Flexible pacing

- The 18 weeks are a planned spine, not a schedule the site enforces. In class the lecture
  decides how far to get: a dense theory week can run short, and a demo week can overrun.
- A lesson page is written to be read later on its own, so it may carry more material than
  one session covers. Mark the natural stopping points inside a page instead of truncating
  the page.
- Never claim a week is complete, or renumber later weeks, because a class ran long or short.
  Absorb the difference in the following session.
- If the delivered course order genuinely diverges from this file, update `src/data/weeks.ts`
  and the notes in `reference/` in the same change, and say so in the commit.

## Commercial spine

Students arrive with almost no financial or commercial literacy, and a tool can now
produce competent images in seconds. The course therefore has to answer, every week, a
question the student did not know to ask: **who is paying for this, and why them?**

- Treat this as a direction, not a fixed formula. The specific judgment criterion may change as
  the course, the tooling, and the market change. Do not hard-code one slogan into this file
  and reuse it for eighteen weeks; a stale criterion teaches a stale reflex.
- Every option a student chooses between carries at least two readings. A choice that looks
  obvious can still turn on something the student has not been asked to consider: who buys it,
  what it costs to change, what it prevents someone else from doing. Find the second reading and
  make the student state it.
- Ground commercial claims in real, citable data rather than in intuition. When a lesson
  asserts what the market pays, how many people use a tool, or what a role is worth, carry the
  source and a check date. A number without a source is an invention, and students are entitled to
  know which sentences in the material are measured and which are constructed.
- Constructed classroom cases are allowed, and are sometimes the clearest way to teach a
  mechanism. Label them as constructed. Never let a constructed number sit next to a measured one
  without the student being able to tell which is which.
- Commercial reasoning is a spine, not a chapter. Do not postpone it to the proposal weeks; by
  then a student has already spent most of the course building habits they will have to unlearn.
- Cost is part of the answer. Say what the option costs to produce, to revise, and to license, and
  what the student gives up to get it.
- Keep the free-tool and rights boundary intact under this spine. A tool that forbids commercial
  use changes what the work can become, and that limit belongs at the point the tool is
  introduced, not at submission.
- Prefer capability over a slogan. A student who can define a problem, choose among options, and
  defend the choice is more employable than a student who has memorised a phrase about
  monetisation. When a new tool or market shifts the balance, update the direction and say why.

## Teaching spine

A lesson is a path, not a form. The student should end it able to answer a question they could not
answer before. The shape below is a useful default, not a template to fill in:

```text
learner question → one visual hypothesis → one changed variable → outputs → selection reason → next experiment
```

- Deviate from it when the material calls for it. A week that needs three rounds of comparison
  instead of one, or that ends on an unresolved question rather than a next experiment, is still
  correct. Do not trim a real decision to fit the sequence.
- The parts that are not negotiable: the student makes a decision, and the lesson shows what that
  decision cost. A page that only presents options without ever asking the student to choose one has
  taught nothing.
- Do not teach prompt strings as magic spells.
- Explain why each prompt field exists: subject, action, composition, style grammar, use case, and constraints.
- Treat the internal 001–100 style library as a vocabulary for observation. Do not copy its source files into this repository or publish raw retained prompts without checking the relevant license.
- A style description must name observable properties: line, shape, palette, material, space, composition, typography, and intended use.
- A successful image is not automatically an IP. Require recognition, repeatability, extension, audience, and rights evidence.
- Preserve failed outputs and the reason they failed. A class that only shows polished images hides the learning.

## Free-tool and rights boundary

- The main path must work without a paid API, GPU, or professional illustration subscription.
- Free, trial, quota, one-time credit, and paid resources must be labeled separately.
- Record `checkedAt`, source URL, quota condition, fallback tool, and rights/provenance note for time-sensitive tool information.
- Never describe a free output as automatically commercial-safe. Students must retain the provider terms and source record used for their submission.
- Do not upload private student information or unlicensed third-party artwork to a tool.
- Do not imitate a living artist by name. Translate an aesthetic request into original, observable constraints and verify that generated assets do not copy recognizable characters or compositions.

## Visual system

- Decide per artifact what the image has to do, then use that artifact.

| Artifact | Use |
| --- | --- |
| Historical works, documents, specimens, primary sources | The real work. Students must look at the actual object the lesson is about. |
| Concepts, workflows, before/after states, comparisons across candidates | Native SVG diagrams, drawn to prove one stated claim. |

- Historical images are in copyright even when the depicted work is in the public domain: the photograph has its own rights holder. Check the license on each file before use, record the license and source URL next to the image, and never hotlink an external host. Download permitted files into `public/illustrations/` so the repository stays independently buildable and no request leaves the student's browser.
- A lesson page combines both: the real work carries the evidence, an SVG diagram explains the mechanism the work demonstrates.
- When no freely licensed image of a work can be found, describe the specific observable features in prose and say plainly that no image is shown. Do not substitute a stand-in and present it as the work.
- For each original illustration, write one claim first and draw only the objects needed to prove it.
- The visual direction may use luminous sky and cloud layers, atmospheric perspective, blue/orange contrast, rain or light reflections, detailed distant scenery, and a cinematic youth mood; these are original art-direction constraints, not a named artist imitation.
- Keep the existing course palette: warm paper, medium blue ink, pale sky, sun yellow, and coral for contrast.
- Keep diagrams readable on narrow screens and provide meaningful `alt` text.
- Do not add visible copy only inside layout components. Keep visible course copy in data or page content modules.

## Verification

From the repository root:

```bash
bun install --frozen-lockfile
bun run quality
```

`quality` runs the reading-window audit, the AI-prose guard, typecheck, and build. It proves
mechanical properties only. Everything below is a judgment no command can make, and it is where a
change actually fails or passes.

`check:reading-windows` covers the dedicated week pages listed in `scripts/reading-window-harness.mjs`.
Add a page there once its reading path is marked with `data-reading`.

Before reporting a change complete, check by hand:

- the official course name and `115` identity remain visible;
- all 18 supplied week topics remain unchanged in meaning;
- the co-teaching boundary is visible;
- every new route returns a page rather than a 404;
- diagrams render, have `alt` text, and do not depend on an external image host;
- existing user work is preserved.

For claims about the real world — dates, prices, adoption rates, what a role pays, what a market
does — a footnote resolving to a live source is the minimum, not the goal. The source has to
actually *support* the claim, and the student must be able to tell a measured number from a
constructed classroom example. Record what was checked and when; note the sources that were
rejected and why. `reference/source-audit-wNN.md` is where that reasoning goes, one file per
week rather than a glob.

## Change boundary

Do not publish, create a remote repository, purchase credits, or send student data to a third-party tool unless the user explicitly requests that action. Keep the local repository independently buildable before proposing publication.
