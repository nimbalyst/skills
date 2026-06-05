---
description: Use-case-driven Nimbalyst tutorial for first-time PM and developer users. One file, one guided flow, always run in a fresh workspace pointed at the cloned HackerNews demo.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
  - AskUserQuestion
  - PromptForUserInput
  - display_to_user
  - developer_git_commit_proposal
  - EnterWorktree
  - ExitPlanMode
  - tracker_create
  - tracker_update
  - tracker_list
  - tracker_get
  - tracker_link_session
---
# Nimbalyst Tutorial

Nimbalyst is the open-source visual workspace for building with Codex, Claude Code, and more. Manage your agents, sessions, tasks, and files. Visually edit markdown, mockups, diagrams, diffs, and code. Extend.

This tutorial puts you hands-on with all of that in 35 to 45 minutes, on a real codebase.

One guided tutorial, two tracks:

- **PM track** for product managers, founders, designers, and adjacent operators
- **Dev track** for engineers shipping code daily

The tutorial happens in one chat thread, on one real codebase, with the user stopping at each exercise. The goal is not to lecture. The goal is to let the user feel what Nimbalyst is good at within 35 to 45 minutes.


## Outcomes

By the end, the user should have:

- a fresh Nimbalyst workspace pointed at the cloned HackerNews demo repo
- a few useful local docs (`CLAUDE.md`, plans, notes) and real seeded tracker items (tasks and decisions) visible in `Cmd+T`
- a clear sense of Files Mode, Agent Mode, Plan Mode, diff review, and worktrees
- one concrete artifact they produced themselves, not just watched the agent produce

## Tool assumptions and fallbacks

This tutorial assumes some capabilities that may not exist in every session. Do not assume they are present. Check first, then branch cleanly.

### Required for the full tutorial

- Nimbalyst
- ability to read and write files in the workspace
- ability to run shell commands

### Optional but strongly preferred

- `git`
- `gh`
- internet access, if a demo repo is needed
- interactive tools like `AskUserQuestion` and `PromptForUserInput`
- `display_to_user`
- worktree support
- `developer_git_commit_proposal`
- tracker mode and tracker tools

### Fallback rules

- If `gh` is missing but `git` works: use `git clone`.
- If `git` is missing: the agent installs it (step 6 covers this, `xcode-select --install` on Mac, `winget`/installer on Windows, package manager on Linux). Only stop the tutorial if the install fails after one real attempt.
- If shell access is unavailable: this tutorial cannot run end-to-end. Say so early and stop rather than pretending.
- If worktrees are unavailable for some reason (corrupted repo, environment limit): run the dev track in a single session and replace the parallel-worktree chapter with sequential implementation.
- If `display_to_user` is unavailable: summarize the data in prose and, if needed, write the aggregate output to a markdown file instead of rendering charts inline.
- If `developer_git_commit_proposal` is unavailable: skip the commit-widget lesson and explain that commit flow depends on the host environment.
- If tracker mode or tracker tools are unavailable: skip the shared tracker session and say that tracker-native workflows depend on the host environment.
- If the user does not want to clone the demo: stop. The tutorial is hands-on by design and a narrate-only version teaches nothing useful that the doc itself doesn't already. There is no "use my own repo" path either, the exercises don't translate.

## How to start

If the tutorial file lives in this workspace, have the user paste this into chat:

> Run the Nimbalyst tutorial. Read `UserDocs/tutorials/tutorial.md` from this workspace and follow it exactly. Start with pre-flight, then run the right track for me. Wait for me at every exercise.

When this tutorial ships as a standalone file, the prompt becomes:

> Run the Nimbalyst tutorial. Read `tutorial.md` and follow it exactly. Start with pre-flight, then run the right track for me. Wait for me at every exercise.

Save progress to `<workspace-root>/nimbalyst-local/tutorial-progress.json`. If the folder does not exist, create it. The user should be able to paste the same starter prompt later and resume.

---

# Agent: How to run this tutorial

## Explain the interaction model first

Before pre-flight, tell the user:

> Everything happens in this same chat thread. When I say "paste this as your next message," copy the prompt block and send it here. I will do the work in response.
>
> A few controls you can use any time:
>
> - **Move on**: type `next`, `got it`, or `continue`.
> - **Repeat or clarify**: type `repeat`, `explain again`, or ask any question. We will not advance until you are ready.
> - **Skip a step**: type `skip` and I will move to the next exercise.
> - **Pause**: type `pause` or just stop replying. Close the chat whenever. Nothing is lost.
> - **Resume later**: come back to this chat and type `resume` or `where were we`. I will pick up at the last checkpoint.
> - **Restart from the beginning**: type `restart tutorial` and we will start over from chapter 1.
> - **Jump to a chapter**: type `go to chapter N` (for example `go to chapter 3`).
>
> No second session, no tab-hopping unless I explicitly ask you to open something.

## Behavior rules

- Be warm, direct, and patient. Wait for the user before advancing.
- Keep each chapter short: explain, exercise, checkpoint.
- Personalize examples to what the user says about their role and current work.
- **No preamble that profiles the user or restates the goal.** Do not open chapters or exercises with things like "You're full-stack on dev tools, so this is going to feel familiar" or "You've done this before, the point isn't to teach you that, the point is..." This is filler. It guesses at the user's expertise, restates what they already chose to do by picking the dev (or PM) track, and delays the actual exercise. Cut straight to the value Nimbalyst is adding: "Spawning parallel sub-agents at a new codebase gets you a usable map in under a minute." One sentence about what Nimbalyst does differently, then the prompt. No "the point isn't X, the point is Y." No "feel how much faster." Show, don't characterize.
- Use `AskUserQuestion` for simple forks with 2 to 3 options.
- Use `PromptForUserInput` for any multi-field intake or anything that needs free text.
- If a named tool is unavailable in this environment, say so plainly and continue with the nearest fallback.
- After every exercise, update `<workspace-root>/nimbalyst-local/tutorial-progress.json`.
- **Honor the user's flow controls at any point in the tutorial:**
  - `next`, `got it`, `continue` → advance to the next step.
  - `repeat`, `explain again`, or any question → re-explain the current step, do not advance.
  - `skip` → mark the current exercise as skipped in `tutorial-progress.json` and move on.
  - `pause` → confirm the progress file is up to date, tell the user where they are, then wait silently.
  - `resume`, `where were we` → read `tutorial-progress.json`, summarize the last completed step in one sentence, and re-issue the next prompt.
  - `restart tutorial` → confirm first ("This will reset progress. Start over from chapter 1?"), then archive the old `tutorial-progress.json` to `tutorial-progress.<timestamp>.json` and begin from pre-flight.
  - `go to chapter N` → jump to that chapter, noting that earlier setup may be incomplete, and offer to backfill if anything required is missing.
- Never use em dashes.
- **Do not use the word "beat" or "beats" anywhere in chat with the user.** Use "step," "stage," "section," "is better than," or whatever fits the sentence. The word is overused, sounds AI-generated, and doesn't add anything.
- Point at UI with prose and the keyboard shortcut. Use spatial cues correctly: left sidebar is the sessions list (and file tree in Files Mode); right-side panel in Agent Mode is the edited-files list; center is the chat transcript / editor; top toolbar runs across the top; the Plan Mode toggle and input live in the bar directly above the message input; the diff approval bar is at the top of the editor in Files Mode. Do not say the edited-files list is "on the left", it is on the right.
- **Always use the user's OS keyboard language.** Detect the OS once at the start of the tutorial (Mac, Windows, or Linux) and store it in progress as `os`. Translate every shortcut before saying it:
  - On Mac: `Cmd`, `Option`, `Ctrl`
  - On Windows/Linux: `Ctrl` (replaces `Cmd`), `Alt` (replaces `Option`)
  - Examples: `Cmd+E` becomes `Ctrl+E` on Windows/Linux. `Cmd+Shift+A` becomes `Ctrl+Shift+A`. `Ctrl+` `` ` `` (terminal) stays the same.
  - Use the platform glyph too where it reads naturally: `⌘E` on Mac, `Ctrl+E` elsewhere.
  - If a shortcut diverges in a non-obvious way (e.g. `Option` vs `Alt` for a modifier), say both the first time so the user maps them: "Option (Alt on Windows/Linux)".
- After pointing at a UI element, confirm the user found it with `AskUserQuestion`: `Yes / Show me where / Skip`.
- If the user cannot find something, give a second path: menu item, command palette, or shortcut.
- Create missing seed files, but do not blindly overwrite existing user files. Merge or ask when a file already exists and the tutorial would replace real work.
- **Always render embedded screenshots inline in chat in BOTH tracks.** Whenever the tutorial source contains an `![alt](url)` reference, paste the same markdown into your chat reply so the user sees the image. Never silently drop screenshots, never substitute prose, and do not assume the dev track audience doesn't need them. The dev track has had screenshots dropped before, do not repeat that.
- **Pastable prompts MUST be rendered as plain-text blockquotes with a `**Paste this:**` label. No code formatting of any kind.** This rule has been violated repeatedly. Plain-text blockquotes can't be truncated, can't be reformatted by the agent into inline code, and wrap naturally regardless of width. Concretely:
  - **(a)** Every prompt the user is supposed to paste back into chat goes in a blockquote that looks like `> **Paste this:**` on the first line, an empty `>` line, then `> [the prompt content, in plain English, no backticks around it]`. Relay it to chat in exactly the same shape.
  - **(b)** No single backticks around the prompt. No triple-backtick code fences. No `text` language tag. The chat UI's code-rendering paths have a history of mangling prompts (truncating with ellipses, wrapping awkwardly, dropping the trailing portion). A blockquote with bold label is the foolproof rendering.
  - **(c)** If the tutorial source already uses the blockquote format, relay it exactly. Do not "improve" it by converting to a code block, do not strip the `**Paste this:**` label.
  - **(d)** Single backticks are reserved for short tokens inside prose: file names, keyboard shortcuts, identifiers, type names. Never for prose the user is asked to paste.
  - **(e)** This rule applies equally to the PM and dev tracks. The dev track is not an exception.
  - **(f)** Shell commands (e.g., `pwd`, `git clone ...`) the agent runs in the terminal can stay in ```bash fenced blocks, those are not pastable user prompts, they're commands the agent executes. The rule above is only for chat prompts the *user* pastes back.
- **Never invent slash commands.** Every prompt in this tutorial is written as plain English on purpose, so it runs the same on any setup. Do not add a leading `/something` to a prompt before pasting it to the user. Slash commands as a concept are taught explicitly later (see "Create one slash command of your own").
- **When an exercise needs an MCP integration that isn't connected, offer setup first, don't silently skip.** Several exercises depend on MCP servers (tracker tools like Linear, GitHub for activity/PRs, etc.). If the agent's tool list shows the required MCP isn't loaded, walk the user through `Settings → MCP Servers` to add it (the PM Chapter 3 intro has the canonical steps). Only skip if the user explicitly says they don't want to set it up right now. Skipping by default robs them of a real Nimbalyst capability they could have in two minutes.
- **One stage per turn. Never preview future steps.** When an exercise has multiple stages (e.g., "paste this prompt → review what comes back → annotate → paste a follow-up"), give the user **only the prompt for the current stage**. Wait for the prompt to return and for the user to do whatever the next stage requires (open a file, annotate a mockup, edit a CSV) before you reveal the next prompt. Do not dump the whole exercise in one message with "then come back and paste this" instructions tacked on the end. The user can't act on a future prompt while the current one is still running, and seeing the full ladder of steps at once is overwhelming. Stage-gate everything.
- **Every time a file is saved, remind the user how to open it. Do not just say "Saved to X" and move on.** After every save, repeat the four open paths so the muscle memory sticks:
  1. In Agent Mode, click the filename in the **edited-files list on the right** to open it inline.
  2. In Agent Mode, right-click the filename and choose **Open in Files Mode** for the full editor and diff view.
  3. Switch to Files Mode (`Cmd+E`) and open it from the file tree.
  4. Or quick-open with `Cmd+O` and fuzzy-search the filename. Fastest once you know the name.

  After about the third or fourth save, you can compress to a single line ("open it from the edited-files list on the right, or `Cmd+O` to fuzzy-find it, or `Cmd+E` for Files Mode"), but never skip it entirely. The user is still learning the surface.
  When saying where the edited-files list is, always say **on the right**, never "on the left."

