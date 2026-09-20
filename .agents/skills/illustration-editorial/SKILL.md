---
name: illustration-editorial
description: Write, revise, and audit digital-illustration lessons as readable, evidence-bound teaching journeys rather than AI-generated copy.
---

# Illustration editorial method

This skill is adapted from the `the-llm-editorial` workflow. It is for the
`115-digital-illustration` course and its college audience: students who can
use a browser and basic files but have not learned professional illustration
software or AI production workflows.

Keep this skill and internal audit records in English. Write student-facing
narrative in Taiwan Traditional Chinese. Keep code, identifiers, and code
comments in English.

## Start with the visible problem

- Open with a concrete object, visual mismatch, tool output, failed attempt, or
  classroom decision. Do not begin with an abstract definition when a student
  can first look at something.
- Keep one teaching spine in every lesson:

  `learner question → one visual hypothesis → one changed variable → output → selection reason → next experiment`

- Explain what changed between versions. A prompt or tool is not a cause by
  itself. Name the subject, action, composition, style property, use case, or
  constraint that changed and show the resulting output.
- Preserve failed outputs and the reason they failed. A polished result alone
  hides the learning path.

## Make every paragraph do one job

- Begin from an established object, action, person, or result. The next
  paragraph must answer a question raised by the previous paragraph, perform
  the operation the previous paragraph made necessary, or explain its
  consequence.
- Define a term before its first explanatory use. Give the term a familiar
  referent, its purpose, and its local meaning. A later glossary or card cannot
  repair a missing premise in the main reading order.
- Keep one worked case stable through observation, visual description, changed
  variable, output comparison, selection, and next experiment. Do not change
  the object, audience, chronology, or criterion without saying so.
- Distinguish an observed tool output, a constructed classroom example, and an
  illustrative number. Use a short natural cue such as `假設` when the example
  is constructed. Do not present an invented output as a measured result.
- Separate the co-teaching roles. The AI-tool line owns observation, prompts,
  trials, assets, rights, and delivery; the story-and-storyboard line owns
  scripts, storyboards, and camera language. Show how the two lines connect.
- A visual explanation must remain understandable in nearby prose. The image
  is evidence, not a replacement for the explanation.

## Two-paragraph window audit

Run this audit on every adjacent pair of learner-facing prose paragraphs in a
lesson under review. Each test input must contain exactly two paragraphs: the
upper paragraph and the paragraph immediately below it. Strip headings,
captions, sidebars, list labels, diagrams, later sections, and all other
article context before judging the pair. Never supply a definition, source,
intention, or later result from outside the pair.

Run two independent checks for every pair. The backward check must not receive
the forward check's reasoning or verdict.

1. **Forward check.** Show the upper paragraph first. Ask: “Given only this
   paragraph, what unresolved question, required premise, next visual
   operation, or consequence should the lower paragraph address?” Record that
   expectation before revealing the lower paragraph. Reveal only the lower
   paragraph and test whether it continues the expected operation. Fail when it
   changes subject without motivation, introduces a prerequisite too late, or
   jumps from an output to a conclusion the upper paragraph did not support.
2. **Backward check.** In a separate context, show the lower paragraph first.
   Ask it to enumerate every object, term, variable, output, actor, criterion,
   scope boundary, and causal link that the lower paragraph requires. Reveal
   only the upper paragraph and check whether it supplies every requirement.
   Fail when the lower paragraph needs a heading, card, later explanation, or
   unstated writer intention.

For every failure, record every field below:

```text
pair_location: <upper paragraph> -> <lower paragraph>
direction: forward | backward
expected_continuation_or_missing_premise: <specific question, operation, consequence, or prerequisite>
reader_consequence: <what the reader cannot infer, distinguish, or choose>
repair: <what to add, remove, reorder, or reconnect, and where>
source_boundary: <verified source, claim needing verification, illustrative-only boundary, or not applicable>
```

Repair the copy, then rerun the affected pairs. Do not repair a failure by
adding only `因此`, `接著`, or another transition word. Add the missing object,
operation, criterion, or reason. Local adjacency is necessary but not
sufficient: a pair can pass while the full lesson still contains a wrong
claim, a changed case, an inconsistent figure, or an unsupported rights claim.

## Ten-thousand-whys question pass

Before accepting a substantive lesson, run a bounded adversarial question pass.
The questioner asks; the parent verifies sources and edits. The questioner does
not rewrite the lesson or certify factual accuracy.

For each new term, prompt field, visual variable, tool result, selection rule,
rights claim, or causal transition, keep asking:

- Why is this variable needed?
- What does it receive and what does it change?
- Who is making the decision: student, tool, teacher, audience, or rights holder?
- What output should the student observe?
- Where does that output go next?
- What does the change cost in time, consistency, or rights risk?
- What does it not solve?

Stop only when the answer names a concrete object, input, operation, output,
scope, cost, remaining limit, or source boundary. Return findings as:

```text
question: <reader's next question>
missing_premise: <specific missing fact or operation>
reader_consequence: <what becomes guesswork>
insertion_point: <where the lesson should teach it>
source_or_boundary: <source to verify or illustrative-only boundary>
```

## Visual and rights checks

- Require a diagram or table when the reader must track three or more visual
  properties, an ordered workflow, a before/after state, or a comparison across
  candidates. Label the actual object, changed variable, output, and selection
  criterion. Show direction where sequence matters.
- Explain the figure in adjacent prose: where to start, what changed, what the
  reader should compare, and why one output is carried forward. Reject unlabeled
  decorative graphics.
- Treat `001–100` style references as an observation vocabulary, not a source
  file to copy. Describe line, shape, palette, material, space, composition,
  typography, and intended use with observable language.
- Keep free, trial, quota, one-time-credit, and paid tools separate. For
  time-sensitive tool facts, preserve the check date, source URL, quota,
  fallback, and rights note.
- Never describe a generated output as automatically commercial-safe. Do not
  imitate a living artist by name. Translate the request into original,
  observable constraints and check recognizable characters and compositions.

## Anti-AI copy pass

Read the copy once as a student and once as an editor. Remove:

- visible `ELI5` badges or labels; ELI5 is a method, not a heading;
- empty praise, slogans, and generic claims that a process is powerful,
  seamless, or inspiring;
- repeated “not only X but also Y” constructions, forced groups of three,
  synonym cycling, and tidy summary paragraphs that add no new decision;
- vague subjects such as “the system,” “people,” or “industry” when the actual
  student, tool, teacher, or audience can be named;
- prompt strings presented as magic spells, and conclusions not supported by an
  observed output or a cited source.

Vary sentence length, but keep technical cause and effect explicit. Prefer a
plain verb and a named actor. End when the student has the next experiment and
knows what evidence to keep.

## Review boundary and acceptance

The parent reads the full lesson, source records, data modules, diagrams, and
rights notes together. A formatter, typecheck, build, or static window checker
does not establish editorial acceptance. The final review reports:

- core visual question and one changed variable;
- prerequisite gaps and the local repair;
- forward and backward window pass count plus concrete failures;
- case, diagram, output, and rights consistency;
- target-reader, technical, and developmental-editor judgments;
- checks run, checks deferred, and the next owner.
