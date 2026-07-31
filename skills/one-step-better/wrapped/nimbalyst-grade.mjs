#!/usr/bin/env node
/*
 * nimbalyst-grade.mjs — Your Agents, Wrapped + Grader.
 *
 * ONE self-contained file. Node built-ins only, zero npm dependencies, zero
 * network calls. Reads your Claude Code and Codex session logs READ-ONLY,
 * computes everything on your machine, and writes ONE file into the current
 * directory: agent-wrapped.html (fully self-contained: inline CSS/SVG/JS, no
 * external requests, an in-page Download PNG button for the share card).
 *
 *   node nimbalyst-grade.mjs                 run everything, write ./agent-wrapped.html
 *   node nimbalyst-grade.mjs --what-do-i-read   print the exact globs read + the privacy guarantee, then exit
 *
 * It reads (read-only, never writes there):
 *   ~/.claude/projects/**\/*.jsonl   (Claude Code)
 *   ~/.codex/sessions/**\/*.jsonl    (Codex)
 * Nothing leaves the machine. The only output is the one HTML file you can
 * inspect before you share it. You can ask Claude to audit this script first;
 * it is one readable file using only node built-ins.
 */

import { createReadStream } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude', 'projects');
const CODEX_DIR = path.join(HOME, '.codex', 'sessions');
const OUTPUT = path.join(process.cwd(), 'agent-wrapped.html');

// ---- Target month --------------------------------------------------------
// The Wrapped is for one "true month" (e.g. July 2026). Near a month boundary
// (the last days of a month, or the first WRAP_GRACE_DAYS of the next one) we
// wrap the month that just finished, so a late-July or early-August run both
// produce a "July 2026" Wrapped. Headline, maker mix, shipped, archetype, and
// grade are scoped to this month; the trend visuals (heatmap, sparklines) still
// look back across all previous months. Month keys are UTC to match the log
// dates. TARGET_MONTH may be reassigned in main() if the picked month is empty.
const WRAP_GRACE_DAYS = 5;
function pickTargetMonth(now) {
  let y = now.getUTCFullYear(), m = now.getUTCMonth(); // 0-indexed
  if (now.getUTCDate() <= WRAP_GRACE_DAYS) { m -= 1; if (m < 0) { m = 11; y -= 1; } }
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}
let TARGET_MONTH = pickTargetMonth(new Date());
function monthLabel(key) { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
function monthShort(key) { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }); }
function prevMonthKey(key) { let [y, m] = key.split('-').map(Number); m -= 1; if (m < 1) { m = 12; y -= 1; } return `${y}-${String(m).padStart(2, '0')}`; }
const monthOf = (ts) => (ts == null || Number.isNaN(ts)) ? null : new Date(ts).toISOString().slice(0, 7);

// ===========================================================================
// Shared primitives
// ===========================================================================

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pctInt = (x) => `${Math.round(x * 100)}%`;
const pct1 = (x) => `${(x * 100).toFixed(1)}%`;
const round1 = (n) => Math.round(n * 10) / 10;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const TEN_MIN = 10 * 60 * 1000;

function bump(map, key, n = 1) { map.set(key, (map.get(key) || 0) + n); }
function normKey(name) { return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function serverDisplay(name) { return String(name).trim().replace(/_/g, '-'); }
function countLines(s) { return (!s || typeof s !== 'string') ? 0 : s.split('\n').length; }
function fmtHour(h) { const ap = h < 12 ? 'am' : 'pm'; const hr = h % 12 === 0 ? 12 : h % 12; return `${hr}${ap}`; }
function fmtDayLabel(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function findJsonl(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findJsonl(full)));
    else if (e.isFile() && e.name.endsWith('.jsonl')) out.push(full);
  }
  return out;
}
async function eachLine(file, fn) {
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) { if (line.trim()) { let r; try { r = JSON.parse(line); } catch { continue; } try { fn(r); } catch { /* skip */ } } }
}