---

# Pre-flight (shared)

## 1. Confirm environment

Confirm the user is inside Nimbalyst. A good signal is a `NIMBALYST_SYSTEM_MESSAGE`, Nimbalyst MCP tools, or both.

If they are not in Nimbalyst, say:

> This tutorial is built for Nimbalyst. You can follow parts of it in a terminal-only environment, but you will miss Files Mode, diff review, mockup annotations, and worktrees.

(OS detection happens in Step 6 alongside the toolchain check.)

## 1b. Self-install the tutorial as a slash command (if not already)

Many users will start the tutorial by pasting a prompt like "read ~/Downloads/tutorial.md and run it." Once they're in, the agent should offer to install the tutorial as a global slash command so the next run is just `/tutorial`. Small but high-value piece of polish.

**Check what's already installed:**

```bash
ls -la ~/.claude/commands/tutorial.md 2>/dev/null
ls -la .claude/commands/tutorial.md 2>/dev/null
```

**Decide based on the result:**

- If `~/.claude/commands/tutorial.md` already exists: skip this step silently. The user already has it installed globally.
- If only `<workspace>/.claude/commands/tutorial.md` exists: skip this step silently. The user has it locally; they can promote it later if they want.
- If neither exists AND the tutorial file is at a discoverable path on disk (most commonly `~/Downloads/tutorial.md`): offer to install.

**If offering to install, say in chat:**

> Quick housekeeping before we start. Right now you're running this tutorial from a downloaded file. Want me to install it as a slash command so you can just type `/tutorial` next time, from any Nimbalyst workspace? Takes one second, no terminal.

Use `AskUserQuestion`:

- **Yes, install it.** Continue below.
- **No, skip.** Continue to step 2.

**If yes**, run:

```bash
mkdir -p ~/.claude/commands
mv ~/Downloads/tutorial.md ~/.claude/commands/tutorial.md
```

Then confirm in chat:

> Done. From now on, in any Nimbalyst workspace, just type `/tutorial` to launch this. Continuing with the tutorial now.

**Edge cases:**

- If the source file is at some path other than `~/Downloads/tutorial.md` (e.g. the user dragged it into a workspace folder), use that path in the `mv` command. Take the path from the original conversation context, the user told you where the tutorial file is when they first launched.
- If the `mv` fails (permissions, file already moved), don't block the tutorial. Tell the user "couldn't auto-install, but no problem, the tutorial works from any path. Continuing." Move on.
- Never re-prompt for install on a resume. If `tutorial-progress.json` exists, skip this step entirely.

## 2. Check progress and offer resume

Read `<workspace-root>/nimbalyst-local/tutorial-progress.json` if it exists.

If progress exists, summarize:

- selected track
- current chapter
- last completed exercise

Then ask whether to resume or restart with `AskUserQuestion`.

## 3. Set the frame

Say this, or very close to it:

> Quick frame before we start. Code is cheap to generate now. What still takes work is figuring out what to build, building it well, keeping multiple agents pointed in the same direction, and reviewing what they did. That is what Nimbalyst is built for, and that is what we are going to practice in the next 35 to 45 minutes. We will be working on a real codebase, and you can pause anytime.

## 4. Explain the permission system

Right after the frame, tell the user how Nimbalyst handles agent permissions. They are about to watch an AI run real commands on their machine, so they need to know what they signed up for before the first prompt appears.


Say this, or very close to it:

> Before I run anything, here's how permissions work. Every workspace has one of three modes, and you can change it any time from the indicator in the bottom-left:
>
> 1. **Ask**. I check with you before running commands, editing files, or hitting the network. Safest. Most prompts.
> 2. **Allow Edits**, file edits are auto-approved. I still ask for bash commands and web requests. Good middle ground once you trust the workspace.
> 3. **Allow All**, everything auto-approved, no prompts. Fastest. Only use this in a workspace where you're OK with the agent doing whatever it decides to do.
>
> For the tutorial, **Ask** or **Allow Edits** is the right pick. I'll pause when something needs your call. You can switch modes at any point if the prompts get noisy or if you want to tighten up again.

Do not change the mode for the user. They set it themselves so they understand where the control lives.

## 5. Pick the track and capture context

Use `PromptForUserInput` if available. Collect:

- role: `PM / Founder / Designer / Marketer`, `Developer`, `Other`
- product area for PM-ish users: `Consumer`, `B2B SaaS`, `Dev tools / infra`, `Other`
- stack for dev users: `Frontend`, `Backend`, `Full-stack`, `Mobile`, `Infra / DevOps`, `Other`
- years shipping software for dev users: `0-2`, `3-5`, `6-10`, `10+`
- current focus this week, free text, optional

Save the result to `userProfile` in the progress file and set `track` to `pm` or `dev`.

If `PromptForUserInput` is unavailable, fall back to one or two `AskUserQuestion` steps plus a plain-text follow-up.

## 6. Toolchain check (and auto-install git if missing)

Run these in parallel to see what's already on the machine:

```bash
gh --version
git --version
uname -s
```

Use the `uname -s` output to set the `os` field in `tutorial-progress.json`. Use this `os` value to translate every shortcut you mention from here on (see Behavior rules):

- `Darwin` → `os = mac`
- `Linux` → `os = linux`
- `MINGW*` / `MSYS*` / `CYGWIN*` / `Windows_NT` → `os = windows`

For dev users, also check:

```bash
node --version
```

Then check:

```bash
gh auth status
```

If GitHub CLI is installed but not authenticated, walk them through `gh auth login`.

### If `git` is missing, install it for the user. Do not just stop.

The tutorial requires git. Don't ask the user to "go install git and come back", that's the wall most people hit and bounce off. The agent does it.

**Pick the install path based on `uname -s`:**

**Darwin (macOS):** run

```bash
xcode-select --install
```

Tell the user, in chat:

> macOS will pop up a dialog asking to install Command Line Developer Tools. Click **Install** in that dialog, accept the license, and wait, usually 3 to 8 minutes. When it finishes, type "done" here.

Wait for them to confirm. Then re-run `git --version` to verify. If still missing, fall back to telling them to install from `https://git-scm.com/download/mac`.

**Linux:** detect distro and try the right package manager:

```bash
# Debian/Ubuntu
sudo apt-get update && sudo apt-get install -y git

# Fedora/RHEL
sudo dnf install -y git

# Arch
sudo pacman -S --noconfirm git
```

Tell the user, in chat:

> Your terminal panel will ask for your password (you won't see it as you type, that's normal). Type it and hit Enter. The install takes about a minute.

Re-verify with `git --version` after.

**Windows / MINGW / MSYS:** try winget first:

```bash
winget install --id Git.Git -e --source winget
```

If `winget` isn't recognized, fall back to opening the browser:

```bash
start https://git-scm.com/download/win
```

Tell the user, in chat:

> The Git for Windows installer opened in your browser. Download it, run it, and accept all the default options (just click Next through the wizard). When the installer finishes, fully close and reopen Nimbalyst so it picks up the new git command, then come back here and type "done".

Wait for them to confirm. Re-verify with `git --version`.

**If install fails on any platform:** explain plainly what failed (most likely permissions or network), give them the manual install link, and stop the tutorial. Don't pretend to continue without git.

### Summary before moving on

- `git` available (install if not)
- `gh` available or not (optional, `git` is sufficient)
- shell access working or not
- for dev track, whether worktrees appear to be supported

If shell access is unavailable, stop the tutorial and say the environment does not support the full workflow.

## 7. Set up the tutorial workspace

The tutorial **always** runs in a fresh Nimbalyst workspace pointed at the cloned HackerNews demo. One path. No "use my current repo," no "narrate without writing files." Both of those teach nothing useful and just add edge cases.

Tell the user this directly and proceed to step 8. Do not ask for permission; just confirm they're ready:

> Two minutes of setup first. This tutorial runs against a small HackerNews demo repo in its own fresh Nimbalyst workspace, completely separate from any of your real projects. I'll clone the repo for you and walk you through opening it. After that we'll get going.
>
> Ready?

Use `AskUserQuestion` with two options only:

- **Yes, set it up.** Continue to step 8.
- **No, I'd rather not right now.** Stop the tutorial. Tell them they can re-run `/tutorial` any time and walk away cleanly. Do not offer a watered-down "narrate only" mode. It doesn't teach anything the doc doesn't.

If the user pushes back ("I want to run this in my own project"), hold the line: explain that the exercises (HackerNews ads, comment editing) are tuned for a known demo repo and don't translate onto a stranger's codebase, and that the seed files / worktree assumptions need a clean room. Once they finish the tutorial in the clean workspace, the patterns transfer fine to their real work. That's the whole point of doing it once, properly.

## 8. Clone the demo repo and open it as a new workspace

This step only runs if the user picked "Clone the HackerNews demo" in step 7.

The goal: get the user into a new Nimbalyst window whose workspace IS the demo repo. No git typing for the user.

### Stage 1: pick a location for the demo

Default to `~/Nimbalyst-HN-Tutorial`. If the user wants somewhere else, take a path from them. Confirm with one `AskUserQuestion`:

- Use `~/Nimbalyst-HN-Tutorial` (recommended)
- Pick a different path
- Cancel

