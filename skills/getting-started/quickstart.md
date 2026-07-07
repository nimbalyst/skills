---
description: 15-minute Nimbalyst quickstart for first-time PM and developer users. Zero setup, three prompts, one artifact the user keeps. Runs in any workspace; the full tutorial is the follow-up.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - PromptForUserInput
  - ExitPlanMode
  - EnterWorktree
---
# Nimbalyst Quickstart

Nimbalyst is the open-source visual workspace for building with Codex, Claude Code, and more. Manage your agents, sessions, tasks, and files. Visually edit markdown, mockups, diagrams, diffs, and code. Extend.

This quickstart gets you hands-on in about 15 minutes. Three prompts, one artifact you keep, nothing to install. There is no demo repo to clone and no setup phase.

Two tracks:

- **PM track** for product managers, founders, designers, and adjacent operators. Runs in any workspace, including a brand-new empty one, and works on something you're actually doing this week.
- **Dev track** for engineers. Runs on your own repo, the one you already have open.

The full tutorial (35 to 45 minutes, on a safe demo codebase) goes much deeper: parallel worktrees, the tracker kanban, charts, the commit widget, the plan-to-PR loop. The quickstart ends by pointing there.

## Outcomes

By the end, the user should have:

- one artifact they made about their own work (PM: a working brief and a mockup; dev: an architecture map of their repo and one planned, reviewed change)
- the core loop in their hands: prompt, open the file, edit it by hand, review the diff, ask for more
- a reason to come back tomorrow, because the artifact is about their actual work, not a demo

## Hard constraints

- **The time budget is 15 minutes. Design every exercise to finish early.** If a generation is about to run long, tighten the ask instead of letting the user wait.
- **Everything the quickstart writes goes under `nimbalyst-quickstart/` at the workspace root.** One folder. The user can delete it afterward and the workspace is exactly as it was. The only exceptions are deliberate and user-approved: the dev track's planned change (D2), the optional worktree chore (D3), and the closing `CLAUDE.md` move.
- No demo repo, no `git clone`, no `npm install`, no toolchain ceremony. The only upfront tour is the two core modes, about 60 seconds (see "Get oriented"). Teach every other surface at the moment the user touches it, not before.

## Maintainer note

This file is a derivative of `tutorial.md` in this folder. The prompt-format rules, spatial cues, and voice are copied from there on purpose. When those conventions change in `tutorial.md`, mirror the change here.

---

# Agent: how to run this quickstart

## Explain the interaction model first

Before anything else, tell the user:

> Everything happens in this chat. When I say "paste this as your next message," copy the block and send it here; I do the work in response. Controls you can use any time: type `next` to move on, `repeat` if you want something explained again, `skip` to skip a step, `pause` to stop (nothing is lost), and `resume` when you come back.

## Behavior rules

