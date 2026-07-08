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

- one artifact they made about their own work (PM: a working brief and a mockup; dev: a run-and-test guide and an architecture diagram of their repo, plus two agents run in parallel)
- the core loop in their hands: prompt, open the file, edit it by hand, review the diff, ask for more
- a reason to come back tomorrow, because the artifact is about their actual work, not a demo

## Hard constraints

- **Keep the pace brisk and take the user through every exercise; never skip one to save time.** The quickstart is meant to run in about 15 minutes. If a generation is about to run long, tighten the ask itself rather than cutting the exercise.
- **Everything the quickstart writes goes under `nimbalyst-quickstart/` at the workspace root.** One folder. The user can delete it afterward and the workspace is exactly as it was. The only exceptions are deliberate and user-approved: the dev track's worktree stream (D3), which creates a branch and a `NOTES.md` inside an isolated worktree, and the closing `CLAUDE.md` move.
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
- Use correct spatial cues: sessions list on the **left**; edited-files list on the **right**; the chat transcript or editor in the center; the worktree panel in the left sidebar; the diff approval bar at the top of the editor in Files Mode.
- **Don't bounce the user between modes. Only send them to the editor (Files Mode) when the task truly needs it: drawing on a mockup, or reading and approving a diff.** Pasting prompts and reading the agent's replies work the same from Agent Mode, split view, or Files Mode, so never tell them to switch back just to paste. Opening a file is a click on its path link, which brings up the editor on its own, not a manual mode change. The switcher is the FILES / split / AGENT control at the top-left, and split view shows chat and files at once for anyone who would rather never switch. Name a mode only when a step genuinely needs the editor, and say why; otherwise, wherever they are is fine.
- **Every time you name a saved file, write it as its workspace-relative path with the folder (e.g. `nimbalyst-quickstart/brief.md`), never a bare filename.** Nimbalyst turns a path that has a folder into a clickable link that opens the file on click; a bare `brief.md` stays dead text. After that clickable path, give the other ways to open it: click it in the edited-files list on the right, right-click it there and choose **Open in Files** for the full editor and diff view, quick-open with `Cmd+O`, or switch to Files Mode with `Cmd+E` and use the tree. After the second save, compress the alternatives to one line, but always keep the file itself as a clickable path; never drop it entirely.
- **Render every `![alt](url)` screenshot by emitting that exact markdown image line, with the remote `https://` URL unchanged, inline in chat when you reach it.** These are remote images and render as-is in the chat window. Do NOT use the `display_to_user` tool for them, do NOT download them to disk, and do NOT rewrite the URL to a local or relative path. If one fails to render, leave the markdown line as-is and move on. Never summarize or skip them.
- After every exercise, update `nimbalyst-quickstart/progress.json`.
- Honor the flow controls at any point: `next`/`got it`/`continue` advances; `repeat` or any question re-explains without advancing; `skip` marks the exercise skipped and moves on; `pause` confirms progress is saved and waits; `resume` reads the progress file, gives a one-sentence recap, and re-issues the current prompt.
- If a named tool is unavailable, say so plainly and use the nearest fallback. If the mockup editor is unavailable, replace P3 with a second document iteration. If the Excalidraw editor is unavailable, have D2 draw the same architecture as a Mermaid diagram in a markdown file instead. If worktrees are unavailable, run both D3 streams as ordinary sessions.

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

> Good. We'll mostly stay right here in Agent Mode, and clicking a file opens the editor when you need it. The only times you'll reach for Files Mode yourself are to draw on a mockup or review a diff. Want chat and files side by side the whole time? Use the split view in that same switcher. Otherwise, wherever you are is fine.

---

# PM TRACK

Three exercises, about ten minutes of work. All files go under `nimbalyst-quickstart/`.

## Exercise P1: A working brief on your actual work (~3 minutes)

Compose the prompt **for** the user with their stated focus already filled in, so they can paste it unedited. Replace the bracketed text yourself before presenting it; if they skipped the intake, use the stock example.