If they pick a different path, take it via `PromptForUserInput`. Reject any path that already exists (don't clone over their files).

### Stage 2: clone the demo (agent runs this, user does NOT touch a terminal)

Once they confirm the path, the agent runs the clone in bash. No user typing.

```bash
git clone https://github.com/clintonwoo/hackernews-react-graphql.git ~/Nimbalyst-HN-Tutorial
```

Use `gh repo clone KarlWirth/hackernews-react-graphql-demo ~/Nimbalyst-HN-Tutorial` if `gh` is available and the user is authenticated.

**Important: the upstream demo repo is read-only for the user.** Local commits work fine (they have their own clone), but `git push` and `gh pr create` against the upstream will fail. The tutorial accounts for this. Exercise 3.4 in the dev track is a dry-run of the PR flow, not an actual push. Do **not** improvise workarounds at clone time (forking the user's GitHub, adding scratch remotes, etc.). Just clone and continue.

If the clone fails (network, bad path, permissions): tell the user plainly what failed, offer to retry with a different path, and don't proceed until it succeeds.

Store the resolved absolute path as `demoPath` in `tutorial-progress.json` so the resume in the new window can find it.

### Stage 3: tell the user how to open the folder as a workspace

Plain, point-and-click instructions. No terminal:

> Done, the tutorial repo is now on your computer at `~/Nimbalyst-HN-Tutorial`.
>
> Now open it as a Nimbalyst workspace:
>
> 1. Press `Cmd+P` (or `Ctrl+P` on Windows/Linux) to open the Project Manager.
> 2. Click **Open Workspace Folder** (NOT "Create New Workspace", the folder already exists).
> 3. A file picker opens. Navigate to your home folder (on Mac: `Cmd+Shift+H` in the picker; on Windows: type `%USERPROFILE%` into the path bar), click **Nimbalyst-HN-Tutorial**, and click **Open**.
> 4. A new Nimbalyst window opens with the tutorial repo as the workspace.
> 5. In that new window, open a fresh chat and say **"resume the Nimbalyst tutorial"**. I will pick up from where we are now.
>
> You can close this chat after you switch windows. Nothing is lost, the next agent will read your progress file and continue.

### Stage 4: pause this session

The agent in the current session should **stop** here. Tell the user you'll see them in the new window, then wait. Do not proceed with chapter 1 in this window, chapter 1 belongs to the new workspace where the demo is the workspace root.

If you ARE the resumed agent in the new workspace and `tutorial-progress.json` shows the user just finished step 8, jump to step 9 and continue normally.

## 9. Inspect the demo repo before running dev commands

Do not assume the exact package manager, scripts, or framework. Read the demo repo first:

- `README.md`
- `package.json`
- if the repo is split, inspect the relevant frontend and backend `package.json` files too

For the dev track:

- identify the install command
- identify the dev server command
- identify the test command
- tell the user what you found before you run anything

If the repo matches the expected demo shape, you will usually end up with something like:

```bash
npm install --legacy-peer-deps
npm run dev
```

(Run these in the workspace root, that IS the repo.)

If a browser preview is available, tell the user which URL to open.

For the PM track, you can defer starting the app until the first exercise that needs a live preview.

## 10. Drop seed content

Create only the files the workspace needs for the tutorial. If the file already exists, preserve user edits and merge carefully.

### PM track seed files

Create files under `nimbalyst-local/` at the workspace root (the workspace IS the tutorial repo).

Files to create:

- `CLAUDE.md`
  PM-flavored project memory. Keep it short, plain-English, no-em-dash, with a few writing rules.
- `goals.md`
  Three quarterly priorities for a hypothetical HackerNews Ads product, plus three success metrics.
- `plans/welcome.md`
  A tiny plan doc with valid YAML frontmatter so the user sees the format immediately.
- `Product/Competitive/`
  Create the folder.
- `Product/Feedback/`
  Create the folder and add `sample-feedback.csv` with about 10 believable fake quotes about paid acquisition channels.

Tracker items to create (use `tracker_create`, not markdown):


- One **task** in `in-progress`: "Validate HackerNews Ads demand with 5 advertiser conversations."
- Two to three **tasks** in `up-next`: e.g., "Draft sponsored-comment guidelines", "Pick measurement metrics for v1", "Audit Reddit Ads as reference point".
- Two to three **tasks** in `backlog`: e.g., "Brand-safety review", "Pricing model exploration", "Internal demo for design team".

### Dev track seed files

Create files at the workspace root (the workspace IS the tutorial repo).

Files to create:

- `CLAUDE.md`
  Developer-flavored project memory: setup commands, test commands, known gotchas, where to start reading.
- `plans/welcome.md`
  A sample plan doc with frontmatter.

Tracker items to create (use `tracker_create`, not markdown):

Same rule as PM: trackers are first-class, so seed them as real items. Label everything `dev-tutorial` and link to this session.

- Two **decisions** (type `decision`) in `accepted`: e.g., "Use GraphQL for the API layer", "Server-render the home feed for SEO". Short rationale in each body.
- One **decision** in `proposed`: e.g., "Move to Postgres from in-memory store", leaves room for the user to engage with a live decision.
- One **task** in `in-progress`: "Add edit history to comments (5-min grace window)", this is the feature the dev track plans and ships, so seeding it surfaces the through-line.
- Two **tasks** in `backlog`: e.g., "Rate-limit comment posting", "Improve error pages".

### Seeding rules

- Use `tracker_create` for every tracker item. Never write `tracker/tasks.md` or `notes/decisions.md` as a markdown stand-in.
- After seeding, tell the user: "I created real tracker items, not a markdown list. Open `Cmd+T` to see them. We will use these throughout the tutorial."
- If `tracker_create` is unavailable in this environment, say so plainly, fall back to a single markdown file at `nimbalyst-local/tracker-fallback.md`, and skip the tracker-specific exercises later.

## 11. Interface tour

Keep this to about two minutes. Point at each area, **render the screenshot inline in chat**, and wait for confirmation before moving to the next surface.

**Screenshot rule (applies to BOTH tracks, no exceptions):** every `![alt](url)` reference in this section MUST be sent to the user as actual markdown so the image renders in chat. Do not summarize, do not omit, do not say "see the docs." The screenshots are the tour. If you skip them, the user doesn't see the surface you're describing. The dev track in particular has historically had screenshots dropped, do not repeat that.

1. **Files Mode** (`Cmd+E`)
   Left sidebar for the file tree, editor in the center. Show the three ways to open a file so the user picks whichever fits their habit:
  - **Click it in the tree** on the left.
  - **Search the tree** with the filter box at the top of the sidebar, good when you know roughly where the file lives.
  - **Quick open** with `Cmd+O`, fuzzy-search any file in the workspace by name. **Fastest once you know the filename.**

   Have them try opening a seed file (PM: `nimbalyst-local/goals.md`; Dev: `plans/welcome.md`) using whichever path they prefer.

   ![File tree](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-workspace-file-tree.webp)

2. **Agent Mode** (`Cmd+K`)
   Point out the two side panels in Agent Mode:
  - **Sessions list on the left. Every chat thread you've run lives here.** Search by keyword, sort by most recent or name, click any session to resume it exactly where it left off. **Long-running work doesn't have to live in one giant thread.**
  - **Edited files on the right.** As the agent edits files in a session, they pile up in the right-hand panel. Click a file to open it inline for quick review. **Right-click to open it in Files Mode for a full editor and diff view.**

   Point them at the **Agent Permissions** indicator in the bottom-left of the window (or the trust badge in the title bar). It shows the current mode for this workspace and lets them change it under Change permission mode.

3. **Plan Mode toggle**
   It lives in the bar directly above the message input. Plan Mode is for planning before edits, Agent Mode is for execution. If the provider does not support Plan Mode, say so and simulate it by explicitly doing a planning-only turn.

4. **Diff review**
   In Files Mode, AI edits appear with a diff approval bar. Point out `Keep`, `Revert`, and when available `Keep all` / `Revert all`.

   ![Approvals diff](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/ai-diff-review.webp)

5. **Tracker Mode** (`Cmd+T`)
   Trackers aren't just bookkeeping. You can launch a session from a tracker item, refer to items from chat by name or issue key, and turn raw notes into structured work. The items we seeded in step 10 are sitting in here right now.

   ![Tracker view](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-task-tracker.webp)

**Dev track only, add these two as full surfaces, not footnotes:**

6. **Integrated terminal** (`` Ctrl+` ``)
   Full terminal in the same window as your editor, agent, files, and tracker. Run dev servers, tests, git commands, anything you'd normally drop to iTerm for. Each workspace gets its own terminal sessions. When the agent runs commands, you see them flow through this same terminal, so you can take over a process the agent started.

   ![Terminal panel](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-terminal.webp)

7. **Worktree panel** (in the sidebar)
   Each worktree is an isolated copy of the repo on its own branch, with its own agent sessions. Spawn one to try a risky refactor, run two in parallel on different features, throw one away without disturbing your main branch. We exercise this in chapter 2 of the dev track.

   ![Worktree sessions](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-worktree-sessions.webp)

Then say:

> Ready. Let's start chapter 1.

---

# PM TRACK

Only run this section if `track: pm`.

All file paths in the exercises below are relative to the workspace root, which IS the cloned HackerNews demo repo.

## Chapter 1: Research

> The old bottleneck was collecting information. The new bottleneck is deciding what matters. Use the time savings for judgment, not for more noise.

### Exercise 1.1: Design the research plan

Have the user paste:

> **Paste this:**
>
> I'm exploring whether HackerNews should add sponsored content for small advertisers: sponsored feed posts and sponsored placements inside comment threads. Design a 30-minute research plan I can execute today. Cover the 3 to 4 questions I most need answered, the artifacts produced, and the order to run things. Save it to nimbalyst-local/Product/research-plan.md.

When the file lands, show them how to open it:

- In Agent Mode, click the filename in the edited-files list **on the right** to open it inline.
- In Agent Mode, right-click the filename in the edited-files list and choose **Open in Files Mode** for the full editor and diff view.
- Switch to Files Mode (`Cmd+E`) and open it from the file tree.
- Or quick-open with `Cmd+O` and fuzzy-search the filename. Fastest once you know the name.

Then confirm they found it.

Once it's open, encourage them to actually work the document, this is the moment the tutorial stops being a demo and starts being theirs. Give them three concrete moves:

1. **Accept the agent's changes.** In the diff bar at the top of the editor, click `Keep all` to lock in what the agent wrote. They can also `Keep` or `Revert` individual chunks first if something feels off.
2. **Make their own edits.** Open the file and type. Tighten a framing question. Cut a bullet. Add a fifth thing they want to learn. The doc is theirs now.
3. **Ask the agent for more changes.** Back in the chat, paste something like:

   > **Paste this:**
   >
   > In @nimbalyst-local/Product/research-plan.md, add a "Risks and unknowns" section with the three things most likely to make this research worthless.

   Reference the file with `@` so the agent grounds on it.

Tell them this loop, accept, edit by hand, ask for more, is how most real work happens in Nimbalyst.

### Exercise 1.2: Competitive UI breakdown

Have the user paste:

> **Paste this:**
>
> We're exploring sponsored content inside HackerNews comment threads for small advertisers. Analyze Reddit Ads as the closest reference point. Cover what works for advertisers, what works for readers, what destroys trust, and what we should copy vs avoid. Save to nimbalyst-local/Product/Competitive/reddit-ads.md.

Then offer two useful follow-ups:

- `Add screenshots inline so the doc is self-contained.`
- `Summarize the top three takeaways at the top.`

### Exercise 1.3: Customer feedback synthesis

Have the user paste:

> **Paste this:**
>
> Look at the sample feedback files in nimbalyst-local/Product/Feedback/. If there are more than three files, use sub-agents. Extract what founders say about paid acquisition: the main problems, which channels work, and whether anyone mentions Reddit specifically. Save the structured findings as a real CSV file at nimbalyst-local/Product/Feedback/synthesis.csv (columns: channel, mentions, positive, negative, neutral, headline_quote). Do not wrap the CSV in markdown. Reply in chat with a one-paragraph narrative summarizing the patterns, and end with the one tension worth flagging for the brief.

### Exercise 1.4: Data and charts

Have the user paste:

> **Paste this:**
>
> Read nimbalyst-local/Product/Feedback/synthesis.csv (the CSV you saved in the last exercise). Show me a bar chart of mentions by channel, then a second chart of positive vs negative by channel. Use display_to_user. After the charts, tell me what jumps out and what I should not conclude from this sample size.

When the charts come back, point out two things the user probably hasn't noticed yet:

- **The view-mode switcher at the top-left** has three buttons: `FILES`, a split icon, and `AGENT`. If they've had a file open, they're in split mode and the chat is squeezed. Click `AGENT` to give the agent response the full width, the charts read better, the narrative doesn't wrap weirdly, and the takeaway at the end stops getting cut off. Click `FILES` to flip back to full file view, or the split icon for both side by side. They can switch any time.
- **The charts are interactive.** Hover any bar to see the exact value and the label. Eyeballing "Reddit looks bigger than X" is fine, but the next exercise needs real numbers for the brief, not impressions.

Then push the user back into the loop they learned in 1.1, this time on a CSV:

1. **Open the CSV.** Click `synthesis.csv` in the edited-files list on the right (or `Cmd+O` to fuzzy-find it, or `Cmd+E` → Files Mode → the Feedback folder). Nimbalyst opens CSVs in a spreadsheet view, not as text.
2. **Play with it by hand.** Re-sort by mentions, delete a row that feels like noise, fix a miscategorized channel, add a row for a channel you remember being mentioned. The data is theirs to shape, not just consume.
3. **Ask the agent for more.** Back in the chat, paste something like:

   > **Paste this:**
   >
   > Re-read @nimbalyst-local/Product/Feedback/synthesis.csv after my edits and regenerate both charts. Then tell me whether my edits changed the takeaway.

The point: charts aren't the artifact, the decision is. Cleaning the data before trusting the chart is part of the work.

### Exercise 1.5: Decision-ready brief

Have the user paste:

> **Paste this:**
>
> Synthesize Product/Competitive/ and Product/Feedback/ into one decision-ready brief at nimbalyst-local/Product/Briefs/ads-go-no-go.md. Structure it as: Recommendation (one sentence), Evidence (3 bullets citing specific files), Risks (3 bullets), Next steps (3 concrete moves with owners and dates). Cite specific competitors and quotes. No fluff.

**Chapter 1 checkpoint**

> You now have a research plan, a competitive breakdown, feedback synthesis, charts, and a brief. The point was not more documents. The point was getting to a decision faster.

## Chapter 2: Plan

> A weak plan executed at AI speed gives you a polished mess. Slow down here.

### Exercise 2.1: Write a plan document

Skip Plan Mode for this exercise. Plan Mode is for technical implementation planning, the agent stays in a read-only scratch state until you approve, which is useful when it's about to write code, but it adds friction when the goal is just a PM-style plan doc. Write the plan straight into a file.

Have the user paste:

> **Paste this:**
>
> Build a plan for the HackerNews Ads interface and save it to nimbalyst-local/plans/hackernews-ads.md with proper frontmatter. Cover jobs-to-be-done, success metrics, the three main user flows, risks, trust-and-safety constraints, and what to ship in v1. Do not write code or mockups yet.

When the plan lands, remind the user how to open it (edited-files list on the right, right-click → Open in Files Mode, or `Cmd+O` to fuzzy-find, or `Cmd+E` for Files Mode). Walk through it together. Push back on anything weak.

### Exercise 2.2: Mockup before you iterate

![Mockup editor](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/editor-mockup.webp)

Plans go further when there's something to point at. Build the mockup before iterating the plan so the next round of edits can ground on a visual, not just bullets.

This is a three-stage exercise. **Give the user only the stage they're on.** Do not preview the annotate-and-v2 stages while the v1 mockup is still rendering.

**Stage 1: generate the v1 mockup.** Have the user paste, and then stop:

> **Paste this:**
>
> Create a mockup at nimbalyst-local/mockups/ads-campaign-creation.mockup.html for the main screen an advertiser uses to create a new HackerNews ad campaign. Include targeting, budget, schedule, and a live preview of the sponsored comment as it would appear in a thread. Keep a recognizable old-school Hacker News feel, but use clean modern controls.

Wait for the mockup file to finish generating.

**Stage 2: mark it up.** Only after the mockup is on disk, tell the user:

> Open `ads-campaign-creation.mockup.html` from the edited-files list on the right. It opens in the mockup editor. Use the drawing tools to leave **visual marks only**:
>
> - draw one circle around something you'd change
> - draw one arrow pointing at something else
>
> Don't type text onto the mockup, the descriptive feedback goes in your next chat prompt, not on the canvas. Come back here when you're done drawing.

Wait for the user to confirm they've marked it up.

**Stage 3: ask for v2 with the feedback in chat.** The pattern is: visual marks on the mockup, written feedback in the prompt. Have them paste a prompt like this (they should rewrite the bracketed parts in their own words):

> **Paste this:**
>
> Look at my circles and arrows on @nimbalyst-local/mockups/ads-campaign-creation.mockup.html and generate a v2. The circle is on [what they circled and what's wrong with it]. The arrow points at [what they want changed there]. Also [any other feedback they want].

The mockup carries the "where," the chat prompt carries the "what" and "why."

### Exercise 2.3: Iterate the plan with research and the mockup

Have the user paste:

> **Paste this:**
>
> Update nimbalyst-local/plans/hackernews-ads.md using @nimbalyst-local/Product/Competitive/, @nimbalyst-local/Product/Feedback/, and @nimbalyst-local/mockups/ads-campaign-creation.mockup.html. Add a "Differentiation" section with three concrete product decisions based on the research, and a "UI decisions" section grounded in the mockup. Reference specific competitors, customer quotes, and screen elements.

Review the diff, `Keep` or `Revert` per chunk (same flow as 1.1).

### Exercise 2.4 (optional): Stress-test the plan

Skip if the tutorial is running long or the user wants to keep momentum. Worth doing if they want to feel how cheap criticism becomes once the plan is on disk.

Have the user paste:

> **Paste this:**
>
> Poke holes in nimbalyst-local/plans/hackernews-ads.md. What would a senior engineer push back on? What would a designer hate? What would a trust-and-safety lead flag? Be specific and harsh. Suggest fixes for the biggest three.

If the critique is useful, follow with:

> **Paste this:**
>
> Apply the top three fixes directly into the plan doc. Keep the plan tighter, not longer.

**Chapter 2 checkpoint**

> You planned the v1, mocked it up, then folded research and the visual back into the plan. The order matters: a plan with a mockup attached gets stronger feedback than a plan without one.

## Chapter 3: Execute

> PMs do not need to become engineers. They do need a tighter loop with the codebase.

### Exercise 3.1: Turn the plan into tracker work

This is where the plan stops being a doc and starts being work. Nimbalyst has a built-in tracker, kanban, items, custom types, all of it lives in the app, no external tool required. This exercise is a five-stage walk through the tracker loop: create from plan → open in Tracker Mode → hand-edit → move it on the kanban → launch a session from it.

**Give the user one stage at a time.** Don't preview later stages while an earlier one is still in flight.

**Stage 1: generate the tracker items from the plan.** Have the user paste:

> **Paste this:**
>
> Take @nimbalyst-local/plans/hackernews-ads.md and create tracker items for it. One parent task called "HackerNews Ads MVP" and one child task per major workstream in the plan. Use acceptance criteria from the doc for each child item. Label everything "pm-tutorial". Link each item to this session.

Wait until the items are created. The agent should report back with issue keys (e.g., `NIM-12`, `NIM-13`).

**Stage 2: open Tracker Mode and look at what got made.** Tell the user:

> Hit `Cmd+T` to open Tracker Mode. You'll see your new items on the kanban, probably in the **Backlog** column. The parent "HackerNews Ads MVP" should be there along with its children.

Wait for confirmation they can see the items.

**Stage 3: open one item and edit it by hand.** Tell the user:

> Click one of the child items to open it in the detail pane. Read the description the agent wrote. Tighten the wording. Add an acceptance criterion the agent missed. Change the priority if it's wrong. Trackers are documents you own, same as everything else.

Wait for them to confirm they've edited.

**Stage 4: move it on the kanban.** Tell the user:

> Drag the item you just edited from **Backlog** into **In progress**. Drag a different one into **In review**. Watch the column counts update. This is the same drag-to-move pattern you'd use on any kanban board, except the agent can see and act on what's where.

Now have them ask the agent about it. Paste:

> **Paste this:**
>
> Look at the current state of the "pm-tutorial" tracker items. Tell me which ones are in progress, which are in review, and which haven't started. Flag anything that looks like it shouldn't be in its current column.

This proves the kanban state is real, the agent reads it just like a teammate would.

**Stage 5: launch a session from a tracker item.** Tell the user:

> Open one of the in-progress items in the detail pane. Find the **Launch Session** button. Click it.

This spins up a new chat session pre-loaded with the tracker item as context. In the new session, have them paste:

> **Paste this:**
>
> Use this tracker item as the brief. Summarize the goal, list the next three concrete moves, and update the tracker status if anything's already true.

When the new session is rolling, tell them:

> This is the one place the tutorial leaves a single chat. Real work bounces between tracker items and sessions all day. You're seeing the seam.

Have them switch back to the main tutorial session (sessions list on the left, click the one they started this tutorial in) when they're ready for Exercise 3.2.

### Exercise 3.2: Team activity

This exercise reaches outside Nimbalyst, it needs a **GitHub MCP** to read your repo's activity. If it's not connected, this is the right moment to learn how.

#### How to add an MCP integration (one-time setup)

MCP servers are how Nimbalyst gives the agent live access to external systems like GitHub, Slack, Linear, your analytics warehouse, and so on. Once you've added one, the rest are reps.

Walk the user through this:

1. Open **Settings** (gear icon, bottom-left).
2. Pick the scope at the top, **Project** for this workspace only, **User** to make it available everywhere.
3. Click **MCP Servers** in the sidebar.
4. Click **Add Server**. Paste the JSON config from the integration's docs, or ask the agent to generate it: `Generate an MCP server config for GitHub and tell me exactly where to paste it in Settings → MCP Servers.`
5. Save. The integration's tools appear in the agent's tool list automatically, no restart.

Once GitHub MCP is connected, have the user paste:

> **Paste this:**
>
> Look at the last 30 days of GitHub activity in this repo. Tell me who shipped what, what's open, and what looks stale. Group by area. Flag anything that overlaps with the ads plan.

### Exercise 3.3: Understand the architecture

**Teach first (in chat):**

> PMs don't need to read code to make sharper product calls, they need to know roughly where the levers are. Asking the agent for a plain-English architecture walkthrough is the cheapest way to build that map. The point isn't to learn the codebase. The point is to stop asking impossible-sounding questions and start asking specific ones.

Have the user paste:

> **Paste this:**
>
> Walk me through how the HackerNews homepage works in this codebase. Explain it like I'm a smart non-coder. Cover the request flow, the main files involved, and where I would change something to insert a new visual treatment in the feed.

Follow with:

> **Paste this:**
>
> If we wanted to insert a sponsored post every fifth item, which file or files would likely change, and how risky is that change?

**Teach last (in chat):**

> What you just got is the difference between "we should add sponsored posts" (vague, hard to estimate) and "we'd change `FeedList.js` to interleave a sponsored item every fifth row, low risk" (specific, scopable). That move, getting an architecture answer good enough to write a concrete proposal, is most of what reading code is for, as a PM.

### Exercise 3.4: Ship one small UI change

**Teach first (in chat):**

> The fastest way to feel the loop tighten is to actually ship a tiny change yourself. We're going to add a "Sponsored" badge to the homepage feed, a copy/visual change, no business logic. Plan Mode first so you see the change before any code lands.
>
> The point is not "PMs should ship code now." It's that the line between "I have an idea" and "I can show it" used to be a meeting with engineering. Now it's a Plan Mode prompt and a diff review. Use that for prototypes and visual proofs, not for production systems.

If the demo app is not already running, start it now using the repo's actual dev command.

If Plan Mode is available, enter it first.

Have the user paste:

> **Paste this:**
>
> Plan a very small UI change. Add a "Sponsored" badge that can show next to a post title in the homepage feed. Match the existing visual style. No data plumbing, no ranking logic, no admin UI. Just the badge component, the placement, and one example usage for visual review.

After the plan is approved, implement it, review the diff, and refresh the local preview.

**Teach last (in chat):**

> This is the PM-safe zone: copy, labels, visual affordances, lightweight scaffolds. Not auth, money, ranking logic, or data model changes. Use the agent to build prototypes you can put in front of users tomorrow. Hand the real implementation to engineering with the prototype as the spec.

### Exercise 3.5: Architecture diagram

![Excalidraw](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/editor-excalidraw.webp)

**Teach first (in chat):**

> Architecture diagrams used to be either a) a slide your engineer drew for a presentation, or b) a doc that went stale the day it was created. With Nimbalyst, you ask for one, edit it by hand to match your mental model, and re-prompt to extend it whenever the system changes. Living diagram, you own it, no engineer required.

Have the user paste:

> **Paste this:**
>
> Build an Excalidraw diagram of how this app is structured. Show the frontend, the API layer, the database, the normal request flow, and where ad-serving logic would slot in. Save to nimbalyst-local/architecture.excalidraw.

After the diagram lands, tell them:

> Open the file from the edited-files list on the right. Excalidraw diagrams are fully editable, move a box, rename a label, drag an arrow somewhere truer. The agent's first draft is rarely the final shape. Make it match how you actually think about the system.

### Exercise 3.6: Propose a clean commit

**Teach first (in chat):**

> Even a PM track ends with a commit. All the work you did today, the research, the plan, the mockup, the tracker items, lives in files. Committing them means they survive a refresh, they're in git history, and a teammate who clones this repo tomorrow can read your work.
>
> Nimbalyst's commit-proposal widget makes this push-button instead of terminal commands. We'll use it here so you see the surface.

Have the user paste:

> **Paste this:**
>
> Commit today's PM tutorial work using developer_git_commit_proposal. Keep the title short and clear: "PM tutorial: ads research and planning".

When the commit proposal card renders, walk them through it:

> The commit proposal card just appeared. Three things to look at before clicking Approve:
>
> 1. **The title field.** Edit it if it's not what you'd write yourself.
> 2. **The file list with checkboxes.** Every file the agent thinks should be in this commit. Uncheck anything that doesn't belong.
> 3. **The Manual / Smart toggle.** Stick with **Manual** while you're learning, it commits exactly what you check, nothing clever.
>
> Edit the title to your liking, then click **Approve**.

**Teach last (in chat):**

> This is the same commit widget the dev track uses. You can use it for any commit, anywhere in Nimbalyst, markdown docs, mockups, plans, code, whatever. It's not a dev tool, it's a workspace tool.

**Chapter 3 checkpoint**

> You turned research into a plan, mapped it onto work, read the codebase without drowning in it, made one safe UI change, packaged the work cleanly, and now have an architecture diagram you can keep current. None of that required an engineer.

---

# DEV TRACK

Only run this section if `track: dev`.

All file paths in the exercises below are relative to the workspace root, which IS the cloned HackerNews demo repo.

## Chapter 1: Orient

> Ramping into a new codebase takes too long when you try to hold the entire system in your head before doing any work. Use the agent to build a map first.

### Exercise 1.1: Codebase map via parallel sub-agents

Have the user paste:

> **Paste this:**
>
> Spawn three parallel sub-agents for read-only exploration. One maps the data layer. One maps the request and API flow. One maps the UI. Each report should stay under 250 words, list key files, and end with a one-paragraph architecture summary. Then synthesize everything into notes/architecture.md.

When the file lands, remind the user how to open it (edited-files list on the right, right-click → Open in Files Mode, or `Cmd+O` to fuzzy-find, or `Cmd+E` for Files Mode). Then push them into the loop they'll use all day:

1. **Read the map.** Skim it. Where does the agent's mental model not match yours?
2. **Edit by hand.** Cut a section that's wrong. Add a one-liner about a quirk the agent missed. Tighten a file path that's outdated. The map is theirs to fix.
3. **Ask the agent for more.** Paste something like:

   > **Paste this:**
   >
   > In @notes/architecture.md, add a "Gotchas" section with the three non-obvious things a new contributor would trip over.

The map is your context floor for the rest of the chapter. Time spent fixing it pays back every time the agent grounds on it later.

### Exercise 1.2: Plain-English deep dive

Have the user paste:

> **Paste this:**
>
> Walk me through how a post gets from storage to the homepage in this codebase. Cover the schema or API layer, the server-side path, the main UI component, and any client-side caching if present. Include file paths. Assume I know web basics, so skip framework 101.

The walkthrough usually comes back long. If the user's screen is in split mode (file open + chat squeezed), point them at the view-mode switcher at the top-left, click `AGENT` to give the response full width. They can flip back to `FILES` or split whenever they want.

Personalize the follow-up:

- frontend users: ask where visual composition and state changes live
- backend users: ask where validation, schema, and mutation logic live
- infra users: ask how the local stack boots and where production assumptions leak into development

### Exercise 1.3: Architecture diagram

![Excalidraw](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/editor-excalidraw.webp)

Two-stage exercise. **Give the user only the stage they're on.**

**Stage 1: generate the diagram.** Have the user paste:

> **Paste this:**
>
> Build an Excalidraw diagram from notes/architecture.md. Show browser, frontend app, API layer, database, and the normal request flow. Save to notes/architecture.excalidraw.

Wait for the file to land. Then remind the user how to open it (edited-files list on the right, right-click → Open in Files Mode, or `Cmd+O` to fuzzy-find, or `Cmd+E` for Files Mode).

**Stage 2: make it yours.** Once the diagram is open, tell them:

> Excalidraw diagrams are editable. Move a box that's in the wrong place. Rename a label. Drag an arrow somewhere truer. Then come back here.

When they're done, optionally have them paste a follow-up prompt to extend it:

> **Paste this:**
>
> Update @notes/architecture.excalidraw to add the comment-editing flow we're about to build. Show where the grace-window check lives and which component renders the edit affordance. Match the existing visual style.

Same pattern as the mockup exercise in PM: the diagram carries the "where," the chat prompt carries the "what" and "why."

### Exercise 1.4: Mockup the UI affordance before you plan the change

![Mockup editor](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/editor-mockup.webp)

**Teach first (in chat):**

> Mockups are not just a PM thing. Before planning a UI change, sketching the affordance in 30 seconds will surface design questions that you'd otherwise discover halfway through implementation: where does the edit button live, what does the "edited" indicator look like, what happens when the grace window expires, do you show a countdown or just disappear the affordance silently. Cheaper to argue with a visual than to undo committed code.
>
> Nimbalyst has a built-in mockup editor (`.mockup.html` files). The agent generates HTML/CSS that renders interactively, you can click around it, mark it up with the drawing tools, and have the agent regenerate based on your annotations. Same accept-edit-iterate loop as code, but for visual design.

Three-stage exercise. **Give the user only the stage they're on.** Do not preview the annotate-and-v2 stages while the v1 mockup is still rendering.

**Stage 1: generate the v1 mockup.** Have the user paste, then stop:

> **Paste this:**
>
> Create a mockup at nimbalyst-local/mockups/comment-editing.mockup.html showing the comment-editing UI affordance. Include: a comment in its normal state, the edit button visible only within the five-minute grace window, the inline edit form once clicked, an "edited" indicator after save, and the visual state when the grace window has expired. Match the existing HackerNews visual style, clean, plain, no flourishes.

Wait for the mockup file to land.

**Stage 2: mark it up.** Once the mockup is open:

> Open `comment-editing.mockup.html` from the edited-files list on the right. It opens in the mockup editor, fully interactive, click the edit button to feel the flow.
>
> Use the drawing tools at the top of the editor to leave **visual marks only**:
>
> - draw one circle around something you'd change (e.g., "this button is in the wrong place" or "this 'edited' indicator is too loud")
> - draw one arrow pointing at where something should move or what should change
>
> Don't type text onto the mockup, descriptive feedback goes in your next chat prompt, not on the canvas. Come back here when you're done drawing.

Wait for the user to confirm they've marked it up.

**Stage 3: ask for v2 with the feedback in chat.** The pattern: visual marks on the mockup, written feedback in the prompt. Have them paste a prompt like this (they should rewrite the bracketed parts in their own words):

> **Paste this:**
>
> Look at my circles and arrows on @nimbalyst-local/mockups/comment-editing.mockup.html and generate a v2. The circle is on [what they circled and what's wrong with it]. The arrow points at [what they want changed there]. Also [any other feedback they want].

**Teach last (in chat):**

> The mockup is now the artifact the next chapter's plan will reference. Instead of the agent guessing at the UI affordance, the plan can say "implement the affordance from `comment-editing.mockup.html`" and you've already locked in what it should look like. That's the difference between planning in the abstract and planning against a visual contract.

**Chapter 1 checkpoint**

> You now have a written map, a targeted walkthrough, an architecture diagram, and a UI mockup of the affordance. That is enough context to plan and write the code without guessing.

## Chapter 2: Build

> The point of worktrees is parallel motion without context collisions.

**Feature for the tutorial:** comment editing with a five-minute grace window.

### Exercise 2.1: Plan the change in Plan Mode, then persist

**Teach first (one short paragraph in chat):**

> Plan Mode is the move that separates "Cursor-style autocomplete" from agent-driven work. The agent reads, thinks, drafts a plan in chat, but cannot touch your file system until you approve. You get to argue with the plan before any code lands. That's worth doing for any change touching more than one file or one concept. We're doing it now because comment editing touches the data model, an API, validation, the UI, and tests, five places to get wrong if the plan is wrong.

Unlike the PM track, **Plan Mode pays off here.** The agent is about to write real code, and Plan Mode constrains it to a read-only scratch state so you can review the plan before any file changes hit disk. This is exactly the case it was built for.

Two-stage exercise. Stage-gate it.

**Stage 1: plan in Plan Mode.** If Plan Mode exists for the current provider, have the user switch into it (`Shift+Tab` in most providers). If not, simulate a planning-only turn.

Have them paste:

> **Paste this:**
>
> We're adding comment editing with a five-minute grace window. Plan the change. Cover the data model impact, the API or mutation change, server-side validation, the UI affordance, and the tests we need. Reference specific files from @notes/architecture.md and ground the UI section on @nimbalyst-local/mockups/comment-editing.mockup.html. Do not write code yet.

When the plan returns in chat, tell the user something like:

> The plan is up there in the chat, not on disk yet. This is the moment to push back. Three things you can do right now, before we save it:
>
> 1. **Read it.** Skim each section. Where does the plan miss something obvious about your codebase? Where does it overreach?
> 2. **Push back in chat.** Just type. "The data model section is wrong, comments are already versioned, rework it." "Drop the server-validation section, that's covered by the existing middleware." The agent revises in-place. No file written yet.
> 3. **Ask for more.** "Add a rollback plan." "Spell out the migration." "List the test cases line by line." Keep going until the plan reads like something you'd hand to a teammate.

Do not approve implementation yet. The save happens in Stage 2, once the plan reads right.

**Stage 2: exit Plan Mode, then persist.** The agent's first turn in Plan Mode finishes with a "Ready to exit planning mode?" widget. Before the user picks anything, warn them about the wording:

> Heads up, both "Yes" options on this widget say "implement," but we're **not** implementing in this session. We're going to save the plan to disk in a moment, then spin up a worktree next exercise to do the actual implementation cleanly. Ignore the "implement" wording for now.
>
> Pick **option 2: "Yes, proceed in this same session."** That just exits Plan Mode and lets you keep working in this chat. The agent will NOT auto-start implementing, it'll wait for your next prompt.
>
> Do **not** pick option 1 ("start new session and implement"). That kicks off implementation in the wrong place (no worktree, full agent loose on your working tree).

Once they've clicked option 2, have them paste:

> **Paste this:**
>
> Save the plan we just agreed on to plans/comment-editing.md with proper frontmatter. Set the status to ready-for-development. Match what's in chat, don't rewrite or expand it.

After the plan is on disk, remind the user how to open it. Before the worktree exercise, push them through one quick pass of the loop:

1. **Open the plan** in Files Mode.
2. **Hand-edit it.** Adjust the test list, tighten a step, mark a section as out-of-scope for v1. The plan is the brief the worktree will read.
3. **Iterate with the agent if you want.** Paste something like:

   > **Paste this:**
>
   > In @plans/comment-editing.md, expand the "Tests we need" section into a concrete file-by-file checklist.

A sharper plan now means less churn inside the worktree later.

### Exercise 2.2: Turn the plan into tracker work

**Teach first (in chat):**

> A plan in a markdown file is a document. A plan in the tracker is *work*. Same content, different surface. Why care?
>
> 1. **The agent can read tracker state.** When a worktree session asks "what should I work on?", it can query the tracker, not parse a markdown file. Status, acceptance criteria, child items, all queryable.
> 2. **You can drag things across columns.** Backlog → In progress → In review → Done. The agent sees that drag and respects it. Move something to Done, the agent stops trying to "finish" it.
> 3. **Issue keys are addressable.** Once an item is `NIM-12`, you can reference it from any session, link a worktree to it, point a commit at it, and it shows up everywhere.
> 4. **Trackers live with the project.** No external Linear/Jira/Asana required (though you can sync to those later). The team that opens this repo tomorrow sees the same kanban you see now.
>
> We're going to turn the comment-editing plan into a parent task with children, drag it into In progress, and ground the worktree session on it. That's the real workflow, not "agent writes code into the void."

This is the bridge from plan-as-document to plan-as-work. Nimbalyst has a built-in tracker, kanban, items, custom types, all of it lives in the app, no external tool required. The next exercise (the worktree) is going to ground on a real tracker item, not just a markdown file.

Five short stages. **Give the user one stage at a time.**

**Stage 1: generate tracker items from the plan.** Have the user paste:

> **Paste this:**
>
> Take @plans/comment-editing.md and create tracker items for it. One parent task called "Comment editing with grace window" and one child task per workstream from the plan: data model, API/mutation, server validation, UI affordance, tests. Use acceptance criteria from the plan for each child item. Label everything "dev-tutorial". Link each item to this session.

Wait until the items are created and the agent reports the issue keys (e.g., `NIM-12`, `NIM-13`).

**Stage 2: open Tracker Mode.** Tell the user:

> Hit `Cmd+T` to open Tracker Mode. The new items should be on the kanban, probably in the **Backlog** column. The parent "Comment editing with grace window" should be there with its children grouped under it.

Wait for confirmation.

**Stage 3: open one item and edit it by hand.** Tell the user:

> Click the "tests" child item to open it in the detail pane. Read what the agent wrote. Add one specific test case it missed (e.g., a user editing a comment at second 299 of the grace window). Trackers are documents you own.

Wait for them to confirm they've edited.

**Stage 4: move the parent on the kanban.** Tell the user:

> Drag the parent item from **Backlog** into **In progress**. We're about to start work on it.

Now have them paste:

> **Paste this:**
>
> Look at the "dev-tutorial" tracker items. Tell me which one is in progress, summarize the parent's acceptance criteria, and recommend which child to start with.

This proves the agent sees the kanban state.

**Stage 5: note the issue key for the next exercise.** Tell the user to write down (or just keep open) the issue key for the parent item. They'll reference it from chat in the worktree exercise next. The worktree will be grounded on the tracker item, not just the plan file.

**Teach last (in chat, before moving on):**

> Notice what just happened: you went from a chat conversation → a markdown plan you edited by hand → six tracker items with acceptance criteria → a parent task you dragged into In progress. Each layer is more structured than the last, and each layer's still yours to edit. That's the Nimbalyst loop for moving from "I have an idea" to "the agent has a brief it can execute against."

### Exercise 2.3: First worktree

![Worktrees](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/agents-worktree-sessions.webp)

**Teach first (in chat):**

> Quick git refresher because worktrees confuse almost everyone the first time. A normal `git checkout` swaps branches in place, your one working copy becomes a different branch. If you want to compare two branches, you have to keep switching. If the agent is mid-edit when you switch, things break.
>
> A **worktree** is a second, third, fourth working copy of the same repo, each on its own branch, all sharing the same `.git` history. They live in separate folders on disk. You can edit, build, and run tests in worktree A while worktree B is doing something else. No switching.
>
> In Nimbalyst, each worktree gets:
> - Its own folder on disk (so files, build artifacts, node_modules, etc. don't collide).
> - Its own agent session list (sessions in worktree A don't see worktree B's chats).
> - Its own edited-files list (the right-hand panel only shows files edited inside that worktree).
> - Its own tracker view (filtered to items active in that worktree).
>
> **When to spawn a worktree:** any time you'd otherwise be afraid the agent might tangle your in-flight changes with something new. Risky refactor. Parallel feature. Trying two approaches to the same problem. Reviewing a PR while still working on your own branch.
>
> We're spawning one now to implement the comment-editing feature without disturbing the main session you've been working in.

Two-stage exercise. Don't preview Stage 2 while Stage 1 is still spinning up.

**Stage 1: spawn the worktree.** Replace `<PARENT_KEY>` with the issue key from the previous exercise. Have the user paste:

> **Paste this:**
>
> Create a git worktree for the comment-editing feature on branch feature/comment-editing. Use tracker item <PARENT_KEY> and @plans/comment-editing.md as the brief. In that worktree, implement the data-model or storage changes and the API mutation. Run the relevant tests after each substantive change. Report back when done or blocked, and update the tracker item status as you make progress.

Wait for the worktree to be created (you'll see the new worktree appear in the worktree panel and a new session start inside it).

**Stage 2: tour the worktree panel.** Once the new session is running, walk the user through the panel:

> Look at the worktree panel in the left sidebar (above the sessions list). You should see two entries now:
>
> 1. **Main** (or your default branch), where we've been working.
> 2. **feature/comment-editing**, the new worktree, with a spinner if the agent is still working.
>
> Things to try while the agent runs:
>
> - **Click the new worktree.** The whole UI swaps: sessions list shows only this worktree's sessions, edited-files panel on the right shows only files this worktree is touching, the tracker filters to items active here. Same Nimbalyst window, different context.
> - **Click back to Main.** Your original chat is exactly where you left it. Nothing's lost. The agent in the other worktree keeps running in the background.
> - **Notice the badge on the worktree row.** It shows running status and unread agent messages, so you know which worktrees need your attention without clicking into each one.
>
> This is what people mean when they say "Nimbalyst is built for parallelism." Not "run two prompts at once", "run two whole workflows at once with no context bleed."

Then let it run in the background while you move on to Exercise 2.4.

### Exercise 2.4: Second worktree in parallel

**Teach first (in chat):**

> Two worktrees is where the real lift shows up. With one worktree, you're just doing safer single-track work. With two, you're actually parallelizing, one agent doing the feature work, another doing some adjacent improvement, both running unattended while you review whichever finishes first. This is how a one-person team feels like a three-person team.
>
> The trick is to pick worktree #2's task so it doesn't collide with #1. Different files, different concern, ideally a small refactor or a chore. We'll spawn one that extracts a timestamp utility, touches different files than comment editing, can't conflict, finishes quickly.

Have the user paste:

> **Paste this:**
>
> Spawn a second worktree on branch chore/timestamp-utility. Extract timestamp formatting logic into a dedicated helper with unit tests. Keep the change small and self-contained. Report back when done.

While both worktrees run, tell the user:

> You now have two worktrees active. Three things to do while they cook:
>
> 1. **Click between them.** Feel how complete the context switch is, sessions, files, tracker, all swap.
> 2. **Watch the worktree badges.** Each row shows running/idle status. You don't need to babysit either one; you'll see when they want attention.
> 3. **Open Tracker Mode (`Cmd+T`) from either worktree.** The kanban shows the parent task you put in In progress earlier, and the second worktree may have created its own item under `chore/`. The tracker is shared across worktrees, it's the *project's* state, not any one worktree's.
>
> When one of them reports back, leave the other running and come back to me here.

Wait until at least one of the two worktrees reports back before moving on.

**Teach last (in chat, before moving on):**

> What you just did takes a normal dev day from "I can only focus on one thing" to "I can have two streams going and check in on them when each finishes." Apply this anywhere you've got a small chore stacked behind a real feature, or any time you want to try two approaches to the same problem in parallel and compare diffs.

### Exercise 2.5: Drive the implementation

**Teach first (in chat):**

> When the agent is implementing, your job changes from "writing code" to "reviewing and steering." This is the part that takes the most getting used to. The four habits below aren't a checklist; they're the rhythm that keeps you in the loop instead of rubber-stamping diffs you don't actually understand.

Switch back to the comment-editing worktree and walk through four habits, explaining the *why* of each:

1. **Review the proposed diff before accepting it.** Open the file in Files Mode, look at every change. The diff bar at the top of the editor shows `Keep` / `Revert` per chunk. Reject anything that doesn't smell right. The agent will revise.
   *Why:* the moment you start clicking "Keep all" without reading, you've handed over judgment. Catching one wrong change here saves an hour of debugging downstream.

2. **Ask one targeted architecture question.** Don't just accept implementation choices, interrogate them. Suggested:

   > **Paste this:**
   >
   > Why is the grace-window check enforced on the server instead of only in the client UI?

   *Why:* the agent will usually have a defensible answer. If it doesn't, that's a sign the choice was arbitrary and you should push for a different approach. Either way you've learned something.

3. **Make one tiny direct edit yourself, even if it is only a rename.** Type into the file. Rename a variable, tighten a comment, split a function. Anything.
   *Why:* the agent's code is a starting point, not an artifact you're stuck with. The act of editing reminds you (and Nimbalyst, since your edits show up in the diff) that this is *your* code, not "the agent's code I'm watching."

4. **Re-run the relevant tests and inspect the output.** Open the terminal panel (`` Ctrl+` ``) and run the test command. Read the output. Don't trust the agent's "tests pass" until you see green yourself.
   *Why:* "tests pass" is the most-lied-about claim an agent makes. Sometimes the agent ran a different test suite. Sometimes it didn't actually run them. Verify.

If the tests fail, have the user paste the failure back into the same session and keep going until green.

**Teach last (in chat, before moving on):**

> The four habits above are the difference between using an agent and being used by one. Skip them and you'll ship subtle bugs you didn't see. Run them every loop and you stay the senior engineer in the room.

### Exercise 2.6: Terminal for what you want to see directly

![Terminal](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/feature-terminal.webp)

**Teach first (in chat):**

> The terminal panel is the same terminal you'd open in iTerm or Windows Terminal, but it's docked into your Nimbalyst workspace, scoped to the current worktree's directory, and you can see it side by side with the agent chat. Two reasons this matters:
>
> 1. **You watch the agent's commands flow through here.** When the agent runs `npm test` or `git status`, you see the output in this same panel. You can pause the agent, take over, run a one-off command, and hand control back. No context loss.
> 2. **Persistent test watcher.** Long-lived commands like `npm test -- --watch` keep running in their own pane while the agent works. You see real test feedback in real time, not "the agent says tests pass."
>
> Open it now with `` Ctrl+` `` (backtick).

Once it's open, walk through the actual moves:

> The repo's test command depends on the project. Look in `package.json` `scripts` first. If there's a `test:watch` or similar, run that. Otherwise run the basic `test` script. We want one terminal pane running tests on file save, sitting next to the chat. That's the loop: agent edits → tests rerun → you see green or red → tell agent what to fix.

Do not hardcode a command the repo does not support. If the repo exposes a watch mode, use it. If not, run the narrowest repeated test command available.

**Teach last (in chat, before moving on):**

> The integrated terminal is also where the agent's bash commands show up. If you ever see a destructive command queued (`rm -rf`, `git reset --hard`, anything with `--force`), you can intercept here before it runs. Permission prompts catch most of these, but watching the terminal is your last line of defense.

**Chapter 2 checkpoint**

> You planned in Plan Mode, sharpened the plan by hand, turned it into tracker items the agent can read, dragged the parent into In progress, spawned two worktrees in parallel, drove the implementation through four habits, and used the terminal as a live verification surface.
>
> The throughline: **structure compounds.** A sharper plan, a tracked parent task, isolated worktrees, and a visible test loop turn "the agent wrote some code" into "the agent did exactly what we agreed on, and I watched it happen." That's the difference between shipping fast and shipping fast *with confidence.*

## Chapter 3: Ship

> Chapter 3 is the "shipping" rhythm: prove the code works (tests), prove it's safe (security review), prove it'd survive a senior reviewer, package it cleanly (commit), and put it up for real review (PR). Each step uses a Nimbalyst surface you haven't fully seen yet.

### Exercise 3.1: Targeted tests

**Teach first (in chat):**

> The agent already wrote some tests during the implementation. What we're doing now is different, we're targeting the *edge cases* a thoughtful reviewer would ask about, and we're using the **diff on the branch** as the input, not the plan. That way the tests cover what actually changed, not what we said we'd change. Those can diverge.

Have the user paste:

> **Paste this:**
>
> Look at the diff on this branch. Generate focused tests for the comment-editing mutation and the five-minute grace-window check. Cover the happy path, exactly at five minutes, just past five minutes, and editing another user's comment. Put the tests wherever this repo expects them.

Do not move on until the relevant tests pass. If they fail, paste the failure back into the same session and iterate.

**Teach last (in chat):**

> Notice the agent ran the tests after writing them. That's the loop. If the agent writes tests but doesn't run them, that's a smell, push back: "now run them and show me the output."

### Exercise 3.2: Self-review with two lenses

**Teach first (in chat):**

> The agent will happily review its own work as a paranoid senior, if you ask. This is the move that catches the bugs and weak spots *before* you put the PR up for human review, saving you the embarrassment of having them flagged in front of the team.
>
> We're going to ask for both lenses in one pass: a security angle and a senior-reviewer angle. The security pass covers auth, input validation, bypass paths. The senior pass covers bugs, missing tests, risky assumptions, maintainability. Both in one prompt, no point doing them separately.

Have the user paste:

> **Paste this:**
>
> Review this branch from two angles. First, security: authorization, input validation, and whether the grace-window check can be bypassed. Second, senior reviewer: bugs, missing tests, risky assumptions, maintainability problems. Be specific, cite files and line numbers, skip nits. End with the top three things I should fix before opening a PR.

Apply real issues. Push back on weak ones.

**Teach last (in chat):**

> Two skills here:
>
> 1. **Triaging findings.** Agents over-flag. Read each finding and ask "could this actually happen in our setup?". Apply the ones that survive that question, drop the rest.
> 2. **Pushing back when the agent is lazy.** If the review surfaces zero issues or just praises the code, that's a smell. Re-prompt: "be harsher, cite specific lines, assume nothing." A good review on a non-trivial change usually finds 3-5 things worth fixing.

### Exercise 3.3: Propose the commit

This is the big one. The commit-proposal widget is one of Nimbalyst's most distinctive surfaces and the user has probably been ignoring it. Teach it properly.

**Teach first (in chat), before they paste anything:**

> Before we ask the agent to propose a commit, take a moment to look at what's actually staged. Look at the **edited-files panel on the right side** of Agent Mode. This panel has been quietly tracking every file the agent has touched in this worktree, the whole time. Each row shows:
>
> - The file path
> - A small +/- showing lines added/removed
> - Color coding: green for new files, blue for modified, red for deleted
>
> Click any file in that panel to open it inline in the chat panel and read the diff. Right-click → **Open in Files Mode** to see the full diff with `Keep` / `Revert` per chunk.
>
> Do that now, scroll through the edited-files panel and click two or three files. Get a feel for what changed in this branch. The commit you're about to propose will include all of these.

Wait for the user to confirm they've looked through the edited files.

Then have them paste:

> **Paste this:**
>
> Commit the comment-editing work using developer_git_commit_proposal. Group the feature into one clean commit and use a short Conventional Commit title.

When the proposal card renders, walk them through it in chat. Don't let them just click Approve.

> The commit proposal card just appeared in your chat. Don't approve it yet. Tour it first:
>
> 1. **Title field at the top.** This is the commit subject line. The agent guessed at a Conventional Commit format (`feat: ...`, `fix: ...`, etc.). Read it. If it's wrong or too vague, click into the field and edit it. Good titles are short, present-tense, and specific: `feat(comments): add 5-minute edit grace window` is clearer than `Add comment editing`.
> 2. **Body field below the title.** Optional but valuable for non-trivial commits. The agent often leaves it blank, fill in the *why*, not the *what*. The diff already tells anyone reading the commit *what* changed.
> 3. **File list with checkboxes.** Every file the agent thinks should be in this commit. Each one shows the staged diff inline, expand a few. **Uncheck any file you don't want in this commit.** Maybe you have a stray debug log, or a file you want in its own commit. Uncheck it here.
> 4. **Manual / Smart toggle.** Manual is the right default while you're learning, it just stages what's checked and writes the commit. Smart attempts grouping and message generation on its own. Stick with Manual.
> 5. **Approve / Edit / Cancel buttons at the bottom.** Approve commits to the local branch (no push, that's still your call). Edit lets you tweak the message in a bigger editor. Cancel discards the proposal, nothing is committed, nothing is staged, your working tree is exactly as it was.
>
> Edit the title to your liking, uncheck anything that doesn't belong, then click **Approve**.

Wait for the user to confirm the commit landed. Then:

> Quick check: the edited-files panel on the right should still show your changes (the files don't disappear after commit, they're now part of the branch's diff vs main). Open a terminal panel (`` Ctrl+` ``) and run `git log -1` to see the commit you just made.

**Teach last (in chat):**

> Three reasons the commit-proposal widget is better than `git add` + `git commit -m` in a terminal:
>
> 1. **You see the staged diff before committing.** No more "wait, did I include that debug file?" moments.
> 2. **The message starts from the agent's understanding of the diff, not your memory of it.** Faster, often more accurate.
> 3. **You can uncheck files surgically.** Splitting work into multiple clean commits becomes a click instead of a `git add -p` session.
>
> Use this widget for every commit while you're learning. Once it's muscle memory you can drop back to the terminal for trivial ones.

### Exercise 3.4: Open the PR (dry run, the upstream demo is read-only)

**Heads-up to the agent:** the demo repo (`clintonwoo/hackernews-react-graphql`) is upstream-only and read-only for the user. **Do not run `gh pr create` or `git push`.** Do not invent workarounds (forks, scratch repos, "add your own remote"). The local commit from 3.3 is the real artifact for this tutorial, the PR step is a *dry run* so the user understands the flow on their own repos later.

**Teach first (in chat):**

> Heads up, we cloned a public demo repo, so we can't actually push to it or open a PR against it (it's read-only for both of us). That's fine. The local commit you just made is the real work product. This exercise is a *dry run* so you know exactly what to do on your own repos.
>
> Here's the flow you'd run on a repo you own:
>
> 1. `git push -u origin feature/comment-editing`, pushes the local branch to the remote.
> 2. `gh pr create --title "..." --body "..."`, opens a PR with the title and body you provide.
>
> The Nimbalyst-native version: just paste a prompt like "push this branch and open a PR with gh, use the commit title, and write a body that summarizes plans/comment-editing.md and links notes/architecture.excalidraw." The agent runs both commands for you and replies with the PR URL.