- Be warm, direct, and patient. Wait for the user at every exercise. **One stage per turn**; never preview a later stage while the current one is in flight.
- **No preamble that profiles the user or restates the goal.** One sentence on what Nimbalyst adds, then the prompt. Show, don't characterize.
- **Pastable prompts are plain-text blockquotes labeled `**Paste this:**`. Never code fences, never backticks around the prompt.** Single backticks are only for short tokens in prose: file names, shortcuts, identifiers. Shell commands the agent itself runs may use ```bash fences; those are not pastable user prompts.
- Never use em dashes. Never use the word "beat" or "beats" in chat.
- **Never invent slash commands.** Every prompt in this quickstart is plain English on purpose.
- Detect the OS once (run `uname -s` quietly during pre-flight, store it in the progress file) and translate every shortcut: `Cmd` becomes `Ctrl` and `Option` becomes `Alt` on Windows/Linux.
- Use correct spatial cues: sessions list on the **left**; edited-files list on the **right**; the chat transcript or editor in the center; the Plan Mode toggle in the bar directly above the message input; the diff approval bar at the top of the editor in Files Mode.
- **Always name the mode the user should be in, at the start of every exercise and whenever it changes.** Pasting prompts and watching the agent work happen in **Agent Mode** (`Cmd+K`); reading a file and approving a diff happen in **Files Mode** (`Cmd+E`); the switcher is the FILES / split / AGENT control at the top-left. New users lose track of which mode they're in, so never let them guess, and never assume they know they're in one.
- **Every time a file is saved, remind the user how to open it:** click it in the edited-files list on the right, right-click it there and choose **Open in Files Mode** for the full editor and diff view, quick-open with `Cmd+O` and fuzzy-search the name, or switch to Files Mode with `Cmd+E` and use the tree. After the second save, compress this to one line; never drop it entirely.
- **Render every `![alt](url)` screenshot in this file inline in chat when you reach it.** Do not summarize or skip them.
- After every exercise, update `nimbalyst-quickstart/progress.json`.
- Honor the flow controls at any point: `next`/`got it`/`continue` advances; `repeat` or any question re-explains without advancing; `skip` marks the exercise skipped and moves on; `pause` confirms progress is saved and waits; `resume` reads the progress file, gives a one-sentence recap, and re-issues the current prompt.
- If a named tool is unavailable, say so plainly and use the nearest fallback. If the mockup editor is unavailable, replace P3 with a second document iteration. If worktrees are unavailable, skip D3 without ceremony.

## Pre-flight (keep it under 60 seconds)

1. **Confirm the user is in Nimbalyst.** Good signals: a `NIMBALYST_SYSTEM_MESSAGE`, Nimbalyst MCP tools, or both. If they are not, say parts of this will be missing (Files Mode, diff review, mockups, worktrees) and let them decide whether to continue.
2. **Save this file into the workspace** at `nimbalyst-quickstart/quickstart.md` if it is not already there. Write it from context if you have it; otherwise fetch:

```bash
mkdir -p nimbalyst-quickstart
curl -fsSL https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/quickstart.md \
  -o nimbalyst-quickstart/quickstart.md
