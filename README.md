# Nimbalyst Skills

A collection of Claude skills for product managers, developers, and content creators. These skills work with Claude Code, Claude.ai, and the Anthropic API.

## What are Skills?

Skills are reusable prompt packages that give Claude specialized knowledge and workflows. When installed, Claude automatically activates the right skill based on context -- no slash commands needed.

## Categories

### Development (`dev/`)

| Skill | Description |
| --- | --- |
| `branch-reviewer` | Comprehensive read-only code review of branch changes |
| `bug-reporter` | Guided bug report creation through conversation |
| `claude-md-refactorer` | Modularize large CLAUDE.md files with path-scoped rules |
| `code-analyzer` | Analyze code quality, find bugs, suggest improvements |
| `commit-helper` | Impact-focused git commit messages |
| `lib-updater` | Update dependencies with changelog review |
| `plan-implementer` | Execute plan docs with progress tracking |
| `pre-commit-reviewer` | Clean up debug logging and dead code before commit |
| `standup-summary` | Summarize recent commits in standup format |
| `test-writer` | Generate comprehensive test coverage |

### Product Management (`product/`)

| Skill | Description |
| --- | --- |
| `edge-case-analyzer` | Identify edge cases and error states during design |
| `feature-explainer` | Explain features by inspecting the codebase |
| `feedback-analyzer` | Analyze customer feedback for patterns and insights |
| `github-status` | Summarize GitHub activity across repos and PRs |
| `prd-writer` | Create structured Product Requirements Documents |
| `request-triager` | Triage, deduplicate, and prioritize feature requests |
| `status-updater` | Create executive status updates with metrics |
| `strategy-memo` | Draft strategy memos with rationale and alternatives |
| `work-tracker` | Track bugs, tasks, ideas, and decisions in markdown |

### Research (`research/`)

| Skill | Description |
| --- | --- |
| `competitive-analyst` | Competitive analysis with SWOT and feature comparisons |
| `customer-interview-sim` | Simulate customer interviews for practice |
| `deep-researcher` | Parallel multi-agent research with citations |
| `user-research-doc` | Structure user research findings and insights |

### Content (`content/`)

| Skill | Description |
| --- | --- |
| `blog-writer` | Write blog posts with strong voice and SEO structure |
| `doc-writer` | Create structured technical and product documentation |
| `launch-announcer` | Product launch announcements and release notes |
| `sales-enablement` | Battlecards, demo scripts, and GTM materials |
| `slide-deck-creator` | HTML slide decks with consistent design system |

### One Step Better (`one-step-better/`)

| Skill | Description |
| --- | --- |
| `one-step-better-at-cc` | Personalized, evidence-based recommendations for improving your Claude Code/Nimbalyst workflow |
| `wrapped` | Your Agents, Wrapped plus a Grader report from your own Claude Code and Codex logs, as one local HTML |

## Installation

### Claude Code

Install individual skills or the entire collection:

```bash
# Install a single skill
claude skills add /path/to/skills/skills/dev/branch-reviewer

# Or clone and install from this repo
git clone https://github.com/nimbalyst/skills.git
claude skills add ./skills/skills/dev/branch-reviewer
```

### Claude.ai

Upload a skill's `SKILL.md` file as a project file in your Claude.ai project.

### Anthropic API

Include the `SKILL.md` content in your system prompt.

## Structure

```
skills/
  content/           # Blog, docs, slides, sales, launches
    blog-writer/SKILL.md
    doc-writer/SKILL.md
    launch-announcer/SKILL.md
    sales-enablement/SKILL.md
    slide-deck-creator/SKILL.md
  dev/               # Code review, commits, testing, debugging
    branch-reviewer/SKILL.md
    bug-reporter/SKILL.md
    claude-md-refactorer/SKILL.md
    code-analyzer/SKILL.md
    commit-helper/SKILL.md
    lib-updater/SKILL.md
    plan-implementer/SKILL.md
    pre-commit-reviewer/SKILL.md
    standup-summary/SKILL.md
    test-writer/SKILL.md
  product/           # PRDs, strategy, triage, status
    edge-case-analyzer/SKILL.md
    feature-explainer/SKILL.md
    feedback-analyzer/SKILL.md
    github-status/SKILL.md
    prd-writer/SKILL.md
    request-triager/SKILL.md
    status-updater/SKILL.md
    strategy-memo/SKILL.md
    work-tracker/SKILL.md
  research/          # Competitive, user research, interviews
    competitive-analyst/SKILL.md
    customer-interview-sim/SKILL.md
    deep-researcher/SKILL.md
    user-research-doc/SKILL.md
  one-step-better/   # Workflow optimization
    one-step-better-at-cc/SKILL.md
```

Each skill lives in its own folder with a `SKILL.md` file.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting new skills.

## License

MIT