// ---- maker mix: classify a file path into category + language ----
const CODE_EXT = { ts: 'ts', tsx: 'tsx', mts: 'ts', cts: 'ts', js: 'js', mjs: 'mjs', cjs: 'js', jsx: 'jsx', py: 'py', pyi: 'py', swift: 'swift', css: 'css', scss: 'scss', sass: 'sass', less: 'less', html: 'html', htm: 'html', vue: 'vue', svelte: 'svelte', astro: 'astro', java: 'java', kt: 'kotlin', kts: 'kotlin', go: 'go', rs: 'rust', rb: 'ruby', php: 'php', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp', cs: 'csharp', m: 'objc', mm: 'objc', sh: 'shell', bash: 'shell', zsh: 'shell', fish: 'shell', ps1: 'powershell', dart: 'dart', scala: 'scala', lua: 'lua', r: 'r', pl: 'perl', ex: 'elixir', exs: 'elixir', erl: 'erlang', clj: 'clojure', hs: 'haskell', proto: 'proto', gradle: 'gradle', groovy: 'groovy', ipynb: 'notebook' };
const DOCS_EXT = new Set(['md', 'mdx', 'markdown', 'rst', 'txt', 'adoc', 'org']);
const DATA_EXT = new Set(['json', 'jsonc', 'json5', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'sql', 'xml', 'ini', 'env', 'lock', 'properties', 'plist', 'graphql', 'gql', 'conf', 'cfg']);
const DATA_BASENAMES = new Set(['dockerfile', 'makefile', 'package-lock.json', '.gitignore', '.npmrc', '.env', '.dockerignore', '.editorconfig']);
const MAKER_CATEGORIES = ['code', 'docs', 'diagrams', 'mockups', 'data', 'other'];

function classifyFileType(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return { category: 'other', subtype: null };
  const base = rawPath.trim().split(/[\\/]/).pop().toLowerCase();
  if (base.endsWith('.mockup.html')) return { category: 'mockups', subtype: 'mockup.html' };
  if (base.endsWith('.excalidraw')) return { category: 'diagrams', subtype: 'excalidraw' };
  if (base.endsWith('.mindmap')) return { category: 'diagrams', subtype: 'mindmap' };
  if (base.endsWith('.datamodel')) return { category: 'diagrams', subtype: 'datamodel' };
  if (base.endsWith('.mmd') || base.endsWith('.mermaid')) return { category: 'diagrams', subtype: 'mermaid' };
  if (DATA_BASENAMES.has(base)) return { category: 'data', subtype: base.replace(/^\./, '') };
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1) : '';
  if (DOCS_EXT.has(ext)) return { category: 'docs', subtype: ext };
  if (DATA_EXT.has(ext)) return { category: 'data', subtype: ext };
  if (CODE_EXT[ext]) return { category: 'code', subtype: CODE_EXT[ext] };
  return { category: 'other', subtype: ext || null };
}
function newMakerAcc() { return { total: 0, byCategory: new Map(), byCodeLang: new Map() }; }
function addMakerFile(acc, rawPath) {
  const { category, subtype } = classifyFileType(rawPath);
  acc.total += 1;
  bump(acc.byCategory, category);
  if (category === 'code' && subtype) bump(acc.byCodeLang, subtype);
  return category;
}
function summarizeMaker(acc) {
  const total = acc.total;
  const categories = MAKER_CATEGORIES.map((c) => ({ category: c, count: acc.byCategory.get(c) || 0, share: total > 0 ? (acc.byCategory.get(c) || 0) / total : 0 }))
    .filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
  const codeLangs = [...acc.byCodeLang.entries()].sort((a, b) => b[1] - a[1]).map(([lang, count]) => ({ lang, count, share: total > 0 ? count / total : 0 }));
  return { totalFileEdits: total, categories, codeLangs };
}
function mergeMakerSummaries(...summaries) {
  const catMap = new Map(), langMap = new Map(); let total = 0;
  for (const s of summaries) { if (!s) continue; total += s.totalFileEdits || 0; for (const c of s.categories || []) bump(catMap, c.category, c.count); for (const l of s.codeLangs || []) bump(langMap, l.lang, l.count); }
  const categories = MAKER_CATEGORIES.map((c) => ({ category: c, count: catMap.get(c) || 0, share: total > 0 ? (catMap.get(c) || 0) / total : 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
  const codeLangs = [...langMap.entries()].sort((a, b) => b[1] - a[1]).map(([lang, count]) => ({ lang, count, share: total > 0 ? count / total : 0 }));
  return { totalFileEdits: total, categories, codeLangs };
}

function topShare(entries, n = 3) {
  const arr = [...entries].filter(([, c]) => c > 0);
  const total = arr.reduce((s, [, c]) => s + c, 0);
  const ranked = arr.sort((a, b) => b[1] - a[1]);
  return { total, top: ranked.slice(0, n).map(([name, count]) => ({ name, count, share: total > 0 ? count / total : 0 })), distinct: ranked.length };
}
function topShareWithTotal(entries, total, n) {
  const ranked = [...entries].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  return { total, top: ranked.slice(0, n).map(([name, count]) => ({ name, count, share: total > 0 ? count / total : 0 })), partial: true };
}
function mergeCounts(...maps) { const out = new Map(); for (const m of maps) { const it = m instanceof Map ? m.entries() : Object.entries(m); for (const [k, v] of it) bump(out, k, v); } return out; }

// ---- shell command detectors ----
const TEST_CMD_RE = /\b(npm|pnpm|yarn)\s+(run\s+)?test|vitest|jest|pytest|playwright\s+test|\bgo\s+test|cargo\s+test|rspec|swift\s+test|test:unit|test:prepush|test:e2e/i;
const OPS_CMD_RE = /\b(git\s+(push|rebase|merge|cherry-pick|tag|reset|stash)|gh\s+(pr|release|workflow)|wrangler\s+(deploy|tail)|npm\s+publish|docker\s+(build|push)|release-alpha|notariz)/i;
const TEST_PATH_RE = /(\.test\.|\.spec\.|\/__tests__\/|(^|\/)test_[^/]*\.[a-z]+$|_test\.[a-z]+$|\.e2e\.|\/tests?\/)/i;
function isTestCommand(c) { return typeof c === 'string' && TEST_CMD_RE.test(c); }
function isOpsCommand(c) { return typeof c === 'string' && OPS_CMD_RE.test(c); }
function isTestFile(p) { return typeof p === 'string' && TEST_PATH_RE.test(p); }
function isPrCreate(c) { return typeof c === 'string' && /\bgh\s+pr\s+create/.test(c); }
function isGitPush(c) { return typeof c === 'string' && /\bgit\s+push/.test(c); }
function isGitPull(c) { return typeof c === 'string' && /\bgit\s+pull/.test(c); }

// ---- issue-tracker detection (universal: Nimbalyst + GitHub + Linear + JIRA) ----
// MCP servers for third-party trackers.
const TRACKER_MCP_RE = /(linear|jira|atlassian|shortcut|asana|clickup|height|youtrack|gitlab)/i;
// CLI: gh issue (unambiguous), jira/acli, and Linear as a real command (avoids
// "linear-gradient" etc. by requiring it at a command boundary or as a URL).
const ISSUE_CLI_RES = [
  /\bgh\s+issue\b/i,
  /(^|[|&;]\s*)jira\b/i,
  /\bacli\s+jira\b/i,
  /(^|[|&;]\s*)linear\b/i,
  /\.atlassian\.net/i,
  /api\.linear\.app/i,
];
function countIssueCli(cmd) { if (typeof cmd !== 'string') return 0; let n = 0; for (const re of ISSUE_CLI_RES) if (re.test(cmd)) n++; return n; }
function isTrackerMcpTool(server, tool) {
  if (TRACKER_MCP_RE.test(String(server))) return true;
  const t = String(tool);
  return t.includes('tracker_create') || t.includes('tracker_update') || t.includes('create_issue') || t.includes('update_issue');
}

// ---- task-mix (spike) ----
const COMMIT_VERB_LABEL = { feat: 'build', fix: 'fix', bug: 'fix', hotfix: 'fix', docs: 'docs', doc: 'docs', refactor: 'build', perf: 'build', style: 'build', test: 'fix', tests: 'fix', chore: 'ops', ci: 'ops', build: 'ops', release: 'ops', deps: 'ops', revert: 'ops' };
const BRANCH_PREFIX_LABEL = { feat: 'build', feature: 'build', refactor: 'build', fix: 'fix', bug: 'fix', bugfix: 'fix', hotfix: 'fix', docs: 'docs', doc: 'docs', chore: 'ops', ci: 'ops', release: 'ops', ops: 'ops', deploy: 'ops', research: 'research', spike: 'research', explore: 'research', plan: 'planning', design: 'planning' };
function commitVerbLabel(message) { if (!message || typeof message !== 'string') return null; const m = message.trim().toLowerCase(); const conv = m.match(/^(\w+)(\([^)]*\))?!?:/); if (conv && COMMIT_VERB_LABEL[conv[1]]) return COMMIT_VERB_LABEL[conv[1]]; const first = m.match(/^([a-z]+)\b/); if (first && COMMIT_VERB_LABEL[first[1]]) return COMMIT_VERB_LABEL[first[1]]; return null; }
function branchPrefixLabel(branch) { if (!branch || typeof branch !== 'string') return null; const m = branch.trim().toLowerCase().match(/^([a-z]+)[/_-]/); return (m && BRANCH_PREFIX_LABEL[m[1]]) || null; }
function classifyTaskMix(s) {
  const scores = { build: 0, fix: 0, research: 0, docs: 0, planning: 0, ops: 0 };
  const editTotal = s.edits || 0, readTotal = (s.reads || 0) + (s.searches || 0);
  const cats = s.makerCategories || new Map();
  const codeEdits = cats.get('code') || 0, docEdits = cats.get('docs') || 0, diagramMockEdits = (cats.get('diagrams') || 0) + (cats.get('mockups') || 0);
  for (const lbl of s.commitVerbLabels || []) scores[lbl] += 3;
  if (s.branchLabel) scores[s.branchLabel] += 2;
  if (editTotal === 0 && readTotal >= 3) scores.research += 3;
  if (editTotal > 0 && codeEdits >= Math.max(1, editTotal * 0.5)) scores.build += 2;
  if (editTotal > 0 && docEdits >= Math.max(1, editTotal * 0.6)) scores.docs += 2.5;
  if ((s.testRuns || 0) >= 2) scores.fix += 2.5;
  if ((s.testRuns || 0) >= 1 && codeEdits > 0) scores.fix += 1;
  if (diagramMockEdits > 0 || (s.plannerMcpCalls || 0) >= 3) scores.planning += 2.5;
  if ((s.opsCmds || 0) >= 1 && editTotal === 0) scores.ops += 2;
  if ((s.opsCmds || 0) >= 3) scores.ops += 1.5;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topLabel, topScore] = ranked[0]; const margin = topScore - (ranked[1] ? ranked[1][1] : 0);
  return { label: topScore === 0 ? 'unclassified' : topLabel, margin, ambiguous: topScore === 0 || margin < 1 };
}
function newTaskTally() { return { total: 0, byLabel: new Map(), ambiguous: 0, unclassified: 0 }; }
function addTaskMix(t, r) { t.total++; bump(t.byLabel, r.label); if (r.label === 'unclassified') t.unclassified++; else if (r.ambiguous) t.ambiguous++; }
function summarizeTaskMix(t) {
  const labels = ['build', 'fix', 'research', 'docs', 'planning', 'ops', 'unclassified'];
  const distribution = labels.map((label) => ({ label, count: t.byLabel.get(label) || 0, share: t.total > 0 ? (t.byLabel.get(label) || 0) / t.total : 0 })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  return { totalSessions: t.total, distribution, ambiguousShare: t.total > 0 ? t.ambiguous / t.total : 0, unclassifiedShare: t.total > 0 ? t.unclassified / t.total : 0 };
}

function formatModelDisplay(model) {
  if (model === '<synthetic>') return 'Compaction';
  const m = model.replace(/^claude-/, ''); const parts = m.split('-'); const family = parts[0] || m;
  const fam = family.charAt(0).toUpperCase() + family.slice(1); const vp = [];
  for (let i = 1; i < parts.length; i++) { const p = parts[i]; if (/^\d+$/.test(p) && p.length < 6) vp.push(p); else break; }
  return vp.length ? `${fam} ${vp.join('.')}` : fam;
}
function newShipped() { return { linesAdded: 0, linesRemoved: 0, linesAddedByCategory: new Map(), testFilesTouched: new Set(), testRunCommands: 0, trackerCreated: 0, trackerUpdated: 0, issuesTracked: 0, prsOpened: 0, gitPush: 0, gitPull: 0, commitsWithMessage: 0, conventionalCommits: 0 }; }
function shippedOut(s) { return { linesAdded: s.linesAdded, linesRemoved: s.linesRemoved, linesAddedByCategory: Object.fromEntries(s.linesAddedByCategory), testFilesTouched: s.testFilesTouched.size, testRunCommands: s.testRunCommands, trackerCreated: s.trackerCreated, trackerUpdated: s.trackerUpdated, issuesTracked: s.issuesTracked, prsOpened: s.prsOpened, gitPush: s.gitPush, gitPull: s.gitPull, commitsWithMessage: s.commitsWithMessage, conventionalCommits: s.conventionalCommits }; }
function parsePatchLines(patchText) {
  const out = { added: 0, removed: 0, addedByCategory: {} };
  if (typeof patchText !== 'string') return out;
  let curCat = 'other';
  for (const ln of patchText.split('\n')) {
    const fm = ln.match(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/);
    if (fm) { curCat = classifyFileType(fm[1].trim()).category; continue; }
    if (ln.startsWith('***') || ln.startsWith('@@') || ln.startsWith('+++') || ln.startsWith('---')) continue;
    if (ln.startsWith('+')) { out.added++; out.addedByCategory[curCat] = (out.addedByCategory[curCat] || 0) + 1; }
    else if (ln.startsWith('-')) out.removed++;
  }
  return out;
}
function isPlannerMcp(name) { const n = String(name); return n.includes('tracker_') || n.includes('excalidraw') || n.includes('mockup') || n.includes('mindmap') || n.includes('datamodel'); }

// ===========================================================================
// Claude Code analyzer  (~/.claude/projects/**/*.jsonl)
// ===========================================================================
async function analyzeClaude() {
  const files = await findJsonl(CLAUDE_DIR);
  const sessionIds = new Set(), sessionToProject = new Map(), sessionFirstTs = new Map(), sessionLastTs = new Map(), sessionBranch = new Map(), sessionHasRead = new Set(), sidechainSessions = new Set();
  const dayBuckets = new Map(); // date -> { ts:[], sids:Set, tokens }
  let minTs = null, maxTs = null;
  const toolCounts = new Map(), modelCounts = new Map(), mcpCounts = new Map(), projectTokens = new Map();
  let toolCallsTotal = 0, agentCalls = 0, taskCalls = 0, readCalls = 0, editWriteCalls = 0, editWriteWithRead = 0, notebookEdits = 0, testRunBash = 0;
  let inTok = 0, outTok = 0, cacheRead = 0, cacheCreate = 0, commitBash = 0, commitProposal = 0;
  const maker = newMakerAcc(), shipped = newShipped(), sessionFileEdits = new Map(), sessionSignals = new Map();

  function sig(sid) { if (!sid) return null; if (!sessionSignals.has(sid)) sessionSignals.set(sid, { edits: 0, reads: 0, searches: 0, testRuns: 0, opsCmds: 0, makerCategories: new Map(), plannerMcpCalls: 0, commitVerbLabels: [] }); return sessionSignals.get(sid); }

  for (const file of files) {
    const projectSlug = path.relative(CLAUDE_DIR, file).split(path.sep)[0];
    await eachLine(file, (rec) => {
      const sid = rec.sessionId ?? rec.session_id ?? null;
      const ts = rec.timestamp ? Date.parse(rec.timestamp) : NaN;
      const inMonth = monthOf(ts) === TARGET_MONTH; // month-scope the headline aggregates
      if (sid && inMonth) { sessionIds.add(sid); if (!sessionToProject.has(sid)) sessionToProject.set(sid, projectSlug); if (typeof rec.gitBranch === 'string' && rec.gitBranch.trim() && !sessionBranch.has(sid)) sessionBranch.set(sid, rec.gitBranch.trim()); }
      if (!Number.isNaN(ts)) {
        if (minTs === null || ts < minTs) minTs = ts; if (maxTs === null || ts > maxTs) maxTs = ts;
        if (sid) { const f = sessionFirstTs.get(sid); if (f === undefined || ts < f) sessionFirstTs.set(sid, ts); const l = sessionLastTs.get(sid); if (l === undefined || ts > l) sessionLastTs.set(sid, ts); }
        const dateStr = new Date(ts).toISOString().slice(0, 10);
        let db = dayBuckets.get(dateStr); if (!db) { db = { ts: [], sids: new Set(), tokens: 0 }; dayBuckets.set(dateStr, db); }
        db.ts.push(ts); if (sid) db.sids.add(sid);
      }
      if (rec.isSidechain === true && sid && inMonth) sidechainSessions.add(sid);
      if (rec.type === 'assistant' && rec.message) {
        const msg = rec.message;
        if (inMonth && typeof msg.model === 'string') bump(modelCounts, msg.model);
        if (msg.usage) {
          const i = Number(msg.usage.input_tokens) || 0, o = Number(msg.usage.output_tokens) || 0, cr = Number(msg.usage.cache_read_input_tokens) || 0, cc = Number(msg.usage.cache_creation_input_tokens) || 0;
          if (inMonth) {
            inTok += i; outTok += o; cacheRead += cr; cacheCreate += cc;
            if (!projectTokens.has(projectSlug)) projectTokens.set(projectSlug, { input: 0, cacheRead: 0, cacheCreation: 0, records: 0 });
            const pt = projectTokens.get(projectSlug); pt.input += i; pt.cacheRead += cr; pt.cacheCreation += cc; pt.records++;
          }
          if (!Number.isNaN(ts)) { const db = dayBuckets.get(new Date(ts).toISOString().slice(0, 10)); if (db) db.tokens += i + o + cr + cc; } // full history for the monthly sparkline
        }
        if (inMonth && typeof rec.attributionMcpServer === 'string' && rec.attributionMcpServer.trim()) { const k = normKey(rec.attributionMcpServer); if (!mcpCounts.has(k)) mcpCounts.set(k, { display: rec.attributionMcpServer, count: 0 }); }
        if (inMonth && Array.isArray(msg.content)) {
          const s = sig(sid);
          for (const item of msg.content) {
            if (!item || item.type !== 'tool_use' || typeof item.name !== 'string') continue;
            const name = item.name, input = item.input && typeof item.input === 'object' ? item.input : {};
            toolCallsTotal++; bump(toolCounts, name);
            if (name === 'Agent') agentCalls++; if (name === 'Task') taskCalls++;
            if (name === 'Read') { readCalls++; if (sid) sessionHasRead.add(sid); if (s) s.reads++; }
            else if (name === 'Grep' || name === 'Glob') { if (s) s.searches++; }
            else if (name === 'Edit' || name === 'Write' || name === 'NotebookEdit') {
              if (name === 'NotebookEdit') notebookEdits++; else editWriteCalls++;
              if (name !== 'NotebookEdit' && sid && sessionHasRead.has(sid)) editWriteWithRead++;
              const fp = typeof input.file_path === 'string' ? input.file_path : typeof input.notebook_path === 'string' ? input.notebook_path : null;
              if (fp) {
                const cat = addMakerFile(maker, fp); if (s) bump(s.makerCategories, cat);
                if (sid) { if (!sessionFileEdits.has(sid)) sessionFileEdits.set(sid, new Map()); bump(sessionFileEdits.get(sid), fp); }
                const added = name === 'Write' ? countLines(input.content) : name === 'NotebookEdit' ? countLines(input.new_source) : countLines(input.new_string);
                const removed = name === 'Edit' ? countLines(input.old_string) : 0;
                shipped.linesAdded += added; shipped.linesRemoved += removed; bump(shipped.linesAddedByCategory, cat, added);
                if (isTestFile(fp)) shipped.testFilesTouched.add(fp);
              }
              if (s) s.edits++;
            }
            if (name === 'Bash' && typeof input.command === 'string') {
              const cmd = input.command;
              if (cmd.includes('git commit') && !cmd.includes('--amend')) { commitBash++; const mm = cmd.match(/-m\s+(["'])([\s\S]*?)\1/); if (mm) { shipped.commitsWithMessage++; const lbl = commitVerbLabel(mm[2]); if (lbl) { shipped.conventionalCommits++; if (s) s.commitVerbLabels.push(lbl); } } }
              if (isTestCommand(cmd)) { testRunBash++; if (s) s.testRuns++; }
              if (isOpsCommand(cmd) && s) s.opsCmds++;
              if (isPrCreate(cmd)) shipped.prsOpened++; if (isGitPush(cmd)) shipped.gitPush++; if (isGitPull(cmd)) shipped.gitPull++;
              shipped.issuesTracked += countIssueCli(cmd);
            }
            if (name.includes('developer_git_commit_proposal')) commitProposal++;
            if (name.includes('tracker_create')) { shipped.trackerCreated++; shipped.issuesTracked++; }
            if (name.includes('tracker_update')) { shipped.trackerUpdated++; shipped.issuesTracked++; }
            if (s && isPlannerMcp(name)) s.plannerMcpCalls++;
            if (name.startsWith('mcp__')) {
              const rest = name.slice(5); const idx = rest.indexOf('__'); const server = idx === -1 ? rest : rest.slice(0, idx); const k = normKey(server);
              if (!mcpCounts.has(k)) mcpCounts.set(k, { display: server, count: 0 }); mcpCounts.get(k).count++;
              if (TRACKER_MCP_RE.test(server) || name.includes('create_issue') || name.includes('update_issue')) shipped.issuesTracked++;
            }
          }
        }
      }
    });
  }

  const totalSessions = sessionIds.size;
  const totalTokens = inTok + outTok + cacheRead + cacheCreate;
  const cacheReadRatio = (cacheRead + cacheCreate + inTok) > 0 ? cacheRead / (cacheRead + cacheCreate + inTok) : 0;

  // models -> family display
  const modelDisplay = new Map();
  for (const [m, c] of modelCounts) { if (m === '<synthetic>') continue; bump(modelDisplay, formatModelDisplay(m), c); }
  const modelsTop3 = topShare([...modelDisplay.entries()], 3);
  const toolsTop3 = topShare([...toolCounts.entries()].filter(([n]) => !n.startsWith('mcp__')), 3);
  const mcpRanked = [...mcpCounts.values()].filter((v) => v.count > 0).sort((a, b) => b.count - a.count);
  const mcpTop3 = topShare(mcpRanked.map((v) => [v.display, v.count]), 3);
  const distinctMcp = mcpCounts.size;

  // churn
  let pairs = 0, revised = 0, editCallsWithPath = 0;
  for (const pf of sessionFileEdits.values()) for (const c of pf.values()) { pairs++; editCallsWithPath += c; if (c >= 2) revised++; }
  const filesRevisedShare = pairs > 0 ? revised / pairs : 0;
  const postEditCorrectionRate = editCallsWithPath > 0 ? (editCallsWithPath - pairs) / editCallsWithPath : 0;
  const readBeforeEditRate = editWriteCalls > 0 ? editWriteWithRead / editWriteCalls : 0;

  // active hours per day + daily series + rhythm + monthly
  const daily = []; let totalActiveMs = 0;
  const rhythm = new Array(24).fill(0);
  const monthAgg = new Map();
  for (const [date, db] of [...dayBuckets.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
    const sorted = [...db.ts].sort((a, b) => a - b); let am = 0;
    for (let i = 1; i < sorted.length; i++) { const g = sorted[i] - sorted[i - 1]; if (g > 0 && g < TEN_MIN) am += g; }
    if (date.slice(0, 7) === TARGET_MONTH) totalActiveMs += am; // headline hours = target month only
    daily.push({ date, sessions: db.sids.size }); // full history for the heatmap
    const mk = date.slice(0, 7); if (!monthAgg.has(mk)) monthAgg.set(mk, { sessions: 0, tokens: 0 }); monthAgg.get(mk).tokens += db.tokens;
  }
  for (const first of sessionFirstTs.values()) { if (monthOf(first) === TARGET_MONTH) rhythm[new Date(first).getHours()]++; } // rhythm = target month
  // monthly sessions by session start
  const monthSessions = new Map();
  for (const first of sessionFirstTs.values()) { const d = new Date(first); const mk = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; bump(monthSessions, mk); }
  const monthly = [...monthAgg.keys()].sort().map((mk) => ({ month: mk, sessions: monthSessions.get(mk) || 0, tokensMillions: round1(monthAgg.get(mk).tokens / 1e6) }));
  const activeHours = round1(totalActiveMs / 3.6e6);

  // longest thread (resumption artifact — internal only, never surfaced)
  let longestId = null, longestMs = -1;
  for (const s of sessionIds) { const f = sessionFirstTs.get(s), l = sessionLastTs.get(s); if (f !== undefined && l !== undefined && (l - f) > longestMs) { longestMs = l - f; longestId = s; } }

  // per-project cache ratio
  const perProject = [...projectTokens.entries()].map(([slug, t]) => ({ project: slug, records: t.records, cacheReadRatio: (t.cacheRead + t.cacheCreation + t.input) > 0 ? t.cacheRead / (t.cacheRead + t.cacheCreation + t.input) : 0 })).filter((p) => p.records >= 20).sort((a, b) => b.records - a.records);

  // task-mix
  const tally = newTaskTally();
  for (const s of sessionIds) { const sg = sessionSignals.get(s) || { edits: 0, reads: 0, searches: 0, testRuns: 0, opsCmds: 0, makerCategories: new Map(), plannerMcpCalls: 0, commitVerbLabels: [] }; sg.branchLabel = branchPrefixLabel(sessionBranch.get(s)); addTaskMix(tally, classifyTaskMix(sg)); }

  // archetype (rebalanced, plan mode demoted out)
  const delegationRate = toolCallsTotal > 0 ? (agentCalls + taskCalls) / toolCallsTotal : 0;
  const sidechainShare = totalSessions > 0 ? sidechainSessions.size / totalSessions : 0;
  const testRunSessionShare = totalSessions > 0 ? [...sessionSignals.values()].filter((s) => s.testRuns > 0).length / totalSessions : 0;
  const normDelegation = clamp01(delegationRate / 0.05), normMcp = clamp01(distinctMcp / 15), normTools = clamp01(toolCounts.size / 60), normSide = clamp01(sidechainShare / 0.3), normReview = clamp01(readBeforeEditRate / 0.9), normTest = clamp01(testRunSessionShare / 0.3), normChurn = clamp01(postEditCorrectionRate / 0.7);
  const normVerification = (normReview + normTest) / 2;
  const structureScore = Math.round(100 * (0.25 * normDelegation + 0.25 * normMcp + 0.25 * normTools + 0.25 * normVerification));
  const handsOff = (normDelegation + normSide) / 2, handsOn = (normReview + normChurn) / 2;
  const autonomyScore = Math.round(100 * clamp01(0.5 + (handsOff - handsOn) / 2));
  const quadrant = autonomyScore >= 50 ? (structureScore >= 50 ? 'Orchestra Conductor' : 'YOLO Merger') : (structureScore >= 50 ? 'Control Freak' : 'Vibe Coder');
  const avgCacheCreation = totalSessions > 0 ? cacheCreate / totalSessions : 0;
  const contextHoarder = avgCacheCreation / 100000, toolSprawler = distinctMcp / 10;
  let archetype = quadrant, override = null;
  if (toolSprawler >= 1.5 && toolSprawler >= contextHoarder) { archetype = 'Tool Sprawler'; override = 'Tool Sprawler'; }
  else if (contextHoarder >= 1.5 && contextHoarder > toolSprawler) { archetype = 'Context Hoarder'; override = 'Context Hoarder'; }

  return {
    agent: 'claude', sessions: totalSessions, projects: new Set(sessionToProject.values()).size,
    dateSpan: { min: minTs ? new Date(minTs).toISOString() : null, max: maxTs ? new Date(maxTs).toISOString() : null },
    toolCallsTotal, distinctToolCount: toolCounts.size,
    delegation: { agentCalls, taskCalls, delegationToolCalls: agentCalls + taskCalls, delegationRate, sidechainSessionCount: sidechainSessions.size, sidechainShare },
    tokens: { input: inTok, output: outTok, cacheRead, cacheCreation: cacheCreate, total: totalTokens, cacheReadRatio },
    topLists: { tools: toolsTop3, models: modelsTop3, mcpServers: mcpTop3 },
    mcpReach: { distinctServerCount: distinctMcp, servers: mcpRanked.map((v) => ({ display: v.display, calls: v.count })) },
    commitProxy: { bashGitCommit: commitBash, commitProposal, total: commitBash + commitProposal },
    makerMix: summarizeMaker(maker), shipped: shippedOut(shipped),
    churn: { filesRevisedShare, postEditCorrectionRate, editWriteCalls, testRunSessionShare },
    taskMix: summarizeTaskMix(tally),
    perProjectCacheReadRatio: perProject,
    activeHours, daily, monthly, rhythm: { byHourLocal: rhythm },
    longestThread: longestId ? { days: round1(longestMs / 86400000), project: sessionToProject.get(longestId) } : null,
    archetype: { structureScore, autonomyScore, baseQuadrant: quadrant, overrideApplied: override, archetype, inputs: { delegationRate, distinctMcpServers: distinctMcp, sidechainShare, readBeforeEditRate, postEditCorrectionRate, avgCacheCreationPerSession: avgCacheCreation, testRunSessionShare } },
  };
}

// ===========================================================================
// Codex analyzer  (~/.codex/sessions/**/*.jsonl)  — one file == one session
// ===========================================================================
function extractCodexCmd(p) {
  const name = p.name;
  if (name === 'exec_command' || name === 'exec' || name === 'shell' || name === 'local_shell') {
    const a = p.arguments;
    if (typeof a === 'string') { const t = a.trim(); if (t.startsWith('{')) { try { const o = JSON.parse(t); if (Array.isArray(o.cmd)) return o.cmd.join(' '); if (typeof o.cmd === 'string') return o.cmd; if (typeof o.command === 'string') return o.command; } catch { /**/ } } return t; }
    if (typeof p.input === 'string') return p.input;
  }
  return null;
}
function codexToolDisplay(n) { if (n === 'exec_command' || n === 'exec' || n === 'shell' || n === 'local_shell') return 'shell (exec)'; return n; }
function parsePatchPaths(txt) { if (typeof txt !== 'string') return []; const out = []; const re = /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm; let m; while ((m = re.exec(txt)) !== null) out.push(m[1].trim()); return out; }

async function analyzeCodex() {
  const files = await findJsonl(CODEX_DIR);
  let minTs = null, maxTs = null, sessions = 0, tokInput = 0, tokCached = 0, tokOutput = 0, tokReasoning = 0, activeMs = 0, applyPatchCalls = 0;
  const toolCategory = new Map(), toolNames = new Map(), mcpServerCounts = new Map(), modelSessions = new Map(), projects = new Map(), daily = new Map(), monthly = new Map(), rhythm = new Array(24).fill(0);
  const maker = newMakerAcc(), shipped = newShipped(); const applyOps = { add: 0, update: 0, delete: 0 };
  const commitShellIds = new Set(), commitPropIds = new Set(); let commitShellNoId = 0, commitPropNoId = 0;
  const tally = newTaskTally();

  for (const file of files) {
    const records = [];
    await eachLine(file, (r) => records.push(r));
    const timestamps = []; let model = null, cwd = null, startTs = null, lastUsage = null;
    const mcpCallIds = new Set(), patchEndIds = new Set();
    const s = { edits: 0, reads: 0, searches: 0, testRuns: 0, opsCmds: 0, makerCategories: new Map(), plannerMcpCalls: 0, commitVerbLabels: [], branchLabel: null };
    // Light scan: every session feeds the full-history trends (heatmap +
    // sparklines) and the date span, then the month gate scopes the rest.
    let lsMeta = null, lsMin = null, lsUsage = null;
    for (const rec of records) {
      const rts = rec.timestamp ? Date.parse(rec.timestamp) : NaN;
      if (!Number.isNaN(rts)) { if (minTs === null || rts < minTs) minTs = rts; if (maxTs === null || rts > maxTs) maxTs = rts; if (lsMin === null || rts < lsMin) lsMin = rts; if (rec.type === 'session_meta' && lsMeta === null) lsMeta = rts; }
      const lp = rec.payload && typeof rec.payload === 'object' ? rec.payload : null;
      if (rec.type === 'event_msg' && lp && lp.type === 'token_count' && lp.info && lp.info.total_token_usage) lsUsage = lp.info.total_token_usage;
    }
    const st0 = lsMeta ?? lsMin;
    if (st0 !== null) {
      const dstr = new Date(st0).toISOString().slice(0, 10);
      bump(daily, dstr);
      const mk = dstr.slice(0, 7); if (!monthly.has(mk)) monthly.set(mk, { sessions: 0, tokens: 0 }); monthly.get(mk).sessions++;
      if (lsUsage) monthly.get(mk).tokens += (Number(lsUsage.input_tokens) || 0) + (Number(lsUsage.output_tokens) || 0);
    }
    if (monthOf(st0) !== TARGET_MONTH) continue; // scope the rest of the analysis to the target month
    // pass 1
    for (const rec of records) {
      const t = rec.type, p = rec.payload && typeof rec.payload === 'object' ? rec.payload : null;
      const ts = rec.timestamp ? Date.parse(rec.timestamp) : NaN;
      if (!Number.isNaN(ts)) { timestamps.push(ts); if (minTs === null || ts < minTs) minTs = ts; if (maxTs === null || ts > maxTs) maxTs = ts; }
      if (t === 'session_meta') { if (!Number.isNaN(ts) && startTs === null) startTs = ts; const meta = p || rec; if (typeof meta.cwd === 'string') cwd = meta.cwd; }
      else if (t === 'turn_context' && p) { if (typeof p.model === 'string' && !model) model = p.model; if (typeof p.cwd === 'string' && !cwd) cwd = p.cwd; }
      else if (t === 'event_msg' && p) {
        const pty = p.type;
        if (pty === 'token_count' && p.info && p.info.total_token_usage) lastUsage = p.info.total_token_usage;
        else if (pty === 'mcp_tool_call_end' && p.invocation) {
          const server = String(p.invocation.server || '(unknown)'), tool = String(p.invocation.tool || '');
          if (p.call_id) mcpCallIds.add(p.call_id);
          bump(toolCategory, 'mcp'); const k = normKey(server); if (!mcpServerCounts.has(k)) mcpServerCounts.set(k, { display: serverDisplay(server), count: 0 }); mcpServerCounts.get(k).count++;
          if (tool.includes('developer_git_commit_proposal')) { if (p.call_id) commitPropIds.add(p.call_id); else commitPropNoId++; }
          if (tool.includes('tracker_create')) { shipped.trackerCreated++; shipped.issuesTracked++; }
          if (tool.includes('tracker_update')) { shipped.trackerUpdated++; shipped.issuesTracked++; }
          if (isTrackerMcpTool(server, tool) && !tool.includes('tracker_')) shipped.issuesTracked++;
          if (isPlannerMcp(tool)) s.plannerMcpCalls++;
        }
        else if (pty === 'patch_apply_end') {
          if (p.call_id) patchEndIds.add(p.call_id);
          if (p.changes && typeof p.changes === 'object') for (const [ap, ch] of Object.entries(p.changes)) { const cat = addMakerFile(maker, ap); bump(s.makerCategories, cat); s.edits++; if (isTestFile(ap)) shipped.testFilesTouched.add(ap); const tp = ch && ch.type ? ch.type : 'update'; if (tp === 'add') applyOps.add++; else if (tp === 'delete') applyOps.delete++; else applyOps.update++; }
        }
      }
    }
    // pass 2
    for (const rec of records) {
      if (rec.type !== 'response_item') continue;
      const p = rec.payload && typeof rec.payload === 'object' ? rec.payload : null; if (!p) continue;
      const pty = p.type; if (pty !== 'function_call' && pty !== 'custom_tool_call' && pty !== 'web_search_call') continue;
      const name = pty === 'web_search_call' ? 'web_search' : String(p.name || '(unknown)'); const callId = p.call_id; const isDupe = callId && mcpCallIds.has(callId);
      if (!isDupe) { bump(toolNames, codexToolDisplay(name)); if (name === 'exec_command' || name === 'exec' || name === 'shell' || name === 'local_shell') bump(toolCategory, 'exec'); else if (name === 'apply_patch') bump(toolCategory, 'apply_patch'); else if (name === 'web_search') bump(toolCategory, 'web_search'); else bump(toolCategory, 'other_function'); }
      if (name.includes('developer_git_commit_proposal')) { if (callId) commitPropIds.add(callId); else commitPropNoId++; }
      if (name === 'apply_patch') {
        applyPatchCalls++;
        if (callId && !patchEndIds.has(callId) && typeof p.input === 'string') for (const fp of parsePatchPaths(p.input)) { const cat = addMakerFile(maker, fp); bump(s.makerCategories, cat); s.edits++; if (isTestFile(fp)) shipped.testFilesTouched.add(fp); }
        if (typeof p.input === 'string') { const pl = parsePatchLines(p.input); shipped.linesAdded += pl.added; shipped.linesRemoved += pl.removed; for (const [cat, n] of Object.entries(pl.addedByCategory)) bump(shipped.linesAddedByCategory, cat, n); }
      }
      const cmd = extractCodexCmd(p);
      if (cmd) {
        if (/git\s+commit/.test(cmd) && !/--amend/.test(cmd)) { if (callId) commitShellIds.add(callId); else commitShellNoId++; const mm = cmd.match(/-m\s+(["'])([\s\S]*?)\1/); if (mm) { shipped.commitsWithMessage++; const lbl = commitVerbLabel(mm[2]); if (lbl) { shipped.conventionalCommits++; s.commitVerbLabels.push(lbl); } } }
        if (isTestCommand(cmd)) { s.testRuns++; shipped.testRunCommands++; }
        if (isOpsCommand(cmd)) s.opsCmds++;
        if (isPrCreate(cmd)) shipped.prsOpened++; if (isGitPush(cmd)) shipped.gitPush++; if (isGitPull(cmd)) shipped.gitPull++;
        shipped.issuesTracked += countIssueCli(cmd);
        if (/^\s*(cat|sed -n|head|tail|less|bat)\b/.test(cmd)) s.reads++;
        if (/\b(rg|grep|find|ls|fd|ag)\b/.test(cmd)) s.searches++;
      }
    }
    // rollups
    sessions++;
    bump(modelSessions, model || '(unknown)');
    bump(projects, cwd || '(unknown)');
    if (lastUsage) { tokInput += Number(lastUsage.input_tokens) || 0; tokCached += Number(lastUsage.cached_input_tokens) || 0; tokOutput += Number(lastUsage.output_tokens) || 0; tokReasoning += Number(lastUsage.reasoning_output_tokens) || 0; }
    const st = startTs ?? (timestamps.length ? Math.min(...timestamps) : null);
    if (st !== null) rhythm[new Date(st).getHours()]++; // rhythm = target month; daily + monthly already recorded in the light scan
    timestamps.sort((a, b) => a - b);
    for (let i = 1; i < timestamps.length; i++) { const g = timestamps[i] - timestamps[i - 1]; if (g > 0 && g < TEN_MIN) activeMs += g; }
    addTaskMix(tally, classifyTaskMix(s));
  }

  const totalTokens = tokInput + tokOutput;
  const toolsTop3 = topShare([...toolNames.entries()], 3);
  const modelDisplay = new Map(); for (const [m, c] of modelSessions) { if (m === 'codex-auto-review' || m === '(unknown)') continue; bump(modelDisplay, m, c); }
  const modelsTop3 = topShare([...modelDisplay.entries()], 3);
  const mcpRanked = [...mcpServerCounts.values()].sort((a, b) => b.count - a.count);
  const mcpTop3 = topShare(mcpRanked.map((v) => [v.display, v.count]), 3);
  const commitShell = commitShellIds.size + commitShellNoId, commitProp = commitPropIds.size + commitPropNoId;

  return {
    agent: 'codex', sessions, projects: projects.size,
    dateSpan: { min: minTs ? new Date(minTs).toISOString() : null, max: maxTs ? new Date(maxTs).toISOString() : null },
    toolCallsTotal: [...toolCategory.values()].reduce((a, b) => a + b, 0), distinctToolCount: toolNames.size,
    delegation: { delegationToolCalls: 0, delegationRate: 0, sidechainShare: 0 },
    tokens: { input: tokInput, cached: tokCached, output: tokOutput, reasoning: tokReasoning, total: totalTokens, cacheReadRatio: 0 },
    topLists: { tools: toolsTop3, models: modelsTop3, mcpServers: mcpTop3 },
    mcpReach: { distinctServerCount: mcpServerCounts.size, servers: mcpRanked.map((v) => ({ display: v.display, calls: v.count })) },
    commitProxy: { shellGitCommit: commitShell, developerGitCommitProposal: commitProp, total: commitShell + commitProp },
    makerMix: summarizeMaker(maker), shipped: shippedOut(shipped),
    activeHours: round1(activeMs / 3.6e6),
    daily: Object.fromEntries([...daily.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)),
    monthly: Object.fromEntries([...monthly.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([k, v]) => [k, { sessions: v.sessions, tokens: v.tokens }])),
    rhythm: { byHourLocal: rhythm },
    taskMix: summarizeTaskMix(tally),
    toolCategories: Object.fromEntries(toolCategory),
  };
}

// ===========================================================================
// Combine (cross-agent)
// ===========================================================================
function pctOf(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }
function monthDelta(curr, prev, minBase) { if (prev == null || prev < minBase) return { value: null, curr, prev }; return { value: (curr - prev) / prev, curr, prev }; }

function combine(claude, codex) {
  const sessions = claude.sessions + codex.sessions;
  const toolCalls = claude.toolCallsTotal + codex.toolCallsTotal;
  const combinedTokens = claude.tokens.total + codex.tokens.total;
  const hours = round1(claude.activeHours + codex.activeHours);

  // merged MCP
  const mcpMerged = new Map();
  for (const s of claude.mcpReach.servers) mcpMerged.set(normKey(s.display), { display: s.display, count: s.calls });
  for (const s of codex.mcpReach.servers) { const k = normKey(s.display); if (mcpMerged.has(k)) mcpMerged.get(k).count += s.calls; else mcpMerged.set(k, { display: s.display, count: s.calls }); }
  const distinctMcp = mcpMerged.size;
  const mcpTop3 = topShare([...mcpMerged.values()].map((v) => [v.display, v.count]), 3);

  const toolsMerged = mergeCounts(new Map(claude.topLists.tools.top.map((t) => [t.name, t.count])), new Map(codex.topLists.tools.top.map((t) => [t.name, t.count])));
  const toolsTop3 = topShareWithTotal([...toolsMerged.entries()], claude.topLists.tools.total + codex.topLists.tools.total, 3);
  const modelsMerged = mergeCounts(new Map(claude.topLists.models.top.map((t) => [t.name, t.count])), new Map(codex.topLists.models.top.map((t) => [t.name, t.count])));
  const modelsTop3 = topShareWithTotal([...modelsMerged.entries()], claude.topLists.models.total + codex.topLists.models.total, 3);

  const makerCombined = mergeMakerSummaries(claude.makerMix, codex.makerMix);
  const commitsCombined = claude.commitProxy.total + codex.commitProxy.total;

  // shipped merge
  const sc = claude.shipped, sx = codex.shipped;
  const shippedCombined = { linesAdded: sc.linesAdded + sx.linesAdded, linesRemoved: sc.linesRemoved + sx.linesRemoved, linesAddedByCategory: Object.fromEntries(mergeCounts(sc.linesAddedByCategory, sx.linesAddedByCategory)), testFilesTouched: sc.testFilesTouched + sx.testFilesTouched, testRunCommands: sc.testRunCommands + sx.testRunCommands, trackerCreated: sc.trackerCreated + sx.trackerCreated, trackerUpdated: sc.trackerUpdated + sx.trackerUpdated, issuesTracked: sc.issuesTracked + sx.issuesTracked, prsOpened: sc.prsOpened + sx.prsOpened, gitPush: sc.gitPush + sx.gitPush, gitPull: sc.gitPull + sx.gitPull };

  // combined daily + heatmap + biggest day
  const dailyMap = new Map();
  for (const d of claude.daily) bump(dailyMap, d.date, d.sessions);
  for (const [date, n] of Object.entries(codex.daily)) bump(dailyMap, date, n);
  const daily = [...dailyMap.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([date, sess]) => ({ date, sessions: sess }));
  let biggestDay = { date: null, sessions: 0 }; for (const d of daily) if (d.date.slice(0, 7) === TARGET_MONTH && d.sessions > biggestDay.sessions) biggestDay = d;
  const activeDays = daily.filter((d) => d.date.slice(0, 7) === TARGET_MONTH && d.sessions > 0).length;

  // monthly series (combined) + deltas
  const claudeMonthly = new Map(claude.monthly.map((m) => [m.month, m]));
  const codexMonthly = new Map(Object.entries(codex.monthly));
  const combinedMonth = (mk) => { const c = claudeMonthly.get(mk), x = codexMonthly.get(mk); return { sessions: (c ? c.sessions : 0) + (x ? x.sessions : 0), tokensM: (c ? c.tokensMillions : 0) + (x ? x.tokens / 1e6 : 0) }; };
  const monthKeys = [...new Set([...claudeMonthly.keys(), ...codexMonthly.keys()])].sort();
  const monthlySeries = monthKeys.map((mk) => { const m = combinedMonth(mk); return { month: mk, sessions: m.sessions, tokensM: round1(m.tokensM) }; });
  // month-over-month: the target month vs the month before it (combined).
  const cur = TARGET_MONTH, prev = prevMonthKey(TARGET_MONTH);
  const curM = combinedMonth(cur), prevM = combinedMonth(prev);
  const deltaSessions = monthDelta(curM.sessions, prevM.sessions, 10);
  const deltaTokens = monthDelta(curM.tokensM, prevM.tokensM, 50);
  const prevMonthName = monthShort(prev);
  const cardPills = [
    { label: `sessions vs ${prevMonthName}`, delta: deltaSessions },
    { label: `tokens vs ${prevMonthName}`, delta: deltaTokens },
  ];

  // rhythm combined
  const rhythm = new Array(24).fill(0);
  for (let h = 0; h < 24; h++) rhythm[h] = (claude.rhythm.byHourLocal[h] || 0) + (codex.rhythm.byHourLocal[h] || 0);
  const peakHour = rhythm.indexOf(Math.max(...rhythm));
  const rhythmTotal = rhythm.reduce((a, b) => a + b, 0);
  const nightShare = rhythmTotal > 0 ? [22, 23, 0, 1, 2, 3, 4].reduce((s, h) => s + rhythm[h], 0) / rhythmTotal : 0;

  const WORDS_PER_TOKEN = 0.75, WAP = 587287;
  const tokenEquivalence = `about ${Math.round((combinedTokens * WORDS_PER_TOKEN) / WAP).toLocaleString('en-US')} reads of War and Peace`;

  const spanStart = codex.dateSpan.min && (!claude.dateSpan.min || codex.dateSpan.min < claude.dateSpan.min) ? codex.dateSpan.min : claude.dateSpan.min;
  const spanEnd = codex.dateSpan.max && (!claude.dateSpan.max || codex.dateSpan.max > claude.dateSpan.max) ? codex.dateSpan.max : claude.dateSpan.max;

  return {
    headline: { sessions, hours, toolCalls, combinedTokens, combinedTokensDisplay: `${round1(combinedTokens / 1e9)}B`, distinctMcpServers: distinctMcp, dateSpan: { start: spanStart, end: spanEnd }, tokenEquivalence },
    perAgent: { claude: { sessions: claude.sessions, hours: claude.activeHours, toolCalls: claude.toolCallsTotal, tokens: claude.tokens.total, commits: claude.commitProxy.total }, codex: { sessions: codex.sessions, hours: codex.activeHours, toolCalls: codex.toolCallsTotal, tokens: codex.tokens.total, commits: codex.commitProxy.total } },
    split: [
      { metric: 'Sessions', claude: pctOf(claude.sessions, sessions), codex: pctOf(codex.sessions, sessions) },
      { metric: 'Tool calls', claude: pctOf(claude.toolCallsTotal, toolCalls), codex: pctOf(codex.toolCallsTotal, toolCalls) },
      { metric: 'Active hours', claude: pctOf(claude.activeHours, claude.activeHours + codex.activeHours), codex: pctOf(codex.activeHours, claude.activeHours + codex.activeHours) },
    ],
    makerMix: { combined: makerCombined, claude: claude.makerMix, codex: codex.makerMix },
    topLists: { tools: { combined: toolsTop3 }, models: { combined: modelsTop3 }, mcpServers: { combined: mcpTop3 } },
    commits: { combined: commitsCombined, claude: claude.commitProxy.total, codex: codex.commitProxy.total },
    shipped: { combined: shippedCombined, claude: sc, codex: sx },
    deltas: { cardPills },
    daily, activeDays, biggestDay, monthlySeries,
    rhythm: { byHourLocal: rhythm, peakHour, nightShare },
    tokenSplit: [
      { label: 'Cache read', value: round1(claude.tokens.cacheReadRatio * 100), color: '#6395FF' },
      { label: 'Cache creation', value: round1((claude.tokens.cacheCreation / (claude.tokens.total || 1)) * 100), color: '#38BDC0' },
      { label: 'Output', value: round1((claude.tokens.output / (claude.tokens.total || 1)) * 100), color: '#B1CAFF' },
      { label: 'Input', value: round1((claude.tokens.input / (claude.tokens.total || 1)) * 100), color: '#8B7FE8' },
    ],
    archetype: claude.archetype,
    taskMix: { claude: claude.taskMix, codex: codex.taskMix },
    perProjectCacheReadRatio: claude.perProjectCacheReadRatio,
    _claude: claude, _codex: codex,
  };
}

// ===========================================================================
// Grader  (grade + dimensions + evidence fixes + per-project + next rung)
// ===========================================================================
function computeGrade(C) {
  const cl = C._claude, a = cl.archetype.inputs;
  // Dimensions, each 0-100 (provisional bars, self-relative — no cohort).
  const delegation = Math.round(100 * clamp01(0.5 * clamp01(a.delegationRate / 0.05) + 0.5 * clamp01(a.sidechainShare / 0.3)));
  const contextHygiene = Math.round(100 * clamp01(0.6 * cl.tokens.cacheReadRatio / 0.9 + 0.4 * (1 - clamp01(a.avgCacheCreationPerSession / 3000000))));
  const verification = Math.round(100 * clamp01(0.6 * clamp01(a.readBeforeEditRate / 0.9) + 0.4 * clamp01(a.testRunSessionShare / 0.3)));
  const toolReach = Math.round(100 * (a.distinctMcpServers <= 20 ? clamp01(a.distinctMcpServers / 12) : clamp01(1 - (a.distinctMcpServers - 20) / 40)));
  const reworkChurn = Math.round(100 * clamp01(1 - clamp01((a.postEditCorrectionRate - 0.35) / 0.55)));
  // context-design effectiveness: volume-weighted cache reuse (does the written
  // context actually cut re-reads where the work happens), lightly penalized for
  // a wild spread between projects.
  const pp = cl.perProjectCacheReadRatio;
  const totRec = pp.reduce((s, p) => s + p.records, 0);
  const weightedReuse = totRec > 0 ? pp.reduce((s, p) => s + p.cacheReadRatio * p.records, 0) / totRec : 0;
  const ratios = pp.map((p) => p.cacheReadRatio);
  const spread = ratios.length >= 2 ? Math.max(...ratios) - Math.min(...ratios) : 0;
  const contextDesign = Math.round(100 * clamp01(0.75 * clamp01(weightedReuse / 0.9) + 0.25 * (1 - clamp01(spread / 0.8))));
  const dims = [
    { key: 'delegation', label: 'Delegation & orchestration', score: delegation },
    { key: 'contextHygiene', label: 'Context hygiene', score: contextHygiene },
    { key: 'verification', label: 'Verification follow-through', score: verification },
    { key: 'toolReach', label: 'Tool reach & sprawl', score: toolReach },
    { key: 'reworkChurn', label: 'Rework churn', score: reworkChurn },
    { key: 'contextDesign', label: 'Context-design effectiveness', score: contextDesign },
  ];
  const grade = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  const letter = grade >= 85 ? 'A' : grade >= 72 ? 'B' : grade >= 58 ? 'C' : grade >= 45 ? 'D' : 'F';
  const level = grade >= 82 ? 4 : grade >= 64 ? 3 : grade >= 45 ? 2 : 1;

  // Evidence-backed fixes: rank the weakest dimensions, cite the user's numbers.
  const worst = [...cl.perProjectCacheReadRatio].sort((x, y) => x.cacheReadRatio - y.cacheReadRatio);
  const best = [...cl.perProjectCacheReadRatio].sort((x, y) => y.cacheReadRatio - x.cacheReadRatio);
  const fixPool = [];
  if (worst.length >= 2 && (best[0].cacheReadRatio - worst[0].cacheReadRatio) > 0.15) {
    fixPool.push({ severity: 100 - contextDesign, title: 'Re-scope your thinnest-context project', evidence: `Sessions rooted in ${shortProject(worst[0].project)} re-read context at ${pctInt(worst[0].cacheReadRatio)} cache-read vs ${pctInt(best[0].cacheReadRatio)} at ${shortProject(best[0].project)}. A leaner sub-package CLAUDE.md and a fresh session close that gap.`, cli: 'split the sub-package CLAUDE.md, open a fresh session', nim: 'start a session scoped to that subtree so context stays lean' });
  }
  if (a.postEditCorrectionRate > 0.5) fixPool.push({ severity: 100 - reworkChurn, title: 'Cut the edit-then-redo churn', evidence: `${pctInt(a.postEditCorrectionRate)} of your edits got a later same-file redo. A plan or a read pass before the first edit trims the rework.`, cli: 'add a read or plan pass before the first edit', nim: 'review each change in the visual diff before it lands' });
  if (a.testRunSessionShare < 0.15) fixPool.push({ severity: 100 - verification, title: 'Close the loop with a test run', evidence: `Only ${pctInt(a.testRunSessionShare)} of sessions ran a test. Letting the agent run the suite after a change catches regressions before you do.`, cli: 'tell the agent to run the suite after each change', nim: 'have the agent run your tests and show the result before you accept' });
  if (a.delegationRate < 0.03) fixPool.push({ severity: 100 - delegation, title: 'Delegate more to subagents', evidence: `Agent/Task calls are ${pctInt(a.delegationRate)} of your tool calls. Fanning independent work out to subagents lets one session cover more ground.`, cli: 'break the task into named subagents yourself', nim: 'fan the work out to parallel sessions on one board' });
  if (a.distinctMcpServers > 25) fixPool.push({ severity: 100 - toolReach, title: 'Trim the MCP payload', evidence: `${a.distinctMcpServers} MCP servers are wired, which inflates the tool-definition context cached at every session start. Scoping servers per project keeps that lean.`, cli: 'prune the servers you rarely call', nim: 'set one MCP config for the workspace, not per session' });
  const fixes = fixPool.sort((x, y) => y.severity - x.severity).slice(0, 3);

  // Per-project table (grade proxy from cache reuse + record volume)
  const perProject = cl.perProjectCacheReadRatio.slice(0, 8).map((p) => ({ project: shortProject(p.project), records: p.records, cacheReadRatio: p.cacheReadRatio, grade: Math.round(100 * clamp01(p.cacheReadRatio / 0.9)) }));
  const flaggedProject = perProject.length ? perProject.reduce((lo, p) => p.grade < lo.grade ? p : lo, perProject[0]) : null;

  // Next rung
  const nextRung = level < 4 ? nextRungText(level, dims) : { title: 'You are at L4. The next rung is a team.', habits: [] };

  return { grade, letter, level, dimensions: dims, fixes, perProject, flaggedProject, nextRung };
}
function shortProject(slug) { return String(slug).replace(/^-Users-[^-]+-/, '').replace(/^-Users-[^-]+/, 'home').replace(/-/g, '/'); }
function nextRungText(level, dims) {
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];
  const map = { 1: 'L2, a steady operator', 2: 'L3, a disciplined driver', 3: 'L4, an orchestrator' };
  return { title: `Next rung: ${map[level] || 'the next level'}`, habits: [`Lift ${weakest.label.toLowerCase()} (your weakest at ${weakest.score}/100).`, 'Keep the two habits your Grader fixes name, and rerun next month to watch the deltas move.'] };
}

// ===========================================================================
// Copy deck (roast + confession, canon-checked)
// ===========================================================================
const ARCHETYPE_COPY = {
  'Orchestra Conductor': { description: 'You break work into fleets of subagents and let them run in parallel.', roast: 'You will brief five subagents for a job you could have typed yourself, then take the win at standup.', confessionTemplate: '{subagentCalls} subagent calls, and {sidechainShare} of your sessions handed work to an agent running inside another agent.' },
  'YOLO Merger': { description: 'You point the agent at the work and let it run, review optional.', roast: 'You read the diff the way most people read terms and conditions. The merge button has never once scared you.', confessionTemplate: '{commits} commits shipped, and {tookDirectlyShare} of the files you touched never got a second look.' },
  'Control Freak': { description: 'You read everything twice and rewrite the agent’s work until it is yours.', roast: 'You reread the file the agent just wrote, rewrite it, then reread it again. Trust is earned around here.', confessionTemplate: '{postEditRate} of your edits got a do-over later in the same session. Same file, again and again.' },
  'Vibe Coder': { description: 'One agent, a rough idea, and a lot of run-it-and-see.', roast: 'You keep it loose. One agent, a vibe, and a lot of run it and find out. Structure is a someday problem.', confessionTemplate: '{sessions} sessions, {avgToolsPerSession} tool calls each, and barely a subagent in sight.' },
  'Context Hoarder': { description: 'You keep massive context loaded and let long sessions run instead of starting fresh.', roast: 'You would sooner re-read a million tokens than open a clean session. Your cache has seen some things.', confessionTemplate: '{avgCacheCreation} tokens cached fresh per session, and {cacheReadShare} of everything you moved was re-read from cache.' },
  'Tool Sprawler': { description: 'You wired up more MCP servers than most teams have engineers, and you use all of them.', roast: 'Your agent touches analytics, SEO, video, and compliance before breakfast. Writing code is one of its side gigs.', confessionTemplate: '{mcpServers} MCP servers wired across both agents, and {topServerShare} of your calls went to a single one.' },
};
function fillConfession(archetype, v) {
  const t = (ARCHETYPE_COPY[archetype] || {}).confessionTemplate || '';
  return t.replace('{subagentCalls}', v.subagentCalls ?? '').replace('{sidechainShare}', v.sidechainShare ?? '').replace('{commits}', v.commits ?? '').replace('{tookDirectlyShare}', v.tookDirectlyShare ?? '').replace('{postEditRate}', v.postEditRate ?? '').replace('{sessions}', v.sessions ?? '').replace('{avgToolsPerSession}', v.avgToolsPerSession ?? '').replace('{avgCacheCreation}', v.avgCacheCreation ?? '').replace('{cacheReadShare}', v.cacheReadShare ?? '').replace('{mcpServers}', v.mcpServers ?? '').replace('{topServerShare}', v.topServerShare ?? '');
}

// ===========================================================================
// Card auto-pick (stat-extremity ranking; hero = universal brags only)
// ===========================================================================
function buildCandidates(C) {
  const s = C.shipped.combined, codeL = s.linesAddedByCategory.code || 0, docsL = s.linesAddedByCategory.docs || 0;
  const issues = s.issuesTracked; const maxDelta = Math.max(...C.deltas.cardPills.map((p) => (p.delta && p.delta.value != null ? Math.abs(p.delta.value) : 0)));
  const cand = [];
  cand.push({ key: 'tokens', heroable: true, kind: 'num', notability: C.headline.combinedTokens / 5e9, big: C.headline.combinedTokensDisplay, label: 'tokens your agents moved', sub: C.headline.tokenEquivalence });
  cand.push({ key: 'lines', heroable: true, kind: 'num', notability: s.linesAdded / 100000, big: fmt(s.linesAdded), label: 'lines your agents wrote', sub: `${fmt(codeL)} code &middot; ${fmt(docsL)} docs` });
  cand.push({ key: 'commits', heroable: true, kind: 'num', notability: C.commits.combined / 100, big: fmt(C.commits.combined), label: 'commits shipped with your agents', sub: `Claude ${C.commits.claude} &middot; Codex ${C.commits.codex}` });
  cand.push({ key: 'issues', heroable: true, kind: 'num', notability: issues / 800, big: fmt(issues), label: 'issues and tasks tracked', sub: 'across your trackers, Linear, JIRA and GitHub' });
  cand.push({ key: 'sessions', heroable: true, kind: 'num', notability: C.headline.sessions / 800, big: fmt(C.headline.sessions), label: 'sessions across both agents', sub: `Claude ${C.perAgent.claude.sessions} &middot; Codex ${C.perAgent.codex.sessions}` });
  cand.push({ key: 'hours', heroable: true, kind: 'num', notability: C.headline.hours / 200, big: `${C.headline.hours}h`, label: 'hours pairing with your agents', sub: 'estimated active time' });
  cand.push({ key: 'testRuns', heroable: true, kind: 'num', notability: s.testRunCommands / 300, big: fmt(s.testRunCommands), label: 'test runs', sub: `${s.testFilesTouched} test files touched` });
  cand.push({ key: 'biggestDay', heroable: false, kind: 'num', notability: C.biggestDay.sessions / 40, big: fmt(C.biggestDay.sessions), label: 'sessions in one day', sub: fmtDayLabel(C.biggestDay.date) });
  cand.push({ key: 'mcpCount', heroable: false, kind: 'num', notability: C.headline.distinctMcpServers / 15, big: String(C.headline.distinctMcpServers), label: 'MCP servers wired', sub: 'across both agents' });
  cand.push({ key: 'maker', heroable: false, kind: 'maker', notability: C.makerMix.combined.categories.filter((c) => c.share > 0.05).length / 2, title: 'What you make' });
  cand.push({ key: 'topMcp', heroable: false, kind: 'list', notability: (C.topLists.mcpServers.combined.top[0]?.share || 0) / 0.25, listKey: 'mcpServers', title: 'Top MCP servers' });
  cand.push({ key: 'topTools', heroable: false, kind: 'list', notability: (C.topLists.tools.combined.top[0]?.share || 0) / 0.5, listKey: 'tools', title: 'Top tools' });
  cand.push({ key: 'topModels', heroable: false, kind: 'list', notability: (C.topLists.models.combined.top[0]?.share || 0) / 0.75, listKey: 'models', title: 'Top models' });
  cand.push({ key: 'delta', heroable: false, kind: 'delta', notability: maxDelta / 0.8, title: 'vs last month' });
  return cand;
}
function selectSlots(cand, nExtras) {
  const ranked = [...cand].sort((a, b) => b.notability - a.notability);
  const hero = ranked.find((c) => c.heroable);
  const caps = { num: 2, list: 1, maker: 1, delta: 1 }; const used = {}; const extras = [];
  for (const c of ranked) { if (c === hero || extras.length >= nExtras) continue; used[c.kind] = (used[c.kind] || 0) + 1; if (caps[c.kind] !== undefined && used[c.kind] > caps[c.kind]) continue; extras.push(c); }
  return { hero, extras };
}

// ===========================================================================
// Render: inline SVG helpers (for the scrollable panels)
// ===========================================================================
const CAT_COLOR = { code: '#6395ff', docs: '#38bdc0', diagrams: '#8a7dff', mockups: '#b1caff', data: '#5cc8a8', other: '#4a4f6b' };
const CAT_LABEL = { code: 'code', docs: 'docs', diagrams: 'diagrams', mockups: 'mockups', data: 'data/config', other: 'other' };
const svgDefs = () => `<defs><linearGradient id="g1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#6395FF"/><stop offset="1" stop-color="#38BDC0"/></linearGradient></defs>`;
function gbars(rows) {
  const w = 820, h = 250, pad = 30, n = rows.length, gw = (w - pad * 2) / n, bw = gw * 0.24; let s = '';
  rows.forEach((r, i) => { const gx = pad + i * gw + gw / 2, ah = (r.claude / 100) * (h - 60), bh = (r.codex / 100) * (h - 60);
    s += `<rect x="${(gx - bw - 5).toFixed(1)}" y="${(h - 34 - ah).toFixed(1)}" width="${bw.toFixed(1)}" height="${ah.toFixed(1)}" rx="3" fill="#6395FF"/><rect x="${(gx + 5).toFixed(1)}" y="${(h - 34 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="#38BDC0"/><text x="${gx}" y="${h - 12}" text-anchor="middle" class="axl">${r.metric}</text><text x="${(gx - bw / 2 - 5).toFixed(1)}" y="${(h - 38 - ah).toFixed(1)}" text-anchor="middle" class="axv">${r.claude}%</text><text x="${(gx + bw / 2 + 5).toFixed(1)}" y="${(h - 38 - bh).toFixed(1)}" text-anchor="middle" class="axv">${r.codex}%</text>`; });
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">${s}</svg>`;
}
function donut(segs, centerNum, centerSub) {
  const size = 230, thick = 36, r = (size - thick) / 2, cx = size / 2, C2 = 2 * Math.PI * r, tot = segs.reduce((a, s) => a + s.value, 0); let off = 0, arcs = '';
  segs.forEach((s) => { const len = (s.value / tot) * C2; arcs += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thick}" stroke-dasharray="${len.toFixed(2)} ${(C2 - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"/>`; off += len; });
  return `<svg viewBox="0 0 ${size} ${size}" class="donut">${arcs}<text x="${cx}" y="${cx - 4}" text-anchor="middle" class="dnum">${centerNum}</text><text x="${cx}" y="${cx + 18}" text-anchor="middle" class="dsub">${centerSub}</text></svg>`;
}
function legend(segs) { return `<div class="legend">${segs.map((s) => `<span><i style="background:${s.color}"></i>${s.label} ${s.value}%</span>`).join('')}</div>`; }
function quadSvg(mx, my) {
  const size = 360, p = 34, s = size - p * 2, X = (x) => p + (x / 100) * s, Y = (y) => p + (1 - y / 100) * s;
  return `<svg viewBox="0 0 ${size} ${size}" class="quad"><rect x="${p}" y="${p}" width="${s}" height="${s}" fill="rgba(99,149,255,0.06)" stroke="rgba(177,202,255,0.25)"/><line x1="${p + s / 2}" y1="${p}" x2="${p + s / 2}" y2="${p + s}" stroke="rgba(177,202,255,0.18)"/><line x1="${p}" y1="${p + s / 2}" x2="${p + s}" y2="${p + s / 2}" stroke="rgba(177,202,255,0.18)"/><text x="${p + 10}" y="${p + 20}" class="ql">YOLO Merger</text><text x="${p + s - 10}" y="${p + 20}" text-anchor="end" class="ql">Orchestra Conductor</text><text x="${p + 10}" y="${p + s - 10}" class="ql">Vibe Coder</text><text x="${p + s - 10}" y="${p + s - 10}" text-anchor="end" class="ql">Control Freak</text><text x="${p + s / 2}" y="${size - 8}" text-anchor="middle" class="qax">Structure &#8594;</text><text x="14" y="${p + s / 2}" text-anchor="middle" transform="rotate(-90 14 ${p + s / 2})" class="qax">Autonomy &#8594;</text><circle cx="${X(mx)}" cy="${Y(my)}" r="10" fill="#38BDC0" stroke="#fff" stroke-width="2"/><text x="${X(mx)}" y="${Y(my) - 16}" text-anchor="middle" class="qm">you</text></svg>`;
}
function sparkline(vals, color = '#8ce3c2') {
  const w = 150, h = 30, n = vals.length, step = n > 1 ? w / (n - 1) : w, max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 5)).toFixed(1)}`);
  const lx = (n - 1) * step, ly = h - 2 - (vals[n - 1] / max) * (h - 5);
  return `<svg viewBox="0 0 ${w} ${h}" class="spark" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.6" fill="${color}"/></svg>`;
}
function heatmap(daily) {
  const cell = 15, gap = 3; const map = new Map(daily.map((d) => [d.date, d.sessions]));
  const first = new Date(daily[0].date + 'T00:00:00Z'), last = new Date(daily[daily.length - 1].date + 'T00:00:00Z');
  const start = new Date(first); start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const colors = ['rgba(177,202,255,0.10)', '#26507e', '#3a7fb5', '#4aa8c8', '#57d4cb'];
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let rects = '', ticks = '', maxCol = 0, lastMonth = -1;
  for (let d = new Date(start); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10), dow = d.getUTCDay(), col = Math.floor((d - start) / (7 * 86400000)); maxCol = Math.max(maxCol, col);
    if (d >= first) { const v = map.get(iso) || 0, lvl = v === 0 ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 11 ? 3 : 4; rects += `<rect x="${col * (cell + gap)}" y="${dow * (cell + gap) + 18}" width="${cell}" height="${cell}" rx="3" fill="${colors[lvl]}"/>`; }
    const m = d.getUTCMonth(); if (m !== lastMonth && dow === 0) { ticks += `<text x="${col * (cell + gap)}" y="11" class="hml">${MN[m]}</text>`; lastMonth = m; }
  }
  return `<svg viewBox="0 0 ${(maxCol + 1) * (cell + gap)} ${7 * (cell + gap) + 22}" class="heatmap">${ticks}${rects}</svg>`;
}
function hourBars(vals) {
  const w = 860, h = 210, max = Math.max(...vals, 1), pad = 20, iw = (w - pad * 2) / 24, bw = iw * 0.66; let s = '';
  for (let i = 0; i < 24; i++) { const bh = (vals[i] / max) * (h - 42), x = pad + i * iw + (iw - bw) / 2, y = h - 24 - bh, night = i >= 22 || i < 5;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${night ? '#8a7dff' : 'url(#g1)'}"/>`; if (i % 3 === 0) s += `<text x="${(x + bw / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle" class="axl">${fmtHour(i)}</text>`; }
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">${svgDefs()}${s}</svg>`;
}
function makerBar(cats) {
  const segs = cats.map((c) => `<span class="mm-seg" style="width:${(c.share * 100).toFixed(1)}%;background:${CAT_COLOR[c.category]}"></span>`).join('');
  const leg = cats.map((c) => `<span class="mm-leg"><i style="background:${CAT_COLOR[c.category]}"></i>${CAT_LABEL[c.category]} ${pctInt(c.share)}</span>`).join('');
  return `<div class="mm"><div class="mm-bar">${segs}</div><div class="mm-legend">${leg}</div></div>`;
}
function top3Card(title, list, sub) {
  const rows = list.top.map((t) => `<div class="t3-row"><span class="t3-n">${esc(t.name)}</span><span class="t3-p">${pctInt(t.share)}</span></div>`).join('');
  return `<div class="t3card"><div class="t3h">${title}</div>${rows}${sub ? `<div class="t3sub">${sub}</div>` : ''}</div>`;
}
function pillHtml(p, spark) { if (!p.delta || p.delta.value == null) return ''; const up = p.delta.value >= 0; return `<span class="dpill ${up ? 'up' : 'down'}">${up ? '&#9650;' : '&#9660;'} ${Math.abs(Math.round(p.delta.value * 100))}% ${p.label}${spark ? `<span class="sparkwrap">${spark}</span>` : ''}</span>`; }

// ---- archetype medallion glyph (SVG inner, reused in panels + card) ----
function glyphInner(archetype, gradId) {
  const g = {
    'Context Hoarder': `<rect x="24" y="18" width="52" height="62" rx="7" stroke="url(#${gradId})" stroke-width="3.4" fill="none"/><rect x="30" y="45" width="40" height="29" rx="3" fill="url(#${gradId})" opacity="0.88"/><line x1="30" y1="32" x2="70" y2="32" stroke="url(#${gradId})" stroke-width="3.4" stroke-linecap="round"/>`,
    'Orchestra Conductor': `<path d="M50 79 C 40 56, 30 46, 21 31 M50 79 C 47 54, 44 41, 40 25 M50 79 C 53 54, 56 41, 60 25 M50 79 C 60 56, 70 46, 79 31" stroke="url(#${gradId})" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="21" cy="31" r="6" fill="url(#${gradId})"/><circle cx="40" cy="25" r="6" fill="url(#${gradId})"/><circle cx="60" cy="25" r="6" fill="url(#${gradId})"/><circle cx="79" cy="31" r="6" fill="url(#${gradId})"/><circle cx="50" cy="81" r="7" fill="url(#${gradId})"/>`,
    'Tool Sprawler': `<circle cx="50" cy="50" r="10" fill="url(#${gradId})"/><g stroke="url(#${gradId})" stroke-width="3" fill="none"><line x1="50" y1="40" x2="50" y2="20"/><line x1="50" y1="60" x2="50" y2="80"/><line x1="40" y1="50" x2="20" y2="50"/><line x1="60" y1="50" x2="80" y2="50"/><line x1="43" y1="43" x2="28" y2="28"/><line x1="57" y1="43" x2="72" y2="28"/><line x1="43" y1="57" x2="28" y2="72"/><line x1="57" y1="57" x2="72" y2="72"/></g><g fill="url(#${gradId})"><circle cx="50" cy="18" r="5"/><circle cx="50" cy="82" r="5"/><circle cx="18" cy="50" r="5"/><circle cx="82" cy="50" r="5"/><circle cx="26" cy="26" r="5"/><circle cx="74" cy="26" r="5"/><circle cx="26" cy="74" r="5"/><circle cx="74" cy="74" r="5"/></g>`,
  };
  return g[archetype] || `<circle cx="50" cy="50" r="26" stroke="url(#${gradId})" stroke-width="3.4" fill="none"/><circle cx="50" cy="50" r="10" fill="url(#${gradId})"/>`;
}
const NB_MARK = `<svg class="nb-mark" viewBox="0 0 100 100" aria-hidden="true"><g fill="#6395ff"><circle cx="50" cy="50" r="35"/><circle cx="90" cy="50" r="10"/><circle cx="84.6" cy="70" r="10"/><circle cx="70" cy="84.6" r="10"/><circle cx="50" cy="90" r="10"/><circle cx="30" cy="84.6" r="10"/><circle cx="15.4" cy="70" r="10"/><circle cx="10" cy="50" r="10"/><circle cx="15.4" cy="30" r="10"/><circle cx="30" cy="15.4" r="10"/><circle cx="50" cy="10" r="10"/><circle cx="70" cy="15.4" r="10"/><circle cx="84.6" cy="30" r="10"/></g><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="'Chalkboard SE','Comic Sans MS',ui-rounded,sans-serif" font-size="46" font-weight="700" fill="#fff">#</text></svg>`;

function wrapText(str, maxChars) {
  const words = String(str).split(' '); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur); return lines;
}
// strip HTML entities/tags for SVG text (SVG has no &middot; support the same way)
function svgText(s) { return String(s).replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#215;/g, '×').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ===========================================================================
// Render: the SVG share card (self-contained; rasterized in-page to PNG)
// ===========================================================================
// SVG text with inline presentation attributes (robust for canvas rasterize; no
// <style> block that would collide between the two cards in one document).
function TT(x, y, txt, o = {}) {
  let a = `x="${x}" y="${y}"`;
  if (o.anchor) a += ` text-anchor="${o.anchor}"`;
  a += ` font-size="${o.size || 14}" fill="${o.fill || '#fff'}"`;
  if (o.weight) a += ` font-weight="${o.weight}"`;
  if (o.ls) a += ` letter-spacing="${o.ls}"`;
  return `<text ${a}>${svgText(txt)}</text>`;
}
function svgExtra(c, x, y, w, h, C) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)"/>`;
  const px = x + 18;
  if (c.kind === 'num') {
    out += TT(px, y + 40, c.big, { size: 32, fill: '#eef2fb', weight: 780 });
    out += TT(px, y + 63, c.label, { size: 14, fill: '#a6adc8' });
    if (c.sub) out += TT(px, y + 83, c.sub, { size: 12, fill: '#79809d' });
  } else if (c.kind === 'delta') {
    out += TT(px, y + 26, 'VS LAST MONTH', { size: 11, fill: '#79809d', weight: 700, ls: 1 });
    let py = y + 38;
    for (const p of C.deltas.cardPills) { if (!p.delta || p.delta.value == null) continue; const up = p.delta.value >= 0; const txt = `${up ? '▲' : '▼'} ${Math.abs(Math.round(p.delta.value * 100))}% ${p.label}`; out += `<rect x="${px}" y="${py}" width="${w - 36}" height="27" rx="13" fill="rgba(87,212,168,0.10)" stroke="rgba(87,212,168,0.32)"/>` + TT(px + 12, py + 18, txt, { size: 13, fill: '#8ce3c2', weight: 650 }); py += 33; }
  } else if (c.kind === 'maker') {
    out += TT(px, y + 26, 'WHAT YOU MAKE', { size: 11, fill: '#79809d', weight: 700, ls: 1 });
    const cats = C.makerMix.combined.categories; let bx = px; const bw = w - 36;
    for (const cat of cats) { const cw = cat.share * bw; out += `<rect x="${bx.toFixed(1)}" y="${y + 38}" width="${Math.max(0, cw - 1).toFixed(1)}" height="15" rx="3" fill="${CAT_COLOR[cat.category]}"/>`; bx += cw; }
    out += TT(px, y + 76, cats.slice(0, 4).map((cc) => `${CAT_LABEL[cc.category]} ${pctInt(cc.share)}`).join('   '), { size: 13, fill: '#a6adc8' });
  } else if (c.kind === 'list') {
    out += TT(px, y + 24, c.title.toUpperCase(), { size: 11, fill: '#79809d', weight: 700, ls: 1 });
    const list = C.topLists[c.listKey].combined; let py = y + 47;
    for (const t of list.top) { out += TT(px, py, t.name, { size: 15, fill: '#eef2fb', weight: 600 }) + TT(x + w - 18, py, pctInt(t.share), { size: 14, fill: '#b1caff', weight: 700, anchor: 'end' }); py += 23; }
  }
  return out;
}

function cardSvg(id, C, hero, orderedExtras, arche, roast, isSquare) {
  const W = isSquare ? 1080 : 1200, H = isSquare ? 1080 : 630;
  let g = `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">`;
  g += `<defs>`;
  g += `<linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#221c63"/><stop offset="0.56" stop-color="#15113b"/><stop offset="1" stop-color="#0c0a20"/></linearGradient>`;
  g += `<radialGradient id="glow-${id}" cx="0.82" cy="0.08" r="0.55"><stop offset="0" stop-color="#6395ff" stop-opacity="0.26"/><stop offset="1" stop-color="#6395ff" stop-opacity="0"/></radialGradient>`;
  g += `<linearGradient id="hero-${id}" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#9fb0ff"/><stop offset="0.5" stop-color="#6395ff"/><stop offset="1" stop-color="#3fc7c9"/></linearGradient>`;
  g += `<linearGradient id="gly-${id}" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8aa0ff"/><stop offset="0.5" stop-color="#6395ff"/><stop offset="1" stop-color="#57d4cb"/></linearGradient>`;
  g += `</defs>`;
  g += `<rect width="${W}" height="${H}" fill="url(#bg-${id})"/><rect width="${W}" height="${H}" fill="url(#glow-${id})"/>`;
  const pad = isSquare ? 60 : 46;
  const heroSize = isSquare ? 130 : 116, archSize = isSquare ? 30 : 26, roastSize = isSquare ? 22 : 19;
  // header
  g += `<circle cx="${pad + 4}" cy="${pad + 5}" r="4" fill="#6395ff"/>` + TT(pad + 16, pad + 10, `YOUR AGENTS, WRAPPED · ${monthLabel(TARGET_MONTH).toUpperCase()}`, { size: 15, fill: '#b9c3d8', weight: 700, ls: 2 });
  g += `<g transform="translate(${W - pad - 150},${pad - 14})"><g transform="scale(0.26)">${NB_MARK.replace('<svg class="nb-mark" viewBox="0 0 100 100" aria-hidden="true">', '<g>').replace('</svg>', '</g>')}</g>` + TT(34, 19, 'nimbalyst', { size: 20, fill: '#eef1fb', weight: 650 }) + `</g>`;

  if (isSquare) {
    g += `<g transform="translate(${W / 2 - 55},${pad + 30})"><svg width="110" height="110" viewBox="0 0 100 100">${glyphInner(arche, `gly-${id}`)}</svg></g>`;
    g += TT(W / 2, pad + 200, arche.toUpperCase(), { size: archSize, fill: '#dfe6f4', weight: 750, ls: 2, anchor: 'middle' });
    wrapText(roast, 56).forEach((ln, i) => { g += TT(W / 2, pad + 240 + i * 30, ln, { size: roastSize, fill: '#a6adc8', anchor: 'middle' }); });
    g += TT(W / 2, pad + 420, hero.big, { size: heroSize, fill: `url(#hero-${id})`, weight: 800, anchor: 'middle' });
    g += TT(W / 2, pad + 460, hero.label, { size: 24, fill: '#c6cfe1', anchor: 'middle' });
    if (hero.sub) g += TT(W / 2, pad + 486, hero.sub, { size: 16, fill: '#79809d', anchor: 'middle' });
    let ey = pad + 522; const bw = (W - pad * 2 - 15) / 2;
    const nums = orderedExtras.filter((e) => e.kind === 'num'), wide = orderedExtras.filter((e) => e.kind !== 'num');
    nums.forEach((c, i) => { g += svgExtra(c, pad + i * (bw + 15), ey, bw, 100, C); });
    ey += nums.length ? 116 : 0;
    wide.forEach((c) => { g += svgExtra(c, pad, ey, W - pad * 2, 100, C); ey += 116; });
  } else {
    g += TT(pad, pad + 116, arche.toUpperCase(), { size: archSize, fill: '#dfe6f4', weight: 750, ls: 2 });
    wrapText(roast, 60).forEach((ln, i) => { g += TT(pad, pad + 150 + i * 27, ln, { size: roastSize, fill: '#a6adc8' }); });
    g += TT(pad, pad + 322, hero.big, { size: heroSize, fill: `url(#hero-${id})`, weight: 800 });
    g += TT(pad, pad + 358, hero.label, { size: 21, fill: '#c6cfe1' });
    if (hero.sub) g += TT(pad, pad + 382, hero.sub, { size: 14, fill: '#79809d' });
    g += `<rect x="${W - pad - 150}" y="${pad + 66}" width="150" height="150" rx="24" fill="rgba(99,149,255,0.10)" stroke="rgba(255,255,255,0.13)"/><g transform="translate(${W - pad - 138},${pad + 78})"><svg width="126" height="126" viewBox="0 0 100 100">${glyphInner(arche, `gly-${id}`)}</svg></g>`;
    const ny = pad + 402, bw = (W - pad * 2 - 24) / 3;
    orderedExtras.slice(0, 3).forEach((c, i) => { g += svgExtra(c, pad + i * (bw + 12), ny, bw, 98, C); });
  }
  g += `<line x1="${pad}" y1="${H - pad - 34}" x2="${W - pad}" y2="${H - pad - 34}" stroke="rgba(255,255,255,0.08)"/>`;
  g += `<circle cx="${pad + 3}" cy="${H - pad - 12}" r="3.5" fill="#d97757"/><circle cx="${pad + 15}" cy="${H - pad - 12}" r="3.5" fill="#10a37f"/>` + TT(pad + 28, H - pad - 8, 'Analyzed from your Claude Code and Codex logs', { size: 14, fill: '#a6adc8' });
  g += TT(W - pad, H - pad - 8, 'nimbalyst.com/wrapped', { size: 14, fill: '#9fb7ff', weight: 600, anchor: 'end' });
  g += `</svg>`;
  return g;
}

// ===========================================================================
// Render: grader section + full page
// ===========================================================================
function renderGrader(G, C) {
  const dims = G.dimensions.map((d) => `<div class="dim"><div class="dim-head"><span>${d.label}</span><b>${d.score}</b></div><div class="dim-bar"><i style="width:${d.score}%"></i></div></div>`).join('');
  const fixes = G.fixes.length ? G.fixes.map((f, i) => `<div class="fix"><div class="fix-n">${i + 1}</div><div class="fix-body"><div class="fix-t">${esc(f.title)}</div><div class="fix-e">${esc(f.evidence)}</div><div class="fix-paths"><span class="fp">By hand: ${esc(f.cli)}</span><span class="fp hot">In Nimbalyst: ${esc(f.nim)}</span></div></div></div>`).join('') : `<div class="fix-none">No high-severity fixes this month. Rerun next month to keep the streak.</div>`;
  const rows = G.perProject.map((p) => `<tr${p === G.flaggedProject ? ' class="flag"' : ''}><td>${esc(p.project)}</td><td>${fmt(p.records)}</td><td>${pctInt(p.cacheReadRatio)}</td><td>${p.grade}</td></tr>`).join('');
  return `<section class="panel grader" id="grader">
    <div class="kicker">Your Grader report</div>
    <div class="grade-badge">
      <div class="grade-letter">${G.letter}</div>
      <div class="grade-meta"><div class="grade-num">${G.grade}<span>/100</span></div><div class="grade-level">Level ${G.level} of 5 &middot; <span class="locked">L5 team rung locked</span></div></div>
    </div>
    <p class="lead center">Six dimensions of how well you work with your agents, computed from your own logs. Unavailable signals are down-weighted, never zeroed.</p>
    <div class="dims">${dims}</div>
    <h3 class="gh">Top fixes, from your own logs</h3>
    <div class="fixes">${fixes}</div>
    <h3 class="gh">By project</h3>
    <table class="pp"><thead><tr><th>Project</th><th>Assistant records</th><th>Cache reuse</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="next"><b>${esc(G.nextRung.title)}</b>${G.nextRung.habits.map((h) => `<div>${esc(h)}</div>`).join('')}</div>
    <div class="l5"><span class="lock">&#128274;</span> Level 5 is the team rung: shared visible sessions, clean handoffs, one MCP configuration, trackers in one place. It unlocks when your workspace is shared. We extend Claude Code and Codex; the team layer sits on top of them, never against them.</div>
  </section>`;
}

function renderHtml(C, G) {
  const arche = C.archetype.archetype;
  const copy = ARCHETYPE_COPY[arche] || ARCHETYPE_COPY['Context Hoarder'];
  const { hero, extras } = selectSlots(buildCandidates(C), 3);
  const ordered = [...extras].sort((a, b) => (a.kind === 'num' ? 0 : 1) - (b.kind === 'num' ? 0 : 1));
  const cl = C._claude;
  const confession = fillConfession(arche, {
    subagentCalls: fmt(cl.delegation.delegationToolCalls), sidechainShare: pctInt(cl.delegation.sidechainShare),
    commits: fmt(C.commits.combined), tookDirectlyShare: pctInt(1 - cl.churn.filesRevisedShare), postEditRate: pctInt(cl.churn.postEditCorrectionRate),
    sessions: fmt(C.headline.sessions), avgToolsPerSession: (C.headline.toolCalls / C.headline.sessions).toFixed(0),
    avgCacheCreation: fmt(cl.archetype.inputs.avgCacheCreationPerSession), cacheReadShare: pct1(cl.tokens.cacheReadRatio),
    mcpServers: C.headline.distinctMcpServers, topServerShare: pctInt(C.topLists.mcpServers.combined.top[0]?.share || 0),
  });
  const rhythm = C.rhythm, peakHour = rhythm.peakHour;
  const rhythmDescriptor = rhythm.nightShare > 0.25 ? 'a night owl' : (peakHour >= 5 && peakHour <= 11) ? 'a morning operator' : (peakHour >= 12 && peakHour <= 17) ? 'an afternoon operator' : 'an evening operator';
  const sessionsSpark = sparkline(C.monthlySeries.map((m) => m.sessions));
  const tokensSpark = sparkline(C.monthlySeries.map((m) => m.tokensM));
  const makerCats = C.makerMix.combined.categories;
  const shipped = C.shipped.combined, shipCat = shipped.linesAddedByCategory;
  const lineTotal = Object.values(shipCat).reduce((a, b) => a + b, 0);
  const lineCats = Object.entries(shipCat).map(([category, count]) => ({ category, count, share: lineTotal > 0 ? count / lineTotal : 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
  const codeLines = shipCat.code || 0, docLines = shipCat.docs || 0;
  const startDay = C.headline.dateSpan.start ? C.headline.dateSpan.start.slice(0, 10) : '';

  const P = [];
  P.push(`<section class="panel cover"><div class="eyebrow">Your Agents, Wrapped</div><div class="year">${monthShort(TARGET_MONTH)}</div><div class="range">${TARGET_MONTH.slice(0, 4)} &middot; Claude Code and Codex</div><div class="scrollcue">scroll</div><div class="wm">nimbalyst</div></section>`);
  P.push(`<section class="panel center"><div class="kicker">In ${monthLabel(TARGET_MONTH)}</div><div class="hero">${C.headline.sessions.toLocaleString()}</div><div class="herosub">sessions across both agents in ${monthShort(TARGET_MONTH)}</div><div class="pills">${pillHtml(C.deltas.cardPills[0], sessionsSpark)}${pillHtml(C.deltas.cardPills[1], tokensSpark)}</div><div class="cap">Sparklines trace session and token volume by month, looking back across your whole run.</div></section>`);
  P.push(`<section class="panel"><h2>Two agents, one workflow</h2><p class="lead">Codex is your volume workhorse, Claude Code your heavy-context tool. Their share of ${C.headline.toolCalls.toLocaleString()} tool calls and the other comparable dimensions:</p>${gbars(C.split)}<div class="keyrow"><span class="k1">Claude Code</span><span class="k2">Codex</span></div></section>`);
  if (C.daily.length) P.push(`<section class="panel"><h2>Every active day</h2><div class="hero sm">${C.activeDays}</div><div class="herosub">active days in ${monthShort(TARGET_MONTH)}, ${C.headline.hours}h estimated. Each square is a day; the grid looks back across your whole run.</div>${heatmap(C.daily)}<div class="heatkey"><span>less</span><i style="background:rgba(177,202,255,0.12)"></i><i style="background:#26507e"></i><i style="background:#3a7fb5"></i><i style="background:#4aa8c8"></i><i style="background:#57d4cb"></i><span>more</span></div></section>`);
  P.push(`<section class="panel"><h2>When you run them</h2><div class="hero sm">${fmtHour(peakHour)}</div><div class="herosub">your busiest hour. You are ${rhythmDescriptor}: ${pctInt(rhythm.nightShare)} of sessions start after 10pm.</div>${hourBars(rhythm.byHourLocal)}<div class="cap">Session starts by hour, local time. Purple bars are overnight.</div></section>`);
  P.push(`<section class="panel center"><div class="kicker">Your biggest day</div><div class="hero">${C.biggestDay.sessions}</div><div class="herosub">sessions in a single day${C.biggestDay.date ? `, on ${fmtDayLabel(C.biggestDay.date)}` : ''}</div><div class="cap">The one day both agents ran hottest.</div></section>`);
  P.push(`<section class="panel"><h2>Tokens moved</h2><div class="split2"><div class="notecol"><div class="hero sm">${C.headline.combinedTokensDisplay}</div><div class="herosub">tokens across both agents. Claude ${round1(cl.tokens.total / 1e9)}B, Codex ${round1(C._codex.tokens.total / 1e9)}B.</div><div class="equiv">${C.headline.tokenEquivalence}</div></div><div class="donutwrap">${donut(C.tokenSplit, `${C.tokenSplit[0].value}%`, 'cache read')}${legend(C.tokenSplit)}</div></div></section>`);
  if (makerCats.length) P.push(`<section class="panel"><h2>What you make</h2><div class="hero sm">${pctInt(makerCats[0].share)}</div><div class="herosub">of what your agents write is ${CAT_LABEL[makerCats[0].category]}, then ${makerCats.slice(1, 3).map((c) => `${pctInt(c.share)} ${CAT_LABEL[c.category]}`).join(', ')}.</div>${makerBar(makerCats)}<div class="cap">Every file your agents wrote, by type. Combined across both agents.</div></section>`);
  P.push(`<section class="panel"><h2>What you shipped</h2><div class="hero sm">${fmt(shipped.linesAdded)}</div><div class="herosub">lines your agents added, ${fmt(shipped.linesRemoved)} removed.</div>${makerBar(lineCats)}<div class="cap">${fmt(codeLines)} lines of code, ${fmt(docLines)} of docs. Also ${fmt(C.commits.combined)} commits, ${fmt(shipped.testRunCommands)} test runs, ${fmt(shipped.issuesTracked)} issues and tasks tracked. Line counts are agent editing effort, a proxy.</div></section>`);
  P.push(`<section class="panel"><h2>Tools, models, servers</h2><p class="lead">No single winner. Each renders as a top-3 by share, combined across both agents.</p><div class="t3grid">${top3Card('Top tools', C.topLists.tools.combined, `${cl.topLists.tools.top[0]?.name || ''} on Claude, ${C._codex.topLists.tools.top[0]?.name || ''} on Codex`)}${top3Card('Top models', C.topLists.models.combined, 'Two model families, one operator')}${top3Card('Top MCP servers', C.topLists.mcpServers.combined, `${C.headline.distinctMcpServers} servers wired`)}</div></section>`);
  P.push(`<section class="panel archetype"><div class="kicker">Your archetype</div><div class="atname">${arche}</div><p class="lead center">Base quadrant ${C.archetype.baseQuadrant} (Structure ${C.archetype.structureScore}, Autonomy ${C.archetype.autonomyScore}).${C.archetype.overrideApplied ? ` The scale of your work reads as a ${C.archetype.overrideApplied}.` : ''} Plan mode plays no part in this placement.</p>${quadSvg(C.archetype.structureScore, C.archetype.autonomyScore)}<p class="confession">${confession}</p></section>`);

  const graderHtml = renderGrader(G, C);
  const cardLand = cardSvg('card-svg-landscape', C, hero, ordered, arche, copy.roast, false);
  const cardSq = cardSvg('card-svg-square', C, hero, ordered, arche, copy.roast, true);
  const finale = `<section class="panel finale"><div class="kicker">Your share card</div><p class="lead center">Auto-picked for you: ${arche}, plus your most extreme stats this month. Download it as a PNG. Nothing uploads.</p><div class="cardwrap" id="cw-land">${cardLand}</div><div class="cardwrap" id="cw-sq" style="display:none">${cardSq}</div><div class="dl"><button class="btn" onclick="dlCard('card-svg-landscape',1200,630,'agent-wrapped-1200x630.png')">Download 1200&times;630 PNG</button><button class="btn" onclick="dlCard('card-svg-square',1080,1080,'agent-wrapped-1080x1080.png')">Download 1080&times;1080 PNG</button><button class="btn ghost" onclick="toggleSq()">Toggle square</button></div><div class="priv">Generated on your machine. Only the image you choose to download or share ever leaves it.</div></section>`;

  const script = `<script>
function dlCard(id,w,h,fn){var s=document.getElementById(id);var xml=new XMLSerializer().serializeToString(s);var img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=w*2;c.height=h*2;var x=c.getContext('2d');x.drawImage(img,0,0,w*2,h*2);c.toBlob(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},1500);},'image/png');};img.onerror=function(){alert('PNG export is not supported in this browser; screenshot the card instead.');};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);}
function toggleSq(){var s=document.getElementById('cw-sq'),l=document.getElementById('cw-land');if(s.style.display==='none'){s.style.display='';l.style.display='none';}else{s.style.display='none';l.style.display='';}}
</script>`;

  const ad = `<section class="panel adcard"><div class="ad-inner"><h2 class="ad-title">See all of this in one workspace</h2><p class="ad-body">Nimbalyst is the open-source visual workspace for building with Codex, Claude Code, and more. Run your agents in parallel and watch every session on one board. Edit what they write as markdown, mockups, and diagrams, and keep your tasks, trackers, and docs in the same place.</p><p class="ad-tie">You ran ${C.headline.sessions.toLocaleString()} sessions across two agents in ${monthLabel(TARGET_MONTH)}. Nimbalyst is where you run the next set without losing the thread, and where a team shares the docs, trackers, and boards.</p><a class="ad-btn" href="https://nimbalyst.com">Get Nimbalyst, open source and free for individuals &#8594; nimbalyst.com</a></div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Agents, Wrapped &middot; ${monthLabel(TARGET_MONTH)}</title><style>${CSS}</style></head><body>${finale}${P.join('')}${graderHtml}${ad}${script}</body></html>`;
}

const CSS = `
:root{--peri:#B1CAFF;--sky:#6395FF;--teal:#38BDC0;--up:#57d4a8;}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0b091c;color:#EAECFF;-webkit-font-smoothing:antialiased}
.panel{min-height:100vh;padding:90px 40px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;border-bottom:1px solid rgba(177,202,255,0.06);background:radial-gradient(120% 80% at 78% 12%,rgba(99,149,255,0.16),transparent 60%),radial-gradient(120% 80% at 12% 92%,rgba(56,189,192,0.14),transparent 60%),linear-gradient(180deg,#1a1550 0%,#0b091c 70%)}
.panel>*{max-width:1000px;width:100%}
h2{font-size:44px;font-weight:700;margin-bottom:14px;letter-spacing:-0.02em}
h3.gh{font-size:24px;font-weight:700;margin:34px 0 14px;width:100%;text-align:left;max-width:820px}
.lead{color:var(--peri);font-size:19px;line-height:1.5;margin-bottom:28px;opacity:.9}
.lead.center{margin:14px auto 24px}
.kicker,.eyebrow{text-transform:uppercase;letter-spacing:.22em;font-size:13px;color:var(--peri);opacity:.8;font-weight:600}
.hero{font-size:150px;font-weight:800;line-height:1;letter-spacing:-0.04em;background:linear-gradient(135deg,#8FB6FF,#38BDC0);-webkit-background-clip:text;background-clip:text;color:transparent;margin:8px 0}
.hero.sm{font-size:92px}
.herosub{font-size:20px;color:var(--peri);margin-bottom:8px}
.equiv{font-size:15px;color:#cfe6d8;margin:2px 0 12px}
.cap{font-size:13px;color:var(--peri);opacity:.72;margin-top:12px}
.pills{display:flex;gap:16px;justify-content:center;margin-top:28px;flex-wrap:wrap}
.dpill{display:inline-flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px 20px;border-radius:18px;background:rgba(87,212,168,0.10);border:1px solid rgba(87,212,168,0.32);color:#8ce3c2;font-size:16px;font-weight:650}
.dpill.down{background:rgba(255,140,140,0.10);border-color:rgba(255,140,140,0.32);color:#ffb3b3}
.sparkwrap{display:block;width:150px}.spark{width:150px;height:30px;display:block}
.chart{width:100%;height:auto;margin-top:8px;overflow:visible}
.axl{fill:var(--peri);font-size:12px;opacity:.7}.axv{fill:#fff;font-size:12px;font-weight:600}
.donut{width:230px;height:230px}.dnum{fill:#fff;font-size:34px;font-weight:800}.dsub{fill:var(--peri);font-size:13px}
.legend{display:flex;flex-direction:column;gap:8px;margin-top:16px;text-align:left}
.legend span{font-size:14px;color:var(--peri);display:flex;align-items:center;gap:8px}.legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
.split2{display:flex;gap:44px;align-items:center;justify-content:center;flex-wrap:wrap}.split2>div{flex:1;min-width:280px}
.donutwrap{display:flex;flex-direction:column;align-items:center;flex:0 0 auto}.notecol{text-align:left;max-width:360px}
.keyrow{display:flex;gap:24px;justify-content:center;margin-top:10px;font-size:14px}
.k1::before,.k2::before{content:'';display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:7px;vertical-align:middle}.k1::before{background:#6395FF}.k2::before{background:#38BDC0}
.mm{margin:6px auto 4px;max-width:840px}.mm-bar{display:flex;height:26px;border-radius:7px;overflow:hidden;gap:2px}.mm-seg{height:100%}
.mm-legend{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:14px;justify-content:center}.mm-leg{font-size:14px;color:var(--peri);display:inline-flex;align-items:center;gap:7px}.mm-leg i{width:11px;height:11px;border-radius:3px}
.heatmap{width:100%;max-width:840px;height:auto;margin:12px auto 0;display:block;overflow:visible}.hml{fill:var(--peri);font-size:11px;opacity:.75}
.heatkey{display:flex;align-items:center;gap:7px;justify-content:center;margin-top:16px;font-size:12px;color:var(--peri);opacity:.75}.heatkey i{width:14px;height:14px;border-radius:3px;display:inline-block}
.t3grid{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}
.t3card{background:rgba(177,202,255,0.06);border:1px solid rgba(177,202,255,0.14);border-radius:18px;padding:24px 26px;min-width:280px;flex:1;text-align:left}
.t3h{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:var(--peri);opacity:.8;margin-bottom:16px;font-weight:700}
.t3-row{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid rgba(177,202,255,0.08)}
.t3-n{font-size:17px;color:#fff;font-weight:600}.t3-p{font-size:16px;color:var(--peri);font-weight:700}.t3sub{font-size:12.5px;color:var(--peri);opacity:.7;margin-top:12px}
.quad{width:360px;height:360px;margin:20px auto 0;display:block}.ql{fill:var(--peri);font-size:12px;opacity:.85}.qm{fill:#fff;font-size:13px;font-weight:700}.qax{fill:var(--peri);font-size:11px;opacity:.6}
.atname{font-size:66px;font-weight:800;background:linear-gradient(135deg,#8FB6FF,#38BDC0);-webkit-background-clip:text;background-clip:text;color:transparent;margin:10px 0 6px}
.confession{color:var(--peri);font-size:16px;font-style:italic;opacity:.9;margin-top:20px;max-width:720px;margin-left:auto;margin-right:auto}
.cover .year{font-size:190px;font-weight:800;line-height:1;background:linear-gradient(135deg,#8FB6FF,#38BDC0);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-0.04em}
.cover .range{color:var(--peri);margin-top:8px;font-size:16px}.cover .scrollcue{margin-top:60px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--peri);opacity:.6}
.cover .wm,.wm{position:absolute;bottom:26px;font-size:15px;font-weight:700;color:var(--peri);opacity:.7}
/* grader */
.grader{align-items:center}
.grade-badge{display:flex;align-items:center;gap:22px;margin:6px 0 4px}
.grade-letter{font-size:96px;font-weight:800;width:130px;height:130px;border-radius:28px;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#241D71,#0a0820);border:1px solid rgba(177,202,255,0.25);background-clip:padding-box;color:transparent;background-image:linear-gradient(135deg,#8FB6FF,#38BDC0);-webkit-background-clip:text}
.grade-meta{text-align:left}.grade-num{font-size:52px;font-weight:800}.grade-num span{font-size:24px;color:var(--peri)}
.grade-level{color:var(--peri);font-size:15px;margin-top:4px}.locked{color:#ffcf8b}
.dims{width:100%;max-width:820px;margin-top:22px;display:flex;flex-direction:column;gap:14px}
.dim-head{display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px}.dim-head b{color:#fff}
.dim-bar{height:9px;border-radius:5px;background:rgba(177,202,255,0.12);overflow:hidden}.dim-bar i{display:block;height:100%;background:linear-gradient(90deg,#6395FF,#38BDC0)}
.fixes{width:100%;max-width:820px;display:flex;flex-direction:column;gap:14px}
.fix{display:flex;gap:16px;background:rgba(177,202,255,0.05);border:1px solid rgba(177,202,255,0.14);border-radius:16px;padding:18px 20px;text-align:left}
.fix-n{flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#6395FF,#38BDC0);color:#0b091c;font-weight:800;display:flex;align-items:center;justify-content:center}
.fix-t{font-size:18px;font-weight:700;color:#fff}.fix-e{font-size:15px;color:var(--peri);margin-top:6px;line-height:1.45}
.fix-paths{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}.fp{font-size:12.5px;padding:6px 12px;border-radius:999px;background:rgba(177,202,255,0.08);color:var(--peri)}.fp.hot{background:rgba(56,45,207,0.3);color:#dff1e9}
.fix-none{color:var(--peri);font-size:15px}
.pp{width:100%;max-width:820px;border-collapse:collapse;margin-top:6px;font-size:14px}
.pp th,.pp td{text-align:left;padding:10px 12px;border-bottom:1px solid rgba(177,202,255,0.1)}
.pp th{color:var(--peri);font-size:12px;text-transform:uppercase;letter-spacing:.06em}.pp td{color:#dfe6f4}.pp tr.flag td{color:#ffcf8b}
.next{width:100%;max-width:820px;text-align:left;margin-top:28px;background:rgba(177,202,255,0.05);border:1px solid rgba(177,202,255,0.14);border-radius:16px;padding:20px 22px}
.next b{font-size:18px}.next div{color:var(--peri);font-size:15px;margin-top:8px}
.l5{max-width:820px;margin-top:24px;font-size:15px;color:var(--peri);text-align:left;line-height:1.5;border-left:2px solid rgba(255,207,139,0.5);padding-left:18px}.l5 .lock{font-size:20px}
/* finale */
.finale{gap:0}
.cardwrap{width:100%;max-width:1000px;margin:6px auto 0;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.cardwrap svg{display:block;width:100%;height:auto}
.dl{display:flex;gap:12px;margin-top:26px;flex-wrap:wrap;justify-content:center}
.btn{background:linear-gradient(135deg,#6395FF,#38BDC0);color:#0b091c;font-weight:700;font-size:15px;padding:12px 20px;border-radius:999px;border:none;cursor:pointer}
.btn.ghost{background:transparent;border:1px solid rgba(177,202,255,0.3);color:var(--peri)}
.priv{max-width:760px;margin:18px auto 0;font-size:13px;color:var(--peri);opacity:.7;text-align:center}
/* closing Nimbalyst card */
.ad-inner{max-width:820px;margin:0 auto;background:linear-gradient(150deg,rgba(56,45,207,0.34),rgba(56,189,192,0.12));border:1px solid rgba(99,149,255,0.4);border-radius:26px;padding:48px 52px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.ad-title{font-size:44px;font-weight:800;margin:14px 0 18px;letter-spacing:-0.02em;background:linear-gradient(135deg,#8FB6FF,#38BDC0);-webkit-background-clip:text;background-clip:text;color:transparent}
.ad-body{font-size:19px;line-height:1.55;color:#eaecff;max-width:680px;margin:0 auto}
.ad-tie{font-size:16px;line-height:1.5;color:var(--peri);max-width:660px;margin:18px auto 0}
.ad-btn{display:inline-block;margin-top:30px;background:linear-gradient(135deg,#6395FF,#38BDC0);color:#0b091c;font-weight:750;font-size:16px;padding:15px 28px;border-radius:999px;text-decoration:none}
@media(max-width:720px){.hero{font-size:96px}.cover .year{font-size:120px}h2{font-size:32px}.grade-badge{flex-direction:column}.ad-title{font-size:32px}}
`;

// ===========================================================================
// Main
// ===========================================================================
function printWhatDoIRead() {
  console.log(`nimbalyst-grade.mjs reads exactly these globs, READ-ONLY, and nothing else:

  ${CLAUDE_DIR}/**/*.jsonl   (Claude Code session logs)
  ${CODEX_DIR}/**/*.jsonl    (Codex session logs)

- It makes ZERO network calls.
- It imports ONLY Node built-ins: node:fs, node:fs/promises, node:readline, node:path, node:os.
- It writes exactly ONE file: ${OUTPUT}
  (a self-contained HTML page: inline CSS/SVG/JS, no external requests).
- It never writes anywhere under ~/.claude or ~/.codex.

Nothing leaves your machine. Only aggregates are computed (counts, sums, ratios,
dates, tool/server names) — no prompt or message text is ever written out. You
can read this whole script first; it is one file.`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--what-do-i-read') || args.includes('--what-do-i-read=true')) { printWhatDoIRead(); return; }
  console.error(`Reading Claude Code + Codex session logs (read-only)... wrapping ${monthLabel(TARGET_MONTH)}`);
  let claude = await analyzeClaude();
  let codex = await analyzeCodex();
  let C = combine(claude, codex);
  // Fallback: if the picked month has no activity but earlier months do, wrap the most recent month that has data.
  if (C.headline.sessions === 0) {
    const withData = C.monthlySeries.filter((m) => m.sessions > 0);
    if (withData.length) { TARGET_MONTH = withData[withData.length - 1].month; console.error(`  No activity this month; wrapping ${monthLabel(TARGET_MONTH)} instead.`); claude = await analyzeClaude(); codex = await analyzeCodex(); C = combine(claude, codex); }
  }
  const G = computeGrade(C);
  const html = renderHtml(C, G);
  await writeFile(OUTPUT, html, 'utf8');
  console.error(`\nWrote ${OUTPUT}  (${monthLabel(TARGET_MONTH)} Wrapped)`);
  console.error(`  ${C.headline.sessions.toLocaleString()} sessions · ${C.headline.hours}h · ${C.headline.combinedTokensDisplay} tokens`);
  console.error(`  grade ${G.grade}/100 (${G.letter}), level ${G.level} · archetype ${arche_(C)}`);
  console.error(`  Open ${path.basename(OUTPUT)} in a browser; use the in-page button to download the share card PNG.`);
}
function arche_(C) { return C.archetype.archetype; }

main().catch((e) => { console.error('nimbalyst-grade.mjs failed:', e); process.exitCode = 1; });