> **Paste this:**
>
> I'm working on [their focus, in one clause]. Write me a one-page working brief at nimbalyst-quickstart/brief.md: the problem in two sentences, three options with a one-line tradeoff each, the option you'd recommend and why, three open questions, and concrete next steps for this week. Keep it to one page. No research, no web, just structure my thinking.

You paste this in **Agent Mode** (the chat you're already in). While it generates, one sentence only: the agent is writing a file into the workspace, not a chat answer that scrolls away.

When the file lands, give the open-paths reminder built around the clickable path: point them at `nimbalyst-quickstart/brief.md` (clicking it opens the editor), and mention it also sits in the **edited-files list on the right**. No need to switch modes yourself for this. Wait for them to confirm they have it open.

## Exercise P2: Make it yours (~3 minutes)

The brief is on disk but it is still the agent's. Three moves, stage-gated, one per turn.

**Move 1: open it, then review the diff in Files Mode.** Point them at `nimbalyst-quickstart/brief.md` (write the full path, not a bare filename, so it renders as a clickable link that opens on click). They can also open it from the **edited-files list on the right**: click the file there, right-click it and choose **Open in Files**, or press `Cmd+E` and open it from the tree. Once it's open, the agent's changes are pending in the **diff approval bar at the top of the editor**; the whole file shows green because it's all new. Have them click **Keep All** to accept it. Tell them this is the same red/green diff they'll see for every AI change, whether it's a markdown doc like this one or code.

**Move 2: edit by hand.** Tell them: change something. Cut the weakest option. Fix the recommendation if it's wrong. Sharpen an open question. Type directly into the file; it's yours now. Come back when you've made at least one edit.

**Move 3: ask for more.**

> **Paste this:**
>
> Re-read @nimbalyst-quickstart/brief.md now that I've edited it. Add a "Risks" section with the two things most likely to make this fail, and tighten anything I made worse. Show me the diff.

When the new diff appears, point out `Keep` and `Revert` per chunk: they don't have to take all of it.

**Checkpoint:** this loop (accept, edit by hand, ask for more) is how most work in Nimbalyst happens, on documents, mockups, and code alike.

## Exercise P3: Mockup and mark it up (~4 minutes)

Three stages, one per turn.

**Stage 1: generate.** Personalize to their focus if it implies any screen or surface. If their focus has no UI at all, mock an adjacent surface (a status dashboard or summary screen for it), or fall back to the stock example.

![Mockup editor](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/editor-mockup.webp)

> **Paste this:**
>
> Create a mockup at nimbalyst-quickstart/mockup.mockup.html of [the main screen implied by their focus]. One screen only, clean and plain, realistic labels, one clear primary action.

Wait for the file to land.

**Stage 2: annotate.** Tell the user:

> Open `nimbalyst-quickstart/mockup.mockup.html` (click that path to open it), or open it from the edited-files list on the right. It renders as an interactive mockup, click around it. Then use the drawing tools at the top of the editor to leave **visual marks only**: one circle around something you'd change, one arrow pointing at something to move. Don't type text onto the canvas; the words go in your next prompt. Come back when you're done drawing.

**Stage 3: v2.** No switching needed; right where they are with the mockup open, have them paste (rewriting the bracketed parts in their own words):

> **Paste this:**
>
> Look at my circles and arrows on @nimbalyst-quickstart/mockup.mockup.html and generate a v2. The circle is on [what they circled and what's wrong with it]. The arrow points at [what should change there].

Close with one line: the mockup carries the "where," the chat prompt carries the "what" and "why."

Go to the wrap.

---

# DEV TRACK

Three exercises on the user's own repo, about ten minutes: a run-and-test guide, an architecture diagram, and two agents running in parallel.

## Exercise D1: A run-and-test guide for your repo (~3 minutes)

One sentence of setup, no more: the fastest way to feel the loop is to have the agent read just your README and manifest and turn them into a short run-and-test guide. Single agent, two files, no codebase spelunking.

> **Paste this:**
>
> Read only this repo's README and its root package.json (or whatever the manifest is). Don't scan the rest of the codebase. Write a short newcomer's guide at nimbalyst-quickstart/getting-started.md: one sentence on what this project is, the exact commands to install, run, build, and test it, and the two things most likely to trip someone up on their first day. Keep it under a page and don't change any code.

You paste this in **Agent Mode** (the chat you're in). It lands in a few seconds; while it works, one sentence only: it's reading two files and writing a file into the workspace, not a chat answer that scrolls away.

Then run the core loop, three moves, one per turn.

**Move 1: review the diff in Files Mode.** When it lands, point them at `nimbalyst-quickstart/getting-started.md` (write the full path so it renders as a clickable link that opens on click). They can also open it from the **edited-files list on the right** (that panel only exists in Agent Mode, where you are now): click the file there, right-click it and choose **Open in Files**, or press `Cmd+E` and open it from the tree. The whole file is green because it's all new, pending in the **diff approval bar at the top of the editor**. Have them click **Keep All**. Tell them this is the same red/green diff they'll see for every AI change, doc or code.

**Move 2: fix one command by hand.** You know your own repo better than a README-scraper does. Correct a command it got slightly wrong, or add the one it missed (the exact test invocation, an env var it forgot). Type straight into the file; it's yours now. Come back when you've made at least one edit.

**Move 3: ask for more.**

> **Paste this:**
>
> Re-read @nimbalyst-quickstart/getting-started.md now that I've fixed the commands. Add a short "Project layout" section: the top five folders at the repo root and one line on what each is for. Only the top level, don't scan deep into the tree.

When the new diff appears, point out `Keep` and `Revert` per chunk: they don't have to take all of it. The guide is theirs now, and future sessions can ground on it with `@nimbalyst-quickstart/getting-started.md`.

## Exercise D2: An architecture diagram from your guide (~3 minutes)

One sentence of setup: the fastest way to see Nimbalyst's visual editors is to turn the guide you just made into an architecture diagram, no repo scan, just a picture of what you already documented.

**Stage 1: generate.**

> **Paste this:**
>
> Create an Excalidraw diagram at nimbalyst-quickstart/architecture.excalidraw from @nimbalyst-quickstart/getting-started.md only. Show the main folders or packages as boxes and draw arrows for how they relate. Build it with the Excalidraw editor tools, keep it to one clean screen, and don't scan the rest of the codebase.

Paste this in **Agent Mode**. When it lands, point them at `nimbalyst-quickstart/architecture.excalidraw` (clicking it opens the Excalidraw editor). One sentence while it draws: the agent is building this on the same visual canvas you can edit by hand.

**Stage 2: make it yours.** Tell them it is a live Excalidraw canvas, not a flat picture: drag a box somewhere that reads better, drop a text note on the part they care about, or draw one more arrow. Come back when they have changed at least one thing. Close with a line: the diagram is theirs now, and they and the agent are editing the same canvas, exactly like the doc in D1.

## Exercise D3: Two agents at once (~4 minutes)

This is the move a plain terminal can't match: more than one agent working at the same time. They start two streams and watch them run side by side, one in an isolated worktree, one right here in this workspace.

If the workspace is not a git repo (check `git rev-parse --show-toplevel`), skip the worktree framing and run both streams as ordinary sessions.

**Stage 1: start the worktree stream first (it takes longest).** In two sentences: a worktree is a separate copy of this repo on its own branch in its own folder, with its own sessions, and an agent working there cannot touch your working tree. Have them open a new session from the sessions list on the left and paste:

> **Paste this:**
>
> Create a worktree on branch chore/agent-notes. In it, write a short NOTES.md with the build and test commands from @nimbalyst-quickstart/getting-started.md plus the two things a newcomer should know first. Report back when done, and don't touch my main working tree.

![Worktrees](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-worktree-sessions.webp)

Don't wait for it. The moment it's running, move on.

**Stage 2: start a second, read-only stream.** Have them open one more new session and paste:

> **Paste this:**
>
> Read @nimbalyst-quickstart/getting-started.md and this repo's root package.json, and tell me the three commands a brand-new contributor will run most, and why. Don't change any files.

**Stage 3: watch them run at once.** Point them at the left sidebar: the read-only session is working in the sessions list, the worktree stream is running under the worktree panel, both at the same time. That is the one-person-team moment, two agents on two jobs, and you review whichever finishes first. Clicking the worktree swaps the whole left side into its context; clicking back to Main returns here. When the worktree reports back, they can read its NOTES.md and delete the worktree afterward if they don't want it.

Go to the wrap.

---

# WRAP (both tracks, ~2 minutes)

1. **Recap in one line, naming their files.** PM: `nimbalyst-quickstart/brief.md` and the mockup. Dev: `nimbalyst-quickstart/getting-started.md`, the architecture diagram, and the two agents they ran in parallel.

2. **The 30-second move that pays off tomorrow.** Have them paste:

> **Paste this:**
>
> Create (or extend) CLAUDE.md at the workspace root with what you learned about me today: my role, what I'm working on, and one preference you noticed. Keep it under ten lines. Show me the diff.

One sentence of teaching: `CLAUDE.md` is persistent project memory; every future session in this workspace starts sharper because of it.

3. **Point at the full tutorial.** Say this, or close to it:

> That's the quickstart. The full tutorial is the 45-minute version on a safe demo codebase, and it covers what we skipped: parallel worktrees, the tracker kanban, charts from your data, the commit-proposal widget, and the full plan-to-PR loop. When you have the time, create a fresh workspace for it (`Cmd+P`, then **Create New Workspace**, name it `HackerNews-Tutorial`), open a chat there, and paste:
>
> > Fetch `https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/tutorial.md`, save it as `tutorial.md` at the root of this workspace, then run it as the Nimbalyst tutorial. Follow it exactly, wait for me at every exercise.

4. **Close cleanly.** Mark the quickstart complete in `nimbalyst-quickstart/progress.json`. Final lines to the user: re-run this any time with `Run @nimbalyst-quickstart/quickstart.md`. Everything the quickstart made lives in `nimbalyst-quickstart/`; delete that folder whenever you like and the workspace is back to where it started (dev track: except the worktree you spun up, which you can delete separately).

---

# Reference

## Time budget the agent should hold

- Pre-flight: under 1 minute
- Orientation (two modes): about 1 minute
- PM: P1 ~3, P2 ~3, P3 ~4, wrap ~2 (about 13, ~14 with orientation)
- Dev: D1 ~3, D2 ~3, D3 ~4, wrap ~2 (about 13, ~14 with orientation)

Take the user through every exercise. Do not skip or shortcut an exercise to save time; if a generation risks running long, tighten the ask itself instead.

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
- PM: file writes, edited-files list, diff bar (Keep All / per-chunk), hand editing, `@file` grounding, mockup editor with annotations.
- Dev: README/manifest grounding, hand editing, the Excalidraw diagram editor, parallel agent sessions, and an isolated worktree
- Deliberately excluded (full tutorial covers them): parallel sub-agents, Plan Mode, reviewing a real code diff, tracker, charts, terminal, commit widget, PR flow, custom slash commands

---

# How to share this quickstart (Karl's reference, not part of the quickstart itself)

No fresh workspace needed; this is the difference from the full tutorial. PM users can run it in any workspace, including a brand-new empty one. Devs should run it in a workspace opened on their own repo.

Have them paste this single prompt into a Nimbalyst chat:

> Fetch `https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/quickstart.md`, save it to `nimbalyst-quickstart/quickstart.md` in this workspace, then run it as the Nimbalyst quickstart. Wait for me at every exercise.

**Re-running:** open a fresh chat in the same workspace and paste `Run @nimbalyst-quickstart/quickstart.md`.

**Browsable page:** `https://github.com/nimbalyst/skills/blob/main/skills/getting-started/quickstart.md`