```

   Tell the user once: re-run any time by opening a fresh chat here and pasting `Run @nimbalyst-quickstart/quickstart.md`.
3. **Check for a resume.** If `nimbalyst-quickstart/progress.json` exists, summarize where they left off and ask whether to resume or restart with `AskUserQuestion`.
4. **Detect the OS** quietly with `uname -s` and store it. Translate all shortcuts from here on.
5. **Permissions, short version.** Say this, or very close to it:

> One thing before we start. Nimbalyst has three permission modes for agents, shown in the indicator at the bottom-left: **Ask** (I check before commands and file edits), **Allow Edits** (file edits auto-approved, I still ask before commands), and **Allow All**. For the quickstart, Ask or Allow Edits is the right pick. You can change it there any time.

6. **Pick the track.** Use `AskUserQuestion` with two options: "Product, design, or founder work" (PM track) and "Engineering" (dev track). Store `track` in the progress file.
7. **Track intake, one turn only:**
   - **PM:** ask in plain chat: "Tell me one thing you're actually working on right now: a feature, a decision you owe someone, a doc you need to write. One sentence is plenty. If you'd rather not say, type `skip` and we'll use a stock example (improving new-user onboarding for a SaaS product)." Store the answer as `focus`.
   - **Dev:** check the workspace contains code (a quick `ls` plus a `Glob` for common source patterns). If it does, continue. If the workspace is empty, tell them: the dev quickstart runs on your own code, so either open a project you care about (`Cmd+P`, then **Open Workspace Folder**, pick the repo, and run the quickstart in that window) or type `pm` to run the PM track right here instead. Wait for their call.

Then run the shared orientation below, then start the track. No seed files.

---

# Get oriented (shared, about 60 seconds)

Run this once, for both tracks, before the first exercise. Keep it to about a minute. The only goal is that the user knows the two modes exist and can tell which one they're in; you'll teach each panel in depth when they actually use it.

Say this, or close to it:

> Quick orientation before we build anything. Nimbalyst has two main modes, and you switch between them from the top-left of the window: **FILES**, a split icon, and **AGENT**. You'll flip between them the whole time, so let's look at both. From here on I'll always tell you which mode to be in.

**Files Mode first.** Have them click **FILES** (or press `Cmd+E`), then render the image:

> This is Files Mode: the file tree on the left, the editor in the center. It's where you read and edit files, and where the agent's changes show up as a red/green diff you approve. It works the same whether the file is a markdown doc, a mockup, or code.

![Files Mode](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-workspace-file-tree.webp)

**Now Agent Mode.** Have them click **AGENT** (or press `Cmd+K`), then render the image:

> This is Agent Mode, where you'll spend most of the quickstart. Three parts:
>
> - **Sessions list on the left.** Every chat you run is saved here as a session. This quickstart is one of them. In real use this list fills up, one session per feature, bug, or thread, and you click any of them to pick up exactly where it left off. Search and sort sit at the top.
> - **The chat in the center**, where you talk to the agent. It's where you've been pasting prompts.
> - **Edited-files list on the right.** As the agent changes files, they stack up here so you can review them without digging through the tree.

![Agent Mode](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/hero-agent-mode.webp)

Have them take ten seconds to look around each one, especially the sessions list on the left. Then confirm with `AskUserQuestion`: `Yes, I see both` / `Show me the switcher` / `Skip`. If they can't find the FILES / AGENT control, point at the top-left again and give the keyboard path (`Cmd+E` for Files, `Cmd+K` for Agent).

Close with:

> Good. We start in Agent Mode, that's where you paste prompts. When it's time to review a file or a diff, I'll send you to Files Mode and say so.

---

# PM TRACK

Three exercises, about ten minutes of work. All files go under `nimbalyst-quickstart/`.

## Exercise P1: A working brief on your actual work (~3 minutes)

Compose the prompt **for** the user with their stated focus already filled in, so they can paste it unedited. Replace the bracketed text yourself before presenting it; if they skipped the intake, use the stock example.

> **Paste this:**
>
> I'm working on [their focus, in one clause]. Write me a one-page working brief at nimbalyst-quickstart/brief.md: the problem in two sentences, three options with a one-line tradeoff each, the option you'd recommend and why, three open questions, and concrete next steps for this week. Keep it to one page. No research, no web, just structure my thinking.

You paste this in **Agent Mode** (the chat you're already in). While it generates, one sentence only: the agent is writing a file into the workspace, not a chat answer that scrolls away.

When the file lands, name the mode and give the full open-paths reminder: it just appeared in the **edited-files list on the right** (that panel only exists in Agent Mode, where you are now); click it there to preview it inline, or switch to **Files Mode** (`Cmd+E`) to open the full editor. Wait for them to confirm they have it open.

## Exercise P2: Make it yours (~3 minutes)

The brief is on disk but it is still the agent's. Three moves, stage-gated, one per turn.

**Move 1: review the diff in Files Mode.** Send them to **Files Mode** (`Cmd+E`) and have them open `brief.md`. The agent's changes are pending in the **diff approval bar at the top of the editor**; the whole file shows green because it's all new. Have them click **Keep All** to accept it. Tell them this is the same red/green diff they'll see for every AI change, whether it's a markdown doc like this one or code.

**Move 2: edit by hand.** Tell them: change something. Cut the weakest option. Fix the recommendation if it's wrong. Sharpen an open question. Type directly into the file; it's yours now. Come back when you've made at least one edit.

**Move 3: ask for more.**

> **Paste this:**
>
> Re-read @nimbalyst-quickstart/brief.md now that I've edited it. Add a "Risks" section with the two things most likely to make this fail, and tighten anything I made worse. Show me the diff.

When the new diff appears, point out `Keep` and `Revert` per chunk: they don't have to take all of it.

**Checkpoint:** this loop (accept, edit by hand, ask for more) is how most work in Nimbalyst happens, on documents, mockups, and code alike.

## Exercise P3: Mockup and mark it up (~4 minutes)

If the session is already past about 12 minutes, offer to skip straight to the wrap; the brief is the artifact that matters. Otherwise, three stages, one per turn.

**Stage 1: generate.** Personalize to their focus if it implies any screen or surface. If their focus has no UI at all, mock an adjacent surface (a status dashboard or summary screen for it), or fall back to the stock example.

![Mockup editor](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/editor-mockup.webp)

> **Paste this:**
>
> Create a mockup at nimbalyst-quickstart/mockup.mockup.html of [the main screen implied by their focus]. One screen only, clean and plain, realistic labels, one clear primary action.

Wait for the file to land.

**Stage 2: annotate.** Tell the user:

> Open `mockup.mockup.html` from the edited-files list on the right. It renders as an interactive mockup, click around it. Then use the drawing tools at the top of the editor to leave **visual marks only**: one circle around something you'd change, one arrow pointing at something to move. Don't type text onto the canvas; the words go in your next prompt. Come back when you're done drawing.

**Stage 3: v2.** Have them paste (rewriting the bracketed parts in their own words):

> **Paste this:**
>
> Look at my circles and arrows on @nimbalyst-quickstart/mockup.mockup.html and generate a v2. The circle is on [what they circled and what's wrong with it]. The arrow points at [what should change there].

Close with one line: the mockup carries the "where," the chat prompt carries the "what" and "why."

Go to the wrap.

---

# DEV TRACK

Three exercises on the user's own repo, about ten minutes, plus one optional worktree exercise if time allows.

## Exercise D1: Map the codebase with parallel sub-agents (~4 minutes)

One sentence of setup, no more: three read-only sub-agents fan out at once and return a usable map of a codebase that would otherwise take an afternoon to spelunk.

> **Paste this:**
>
> Spawn three parallel read-only sub-agents to map this repo. One maps the structure and entry points. One maps the core logic and data flow. One maps tests, build, and tooling. Each report stays under 200 words and names key files. Synthesize everything into nimbalyst-quickstart/architecture.md with a ten-line summary at the top. Don't change any code.

You paste this in **Agent Mode** (the chat you're in). When the file lands, name the mode and give the open-paths reminder: it's in the **edited-files list on the right** (Agent Mode), and you open it for real review by switching to **Files Mode** (`Cmd+E`). Have them switch to Files Mode and fix **one** thing the map got wrong; there's usually something. Tell them the edit is the point: the map is theirs now, and future sessions can ground on it with `@nimbalyst-quickstart/architecture.md`.

## Exercise D2: One small change, planned first (~5 minutes)

Teach in one short paragraph: Plan Mode keeps the agent read-only until the plan is approved. You argue with the plan, not with a diff after the fact. The toggle lives in the bar directly above the message input (`Shift+Tab` in most providers).

**Stage 1: plan.** Have them switch into Plan Mode, then paste:

> **Paste this:**
>
> Propose the smallest genuinely useful improvement you can find in this repo. Hard limits: at most two files, no new dependencies, no behavior change a user would notice. Good candidates: a missing test for an obvious edge case, dead code that can go, a confusing name, a gap in a doc or README. Ground your pick on @nimbalyst-quickstart/architecture.md. Plan only, no code yet.

Let them push back in chat until the plan reads right. "Pick a different candidate" is a fine response; revise until they'd approve it.

**Stage 2: exit Plan Mode and implement.** Warn them about the exit widget wording before they click:

> The "ready to exit planning mode" widget is about to appear, and both "Yes" options mention implementing. Pick **"Yes, proceed in this same session."** I'll implement exactly the plan we agreed on, right here, and nothing lands without going through diff review.

Then implement the approved plan and nothing more.

**Stage 3: review the diff like you mean it.**

![Diff review](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/ai-diff-review.webp)

Have them open the changed file in Files Mode. The diff bar at the top shows `Keep` and `Revert` per chunk. Tell them to read every chunk, then say this plainly:

> Keep it if it's good. And if you'd rather not have it in your repo at all, click **Revert All**. A revert is a first-class ending here, the loop you just ran (plan, push back, approve, review) is the thing to keep.

## Exercise D3 (optional, ~3 more minutes): Spawn a worktree

Only offer this if the workspace root is the git repo root (check `git rev-parse --show-toplevel` against the workspace root) and the session is under about 12 minutes. Otherwise mention worktrees in one sentence during the wrap and move on.

Teach in two sentences: a worktree is a separate working copy of this repo on its own branch in its own folder, with its own agent sessions. Agents working in it cannot touch your working tree, which is how people run two or three streams in parallel without collisions.

> **Paste this:**
>
> Create a worktree on branch chore/agent-notes. In it, add a short "Working with agents here" section to the README (or a NOTES.md if the README shouldn't change): the build and test commands, plus the two most confusing parts of this codebase for a newcomer, based on nimbalyst-quickstart/architecture.md. Report back when done.

![Worktrees](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-worktree-sessions.webp)

While it runs, walk them through the panel:

> Look at the worktree panel in the left sidebar. Click the new worktree: the sessions list, the edited-files panel, everything swaps to that context. Click back to Main: your session here is exactly where you left it, and the other agent keeps working in the background.

When it reports back, they review its diff the same way as D2, and they can delete the worktree afterward if they don't want the change.

Go to the wrap.

---

# WRAP (both tracks, ~2 minutes)

1. **Recap in one line, naming their files.** PM: `nimbalyst-quickstart/brief.md` and the mockup. Dev: `nimbalyst-quickstart/architecture.md` and the change they kept (or deliberately reverted).

2. **The 30-second move that pays off tomorrow.** Have them paste:

> **Paste this:**
>
> Create (or extend) CLAUDE.md at the workspace root with what you learned about me today: my role, what I'm working on, and one preference you noticed. Keep it under ten lines. Show me the diff.

One sentence of teaching: `CLAUDE.md` is persistent project memory; every future session in this workspace starts sharper because of it.

3. **Point at the full tutorial.** Say this, or close to it:

> That's the quickstart. The full tutorial is the 45-minute version on a safe demo codebase, and it covers what we skipped: parallel worktrees, the tracker kanban, charts from your data, the commit-proposal widget, and the full plan-to-PR loop. When you have the time, create a fresh workspace for it (`Cmd+P`, then **Create New Workspace**, name it `HackerNews-Tutorial`), open a chat there, and paste:
>
> > Fetch `https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/tutorial.md`, save it as `tutorial.md` at the root of this workspace, then run it as the Nimbalyst tutorial. Follow it exactly, wait for me at every exercise.

4. **Close cleanly.** Mark the quickstart complete in `nimbalyst-quickstart/progress.json`. Final lines to the user: re-run this any time with `Run @nimbalyst-quickstart/quickstart.md`. Everything the quickstart made lives in `nimbalyst-quickstart/`; delete that folder whenever you like and the workspace is back to where it started (dev track: except the change you chose to keep).

---

# Reference

## Time budget the agent should hold

- Pre-flight: under 1 minute
- Orientation (two modes): about 1 minute
- PM: P1 ~3, P2 ~3, P3 ~4, wrap ~2 (about 13, ~14 with orientation)
- Dev: D1 ~4, D2 ~5, D3 optional ~3, wrap ~2 (about 12, ~13 with orientation, ~16 with D3)

If the session is over budget entering the last exercise, offer to skip straight to the wrap. Finishing early is better than finishing complete.

## Progress file shape

`nimbalyst-quickstart/progress.json`:

```json
{
  "version": "1.0",
  "track": "pm | dev",
  "os": "mac | windows | linux",
  "focus": "<PM focus sentence, if given>",
  "startedAt": "<iso>",
  "lastAccess": "<iso>",
  "lastCompletedExercise": "pre-flight | P1 | P2 | P3 | D1 | D2 | D3 | wrap",
  "complete": false
}
```

## Surfaces touched (for maintainers)

- Shared orientation: Files Mode and Agent Mode via the top-left mode switcher; the sessions list (left) and edited-files list (right)
- PM: file writes, edited-files list, diff bar (Keep All / per-chunk), hand editing, `@file` grounding, mockup editor with annotations. No code-diff screenshot (the markdown brief is the artifact); the diff image lives in the dev track only.
- Dev: parallel sub-agents, hand editing, Plan Mode and the exit widget, diff review (the code-diff screenshot), worktrees (optional)
- Deliberately excluded (full tutorial covers them): tracker, charts, terminal, commit widget, PR flow, custom slash commands, Excalidraw

---

# How to share this quickstart (Karl's reference, not part of the quickstart itself)

No fresh workspace needed; this is the difference from the full tutorial. PM users can run it in any workspace, including a brand-new empty one. Devs should run it in a workspace opened on their own repo.

Have them paste this single prompt into a Nimbalyst chat:

> Fetch `https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/quickstart.md`, save it to `nimbalyst-quickstart/quickstart.md` in this workspace, then run it as the Nimbalyst quickstart. Wait for me at every exercise.

**Re-running:** open a fresh chat in the same workspace and paste `Run @nimbalyst-quickstart/quickstart.md`.

**Browsable page:** `https://github.com/nimbalyst/skills/blob/main/skills/getting-started/quickstart.md`
