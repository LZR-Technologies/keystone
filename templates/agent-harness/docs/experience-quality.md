# Experience quality (Layer C)

> A project can pass every test and every security check and still ship an interface that breaks on a
> phone, has no empty state, and returns errors no one understands -- which is not professional.
> Layer C makes experience quality part of the delivery. It does **not** design; it makes the project
> **answer** the questions that separate a usable interface from an amateur one, and it **audits** the
> answers. Beauty -- brand, art, a particular look -- is a separate design skill's job.

## The boundary that keeps it neutral

Keystone is white-label. Layer C enforces **universal properties** of a usable interface -- never a
specific taste. It checks that a visual system **exists** and is **consistent**; it never ships
**which** colors, fonts, spacing, or components a project must use. The visual-system slot is empty
(bring your own): in the web template it is `src/styles/globals.css` (neutral placeholder tokens,
marked "replace with your own") wired through `tailwind.config.ts`, so components inherit the
project's look the moment its tokens replace the placeholders.

## What ships today

- **The mandatory checklist** -- `.claude/rules/experience-quality.md`: before a screen is done it
  answers visual hierarchy, phone, the four states, understandable errors, contrast, touch targets,
  one pattern, and coherence with the spec. A UI-less service carries the rule and declares its own
  honest skip.
- **The four state components** (web template, `src/components/ui/`): loading, error, empty, and
  success -- each intentional, none left as a blank area, all drawing from the design tokens. The
  worked example (`ItemsPanel`) uses them, so the reference practices the rule.

- **The deterministic gates** (phase C2): structural accessibility at lint time (jsx-a11y), color
  contrast measured in a real browser (axe in the E2E suite, run by the project's CI), and an
  explicit mobile viewport. Each one a script can genuinely decide, each blocking. Touch-target size
  and "the four states present" were NOT faked as gates -- they are not reliably decidable
  statically, so they live in the checklist above and the reviewers below.
- **The reviewers** (phase C3) under `.claude/agents/`: `experience-reviewer`,
  `accessibility-reviewer`, and `ui-consistency-reviewer` -- they judge what the hard gates cannot
  (hierarchy, the four states, keyboard/screen-reader access, visual consistency), in the same shape
  as the Layer B reviewers. They recommend; they do not block on their own.

## Enforcement tiers (declared honestly)

- **Hard** where the truth is measurable (the C2 checks): a script decides, it blocks.
- **Judgment** where it is not -- hierarchy, coherence, "is it clear": the checklist rule and the C3
  reviewers, run in the open. Never sold as a 100% machine guarantee where the answer is judgment.