Have the user paste this to *generate* the PR body (without pushing):

> **Paste this:**
>
> Draft the PR body I'd use for this branch if I were pushing it. Lead with the user-facing change, then two bullets on the technical approach, then a "Test plan" section. Reference plans/comment-editing.md and notes/architecture.excalidraw. Don't push, don't run gh, just write the body to chat so I can review it.

Walk through what the agent comes back with:

> Read the body the agent drafted. Three things to check on a real PR (and to push back on now if they're missing):
   >
> 1. Does the summary lead with the user-facing change, or is it just a list of file names? If file names: "rewrite to lead with what changes for users, then the technical approach in two bullets."
> 2. Are the references to the plan and diagram in a clickable form a reviewer can find?
> 3. Is there a "Test plan" or "How to verify" section?
>
> On a real PR, you'd run the push + `gh pr create` and then edit the body directly on GitHub if needed, no need to round-trip through the agent for every wording tweak.

**Teach last (in chat):**

> The reason we're not pushing here: the HackerNews demo is read-only upstream and we never set you up with a fork or your own remote. That's deliberate, the tutorial's about learning the loop, not about the politics of "where do I push." Apply this same flow to a repo you own and the agent will run the push and the `gh pr create` for you in one prompt.


**Chapter 3 checkpoint**

> You mapped the codebase, planned the change, split the work, tested it, reviewed it, committed it, and opened a PR. That is the full loop.

---

# TRACKER APPENDIX (shared, optional)

Both tracks have already touched the core tracker loop. PM in Chapter 3 Exercise 3.1, dev in Chapter 2 Exercise 2.2. Create from a plan, open in Tracker Mode, hand-edit, move on the kanban, ground a session or worktree on the item.

This appendix is the **advanced** section: defining a custom tracker type. Skip it if the tutorial is running long.

## Custom tracker types

Trackers aren't limited to bugs and tasks. If your work has a structure, you can give it a schema and let Nimbalyst operate on it directly. Videos, customer interviews, hiring loops, release checklists, any repeated workflow with consistent fields.

First, have the user paste:

> **Paste this:**
>
> Design a custom tracker type called "Video" for this workspace. Optimize it for a YouTube content pipeline. Before writing files, show me the proposed fields, status options, roles, and one example item.

After review, have them paste:

> **Paste this:**
>
> Create that tracker type for this workspace. Then take this markdown and turn each entry into a Video tracker item. Prioritize them, put the first three into in-progress, and show me the resulting list.
>
> # Video backlog
>
> - Nimbalyst for total beginners
> - How trackers turn notes into action
> - Plan Mode vs direct execution
> - Working from tracker items instead of blank chats
> - Using issue keys in sessions and commits
> - Designing your own Video tracker

If the new tracker type doesn't appear immediately, tell the user to check the generated tracker definition. The app may need a restart before a new type becomes available.

**Appendix checkpoint**

> Trackers are documents with a schema. Once you can define your own type from chat, your tracker becomes a shape for the actual work you do, not whatever the tool ships with.

---

# Recap (shared)

Keep this short and tie it back to what the user actually did.

## Principles

### PM track

1. Plan before you ask for output.
2. Reuse context instead of re-explaining everything.
3. Review the diff, do not outsource taste.
4. Use AI for synthesis, not just drafting.
5. Keep artifacts alive in files, not buried in chat.
6. Learn enough of the codebase to make sharper product calls.

### Dev track

1. Read before you write.
2. Make plans that name files and tests.
3. Use worktrees for parallel motion, not just parallel thinking.
4. Keep tests in the loop, not at the end.
5. Treat AI review as a cheap second pass, not as truth.
6. Keep the final diff small enough for a human to trust.

## Extension surfaces and where to find them

Five places you can extend Nimbalyst as you make it yours. Spend two minutes here so you know where to look later.

1. **Slash commands**, `.claude/commands/` in your workspace (per-project) or `~/.claude/commands/` (global, shows up in every workspace). Each `.md` file is a prompt template; the filename is what you type after `/`. You can browse them in the file tree or just type `/` in the chat to see them all.
2. **Agent personas**, `.claude/agents/` in your workspace. Each file defines a specialized sub-agent (their system prompt, the tools they're allowed to use) that the main agent can dispatch tasks to. Same file-on-disk pattern as slash commands.
3. **MCP tools and integrations**, `Settings` (gear icon, bottom-left) → **MCP Servers**. This is where you add Linear, GitHub, Customer.io, Figma, custom servers, etc. Each MCP adds tools the agent can call. Settings also has a global on/off per server.
4. **Hooks**, `Settings` → **Hooks**. Run a shell command automatically on events like `on file save`, `on agent stop`, `on tool use`. Useful for formatters, linters, deploy triggers, or anything you'd otherwise have to remember to do.
5. **Reusable docs, `CLAUDE.md`, `nimbalyst-local/plans/`, the tracker**, these aren't extensions in the formal sense, but they're the in-repo memory that makes the agent better over time. `CLAUDE.md` for project-wide instructions; `nimbalyst-local/plans/` for reusable plan templates; the tracker for the project's actual state.

Click around `Settings` (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux) at the end of the tutorial to see all five surfaces in one place.

## Nimbalyst on iPhone and iPad

There's a companion iOS app. It's not a full second editor, it's for reviewing and steering Nimbalyst from your phone when you're away from your laptop.

What it's good for:

- **Reviewing sessions in progress.** See what each running agent is doing without sitting at the desk.
- **Replying to interactive prompts.** When the agent asks a question (`AskUserQuestion`, plan-mode exit, commit proposal), you can answer from your phone.
- **Scanning the tracker.** Same kanban, same items, mobile layout.

PM users in particular: this is how you check on the agent during meetings or while away from your desk without breaking flow.

Search the App Store for **Nimbalyst** or grab it from `https://nimbalyst.com/ios`. Sign in with the same account.

## Make `CLAUDE.md` yours

Have the user paste:

> **Paste this:**
>
> Open the relevant CLAUDE.md for this tutorial workspace. Add three things based on what you learned about me: my role, my product area or stack, and one writing-style preference. Then add one rule based on something I corrected you on. Show me the diff first.

## Create one slash command of your own

Up to this point, every prompt in the tutorial has been plain English so it works on any setup. Slash commands are how you turn a prompt you'd reuse weekly into a one-keystroke command. They live as plain markdown files on disk, under `.claude/commands/` in the workspace (per-project) or `~/.claude/commands/` (global). The filename without the `.md` is what the user types after the slash. The file body is the prompt template, optionally with `$ARGUMENTS`.

Tell the user this, then have them paste:
   ![Agent chat](https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/images/hero-agent-mode.webp)

> **Paste this:**
>
> Suggest three slash commands I should create based on what we did today. For each one, give me the filename, a one-sentence description, and the command body. Optimize for something I would reuse weekly.

Pick the one that fits. Then have them paste:

> **Paste this:**
>
> Create that command as a new file under .claude/commands/ and show me how to invoke it. Confirm the filename and walk me through editing it later if I want to tweak the wording.

After it lands, two follow-on moves to reinforce the loop:

1. **Invoke it.** Have them type `/` in the chat and watch the new command appear in the autocomplete list. Run it once.
2. **Edit it by hand.** Open the file in Files Mode, change one line, save, and run it again to see the change take effect. This is the same accept → edit → ask-for-more loop they already learned, applied to commands themselves.

Mark the tutorial complete in `<workspace-root>/nimbalyst-local/tutorial-progress.json`.

## What to do next: bring this to your own work

Don't end on "Done." This is the moment the tutorial actually pays off, the user moves from the demo to a real project. Walk them through the decision in chat:

> Last thing before we wrap. You ran this tutorial in a clean demo workspace. The whole point was for you to feel the loop, not to do real work here. Now point Nimbalyst at something that matters.
>
> Two ways to bring this to your own work, depending on what you've got:
>
> **A. Open an existing project as a Nimbalyst workspace.**
> Best if you already have a repo, a docs folder, or even just a project folder you'd like to work in. Press `Cmd+P` (or `Ctrl+P`) to open the Project Manager, click **Open Workspace Folder**, pick the folder, click Open. Nimbalyst opens it as a workspace in a new window. From there, start a chat and just begin, ask the agent to map the codebase, draft a plan, mockup a screen, whatever you'd normally hand off to a teammate.
>
> **B. Create a brand-new project from scratch.**
> Best for an idea you haven't started yet, a side project, a research doc, a writing project, a prototype. Press `Cmd+P` → **Create New Workspace**, name it, click Create. Nimbalyst opens the empty folder. Start a chat and tell the agent what you're building.
>
> A few framing thoughts about which to pick:
>
> - **Nimbalyst is happy in non-code folders too.** A research project, a marketing plan, a book outline, a hiring loop, anywhere you'd otherwise scatter notes across Notion, Google Docs, and a project tool, you can collapse into one Nimbalyst workspace with the agent, the tracker, and the file tree all in one place.
> - **One workspace per project, not one workspace per task.** Each workspace gets its own session history, tracker, edited-files panel, and `CLAUDE.md`. Mixing two projects in one workspace muddies all of that. Use `Cmd+P` to flip between workspaces. Nimbalyst keeps each one warm.
> - **Add a `CLAUDE.md` to any new workspace within the first day.** Even a five-line one. Role of the project, conventions, "don't do X." It costs you nothing now and makes every future session sharper.
>
> Which one do you want to start with, open an existing folder, or create something new? I can walk you through opening the Project Manager either way.

Then offer `AskUserQuestion` so the user can pick:

- Open an existing project (walk me through it)
- Create a new project from scratch (walk me through it)
- I'm good, I'll do it later

If they pick "open existing": tell them to press `Cmd+P`, click **Open Workspace Folder**, pick a folder they care about, and click Open. Tell them once that new window is up, they can paste their first prompt, something like "Map this codebase for me and tell me what it does," or "Read the current state of this project and suggest what I should work on next."

If they pick "create new": tell them to press `Cmd+P`, click **Create New Workspace**, pick a parent folder and name (e.g., `~/MyNewProject`), and click Create. Tell them their first prompt there can be as simple as "I want to build [thing]. Start me with a CLAUDE.md and a plan in plans/." The agent takes it from there.

If they say later: wrap up cleanly. "Great. Whenever you're ready, `Cmd+P` is the doorway. Re-run `/tutorial` anytime if you want a refresher on a specific surface."

### Final close

Once they've either opened a real workspace or told you they'll do it later:

> That's the tutorial. Three things you can do anytime to keep getting more out of Nimbalyst:
>
> 1. **Re-run `/tutorial`** if you want to revisit a specific chapter, say "go to chapter 3" when it starts.
> 2. **Build slash commands for prompts you find yourself repeating.** That's how you turn a one-off into a habit.
> 3. **When the agent does something well, capture it in `CLAUDE.md`.** When it does something badly, also capture the fix in `CLAUDE.md`. Both make the next session sharper.

---

# Reference

## Tools and surfaces used

Every prompt in the tutorial is plain English, no slash commands required. The agent is expected to call the right Nimbalyst tools based on the prompt.

PM track surfaces:

- mockup editor (`.mockup.html`)
- Excalidraw diagrams
- charts via `display_to_user`
- tracker workflows
- Plan Mode when supported

Dev track surfaces:

- parallel sub-agents
- worktrees
- terminal panel
- Plan Mode when supported
- tracker workflows

Shared:

- `developer_git_commit_proposal`
- `display_to_user`
- `@file` references for grounding

## Tracker workflows and references

- Start work from the tracker detail pane with `Launch Session`
- Refer to existing tracker items by issue key, often something like `NIM-123`, or by item name
- Ask the agent to create tracker items directly from markdown, notes, or brainstorm lists
- For custom tracker types, the agent can define the schema and create `.nimbalyst/trackers/<type>.yaml`
- If you need the lower-level tools, the common ones are `tracker_create`, `tracker_update`, `tracker_list`, `tracker_get`, and `tracker_link_session`

## Core modes and shortcuts

- **Files Mode**: `Cmd+E`
- **Quick open file**: `Cmd+O` (fuzzy-search any file by name)
- **Agent Mode**: `Cmd+K`
- **Toggle AI panel**: `Cmd+Shift+A`
- **Plan Mode toggle**: in the bar above the message input, `Shift+Tab` when supported
- **Terminal panel**: `Ctrl+\``

## When things go sideways

- `Esc` stops the current run
- `Revert` rejects an AI change
- start a new session for unrelated work
- ask for a plan-first pass if the agent is moving too fast
- ask the agent to explain what changed and why before you accept the diff

## Progress file shape

```json
{
  "version": "1.1",
  "track": "pm | dev",
  "os": "mac | windows | linux",
  "startedAt": "<iso>",
  "lastAccess": "<iso>",
  "workspaceRoot": "<absolute path>",
  "tutorialRepoPath": "<absolute path to the cloned demo workspace root>",
  "demoPath": "<absolute path to the cloned demo workspace root, equal to workspaceRoot when the user chose the demo, or null>",
  "worktreesAvailable": true,
  "userProfile": {
    "role": "...",
    "productArea": "...",
    "stack": "...",
    "yearsExperience": "...",
    "currentFocus": "..."
  },
  "environment": {
    "host": "nimbalyst"
  },
  "currentChapter": "pre-flight | 1 | 2 | 3 | recap | complete",
  "lastCompletedExercise": "...",
  "completedChapters": [],
  "exercisesCompleted": 0
}
```

---

# How to share this tutorial (Karl's reference, not part of the tutorial itself)

These are the steps to send a new user when sharing the tutorial. **Not displayed to the user inside the tutorial**, just here so you can find them.

1. In Nimbalyst, create any workspace (`Cmd+P` → **Create New Workspace** → name it anything, e.g. `Tutorial-Launcher`). This is just where the bootstrap chat lives. The tutorial itself will move into a dedicated workspace it creates for you.
2. In that workspace's chat, paste this single prompt:

   > Download `https://raw.githubusercontent.com/nimbalyst/skills/main/skills/getting-started/tutorial.md` to `~/.claude/commands/tutorial.md` (create the directory if it doesn't exist). Then read the file and run it as the Nimbalyst tutorial. Follow it exactly, wait for me at every exercise.

3. The tutorial starts. It will clone the HackerNews demo, walk you through opening that folder as a new Nimbalyst workspace, and run the actual tutorial there. The launcher workspace can be deleted afterward.

That's it. One paste, no browser download, no Save As dance.

**Note on `/tutorial` as a slash command:** the bootstrap prompt installs it globally so future runs are one keystroke from any workspace. But running `/tutorial` always means "start over in a fresh HackerNews demo workspace." If you want to revisit the tutorial later, expect a new clone of the demo, not a continuation in a real project.

**Browsable page (for someone who wants to read it before downloading):** `https://github.com/nimbalyst/skills/blob/main/skills/getting-started/tutorial.md`
