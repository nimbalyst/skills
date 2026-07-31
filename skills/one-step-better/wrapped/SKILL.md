---
name: wrapped
description: Generate a private, local "Your Agents, Wrapped" card plus a Grader report from the user's own Claude Code and Codex session logs. Use when the user asks to run their agent wrapped, grade their coding-agent usage, or see a year-in-review of how they use Claude Code and Codex. Runs one bundled Node script; nothing leaves the machine.
---

# Your Agents, Wrapped

Run a single bundled script that reads the user's Claude Code and Codex session
logs locally and produces one self-contained HTML file (their Wrapped story
panels plus a Grader report), then open it for them.

The bundled script is `nimbalyst-grade.mjs`, in this skill folder. It uses only
Node built-ins, makes zero network calls, and reads `~/.claude/projects` and
`~/.codex/sessions` read-only. It writes exactly one file, `agent-wrapped.html`,
into the current directory, and that file has an in-page Download PNG button for
the share card.

## Steps

1. Tell the user they can audit the script before the first run: it is one
   readable file using only Node built-ins, with no network access. To show the
   exact globs it reads and confirm nothing leaves the machine, run:

   ```
   node nimbalyst-grade.mjs --what-do-i-read
   ```

   (Resolve `nimbalyst-grade.mjs` to this skill folder's copy.)

2. Run it from a directory where the user wants the output:

   ```
   node nimbalyst-grade.mjs
   ```

   It reads the logs read-only and writes `agent-wrapped.html` into the current
   directory. Nothing uploads.

3. Open the result for the user (macOS: `open agent-wrapped.html`; otherwise give
   them the absolute path). The share card at the end has a Download PNG button
   (1200x630 and 1080x1080), rendered in-page on their machine.

## Notes

- One skill, one script, one output. There is no separate grade command: the
  Grader report is a section inside the same `agent-wrapped.html`.
- If Node is missing, ask the user to install Node 18+ (built-ins only, no npm
  install needed).
