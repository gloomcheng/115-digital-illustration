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

## Teaching spine

Use this sequence for every lesson and lab:

```text
learner question → one visual hypothesis → one changed variable → outputs → selection reason → next experiment
```

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

- Use original illustrations and native SVG diagrams as evidence, not decoration.
- For each illustration, write one claim first and draw only the objects needed to prove it.
- The visual direction may use luminous sky and cloud layers, atmospheric perspective, blue/orange contrast, rain or light reflections, detailed distant scenery, and a cinematic youth mood; these are original art-direction constraints, not a named artist imitation.
- Keep the existing course palette: warm paper, medium blue ink, pale sky, sun yellow, and coral for contrast.
- Keep diagrams readable on narrow screens and provide meaningful `alt` text.
- Do not add visible copy only inside layout components. Keep visible course copy in data or page content modules.

## Verification

From the repository root:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run build
```

Before reporting a website change complete, verify:

- the official course name and `115` identity remain visible;
- all 18 supplied week topics remain unchanged in meaning;
- the co-teaching boundary is visible;
- every new route returns a page rather than a 404;
- diagrams render, have `alt` text, and do not depend on an external image host;
- the build output contains the new route;
- existing user work is preserved.

## Change boundary

Do not publish, create a remote repository, purchase credits, or send student data to a third-party tool unless the user explicitly requests that action. Keep the local repository independently buildable before proposing publication.
