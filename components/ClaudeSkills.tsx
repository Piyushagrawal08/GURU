"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  Lightbulb,
  Play,
  Brain,
  FileText,
  Search as SearchIcon,
  Palette,
  Code2,
  FlaskConical,
  TestTube,
  Bot,
  GraduationCap,
  RefreshCw,
} from "lucide-react";

/* ---------------------------------------------------------------------------
   Content adapted from the "Claude Skills & LLM Optimization Hub" —
   a curated launchpad for Claude Code skills (Superpowers, AFK agents,
   REPLs, skill managers, issue workflows) plus LLM optimization techniques
   and a practical Ollama guide.
--------------------------------------------------------------------------- */

type Kind = "skill" | "afk" | "tool" | "doc" | "framework" | "video";

const KIND_TW: Record<Kind, string> = {
  skill: "text-indigo bg-indigo-soft",
  framework: "text-violet bg-violet-soft",
  afk: "text-coral-deep bg-coral-soft",
  tool: "text-mint bg-mint-soft",
  doc: "text-amber bg-amber-soft",
  video: "text-coral-deep bg-coral-soft",
};

interface Card {
  kind: Kind;
  badge: string;
  title: string;
  href?: string;
  cta?: string;
  desc: string;
}

interface Section {
  id: string;
  title: string;
  sub: string;
  note?: string;
  cards: Card[];
}

const SECTIONS: Section[] = [
  {
    id: "superpowers",
    title: "🦾 Superpowers — Core Skills Framework",
    sub: "The agentic skills framework by obra (Jesse Vincent). Most popular skills — grill, repls, afk-style loops, issues — live in or around this ecosystem.",
    cards: [
      {
        kind: "framework",
        badge: "Framework",
        title: "obra / superpowers",
        href: "https://github.com/obra/superpowers",
        cta: "Open repo",
        desc: "The core agentic skills library & methodology: brainstorming, TDD, plan writing, subagent-driven dev, systematic debugging, code review, worktrees.",
      },
      {
        kind: "skill",
        badge: "Community",
        title: "obra / superpowers-skills",
        href: "https://github.com/obra/superpowers-skills",
        cta: "Open repo",
        desc: "Community-editable skills for the Superpowers plugin — the place to read, fork, and contribute individual skill folders.",
      },
      {
        kind: "skill",
        badge: "Experimental",
        title: "obra / superpowers-lab",
        href: "https://github.com/obra/superpowers-lab",
        cta: "Open repo",
        desc: "Bleeding-edge skills: REPL/tmux control, MCP-CLI on demand, duplicate-function detection, headless Windows VMs.",
      },
      {
        kind: "doc",
        badge: "Plugin",
        title: "Superpowers — Official Plugin",
        href: "https://claude.com/plugins/superpowers",
        cta: "Plugin page",
        desc: "Install in Claude Code with /plugin install superpowers@claude-plugins-official. Also on the Anthropic marketplace.",
      },
      {
        kind: "doc",
        badge: "Guide",
        title: "Developing for Claude Code",
        href: "https://github.com/obra/superpowers-developing-for-claude-code",
        cta: "Open repo",
        desc: "obra's companion repo on authoring skills and building well-behaved Claude Code workflows.",
      },
    ],
  },
  {
    id: "grill",
    title: "🔥 Grill / Grilldown & Brainstorming",
    sub: '"Grilling" = stress-testing a plan with adversarial Socratic questioning before any code is written, then capturing decisions in docs.',
    note: "/grill-with-docs ships as a built-in skill in Claude Code — it challenges a plan against your domain model and updates CONTEXT.md / ADRs inline. The Superpowers brainstorming skill is the upstream technique it builds on.",
    cards: [
      {
        kind: "skill",
        badge: "Technique",
        title: "brainstorming (Superpowers)",
        href: "https://github.com/obra/superpowers-skills",
        cta: "Open repo",
        desc: 'Design refinement through Socratic questioning — the canonical "grill the idea before you build" skill. Browse the skills/ folder.',
      },
      {
        kind: "doc",
        badge: "Local skill",
        title: "grill-with-docs (built-in)",
        href: "https://code.claude.com/docs/en/skills",
        cta: "Skills docs",
        desc: "Run /grill-with-docs in Claude Code to stress-test a plan against documented decisions and sharpen terminology as you go.",
      },
    ],
  },
  {
    id: "repls",
    title: "⌨️ REPLs & Interactive CLI Control",
    sub: "Let Claude drive interactive tools — REPLs, vim, git rebase -i, menuconfig — by sending keystrokes through a tmux session.",
    cards: [
      {
        kind: "tool",
        badge: "tmux",
        title: "using-tmux-for-interactive-commands",
        href: "https://github.com/obra/superpowers-lab",
        cta: "Open repo",
        desc: "The Superpowers-lab skill that gives Claude control of REPLs and any interactive CLI via programmatic keystrokes + terminal capture.",
      },
      {
        kind: "tool",
        badge: "MCP",
        title: "mcp-cli (on-demand MCP)",
        href: "https://github.com/obra/superpowers-lab",
        cta: "Open repo",
        desc: "Use MCP servers from the CLI without pre-loading integrations — handy for ad-hoc REPL-like tool access.",
      },
    ],
  },
  {
    id: "afk",
    title: "🛋️ AFK — Away From Keyboard Agents",
    sub: "Run long autonomous tasks and walk away — pipelines, remote control, and autonomy managers.",
    cards: [
      {
        kind: "afk",
        badge: "Library",
        title: "m0nkmaster / afk",
        href: "https://github.com/m0nkmaster/afk",
        cta: "Open repo",
        desc: 'Tool-agnostic library for the "Ralph" AFK approach to AI-driven development. Works with Claude Code, Cursor, Codex, Aider, and more.',
      },
      {
        kind: "afk",
        badge: "Pipeline",
        title: "alexanderop / afk",
        href: "https://github.com/alexanderop/afk",
        cta: "Open repo",
        desc: "AFK coding pipeline plugin: spec → vertical slices → TDD loops → refactor → agentic QA → multi-agent review. Human judgment at the edges.",
      },
      {
        kind: "afk",
        badge: "Remote",
        title: "afk-claude-telegram-bridge",
        href: "https://github.com/gmotyl/afk-claude-telegram-bridge-skill",
        cta: "Open repo",
        desc: "Remote-control your Claude Code sessions from your phone over Telegram while away from the keyboard.",
      },
      {
        kind: "afk",
        badge: "Autonomy",
        title: "AFK Mode Manager",
        href: "https://mcpmarket.com/tools/skills/afk-mode-manager",
        cta: "View skill",
        desc: "Manages Claude's autonomy and tool-access levels through tiered permissions while you're away.",
      },
      {
        kind: "tool",
        badge: "Monitor",
        title: "clawd-on-desk",
        href: "https://github.com/rullerzhou-afk/clawd-on-desk",
        cta: "Open repo",
        desc: "A pixel desktop pet that watches Claude Code, Codex & Cursor so you can start a long task and walk away.",
      },
      {
        kind: "doc",
        badge: "Hooks tip",
        title: "Fixing AFK stalls with hooks",
        href: "https://medium.com/@microwalks/claude-code-kept-getting-stuck-while-i-was-afk-heres-how-i-fixed-it-with-hooks-90e1f15f7ca7",
        cta: "Read",
        desc: "Walkthrough on using Claude Code hooks so the agent doesn't get stuck while you're AFK.",
      },
    ],
  },
  {
    id: "issues",
    title: "🎫 Issues & Triage Workflow",
    sub: "Turn plans/PRDs into independently-grabbable issues, then triage them (HITL vs AFK) so agents can pick up work autonomously.",
    note: "Built-in skills cover this end to end: /to-prd (context → PRD), /to-issues (plan → tracer-bullet issues), and /triage (route issues through a state machine, classify HITL vs AFK). The AFK pipelines above consume these.",
    cards: [
      {
        kind: "skill",
        badge: "Workflow",
        title: "finishing-a-development-branch",
        href: "https://github.com/obra/superpowers",
        cta: "Open repo",
        desc: "Superpowers' merge/PR workflow skill — the tail end of the issue → branch → PR loop.",
      },
      {
        kind: "doc",
        badge: "CLI",
        title: "GitHub CLI (gh)",
        href: "https://cli.github.com/manual/",
        cta: "Docs",
        desc: "The backbone for issue/PR automation Claude uses — gh issue, gh pr. Required by most AFK + triage pipelines.",
      },
    ],
  },
  {
    id: "capman",
    title: "🧩 Capability / Skill Managers",
    sub: "Organize, sync, and share skills across Claude Code, Codex, Cursor and other agents from one place.",
    cards: [
      {
        kind: "tool",
        badge: "Desktop",
        title: "jiweiyeah / Skills-Manager",
        href: "https://github.com/jiweiyeah/Skills-Manager",
        cta: "Open repo",
        desc: "High-performance Tauri/React/Rust desktop app to organize, sync & share skills across multiple AI coding assistants.",
      },
      {
        kind: "tool",
        badge: "Desktop",
        title: "xingkongliang / skills-manager",
        href: "https://github.com/xingkongliang/skills-manager",
        cta: "Open repo",
        desc: "Lightweight desktop app to manage, sync & organize agent skills across 15+ coding tools.",
      },
      {
        kind: "tool",
        badge: "macOS",
        title: "tddworks / SkillsManager",
        href: "https://github.com/tddworks/SkillsManager",
        cta: "Open repo",
        desc: "macOS app to discover, browse & install skills for Claude Code and Codex from GitHub or your filesystem.",
      },
    ],
  },
  {
    id: "collections",
    title: "📚 Skill Collections & Awesome Lists",
    sub: "Big curated sources to pull more skills from.",
    cards: [
      {
        kind: "skill",
        badge: "Official",
        title: "anthropics / skills",
        href: "https://github.com/anthropics/skills",
        cta: "Open repo",
        desc: "Anthropic's public Agent Skills repo — creative, technical, and enterprise skills straight from the source.",
      },
      {
        kind: "skill",
        badge: "Awesome",
        title: "awesome-claude-skills",
        href: "https://github.com/travisvn/awesome-claude-skills",
        cta: "Open repo",
        desc: "Curated list of skills, resources & tools for customizing Claude workflows — especially Claude Code.",
      },
      {
        kind: "skill",
        badge: "Mega-pack",
        title: "alirezarezvani / claude-skills",
        href: "https://github.com/alirezarezvani/claude-skills",
        cta: "Open repo",
        desc: "330+ skills, 30+ agents, 70+ commands across Claude Code, Codex, Gemini CLI, Cursor and more.",
      },
      {
        kind: "skill",
        badge: "Harness",
        title: "affaan-m / ECC",
        href: "https://github.com/affaan-m/ECC",
        cta: "Open repo",
        desc: "Agent-harness performance optimization: skills, instincts, memory, security, research-first development.",
      },
      {
        kind: "doc",
        badge: "Topic",
        title: "GitHub topic: claude-code-skills",
        href: "https://github.com/topics/claude-code-skills",
        cta: "Browse",
        desc: "Live feed of every repo tagged with the claude-code-skills topic — a good discovery firehose.",
      },
      {
        kind: "doc",
        badge: "Docs",
        title: "Claude Code — Skills docs",
        href: "https://code.claude.com/docs/en/skills",
        cta: "Read docs",
        desc: "Official documentation on what skills are, how they load, and how to author your own.",
      },
    ],
  },
];

/* The agent-chain pipeline: instead of one big prompt, route the work through
   specialized agents, resetting context between each stage. */
const PIPELINE: { icon: typeof Brain; title: string; desc: string }[] = [
  { icon: Brain, title: "Topic Understanding", desc: "Parse the goal, define scope & success criteria for the feature/issue." },
  { icon: FileText, title: "Context Preparation", desc: "Gather the exact files, docs & constraints the next agents need — nothing more." },
  { icon: SearchIcon, title: "Research", desc: "Investigate the domain, prior art, libraries & trade-offs for this topic." },
  { icon: Palette, title: "UI Design", desc: "Design the interface / structure before any logic is written." },
  { icon: Code2, title: "Logic Build", desc: "Implement the business logic against the agreed design." },
  { icon: FlaskConical, title: "Test-Case Design", desc: "A separate agent writes test cases for the built logic — adversarial, not self-graded." },
  { icon: TestTube, title: "Logic Testing", desc: "Run the suite, surface failures, and hand fixes back to the build agent." },
  { icon: Bot, title: "Real-Time Testing", desc: "Drive Playwright & friends to verify the result in a real browser/runtime." },
  { icon: GraduationCap, title: "Learn & Memorize", desc: "An agent studies what was built and writes a learning file for this issue." },
  { icon: RefreshCw, title: "Next Issue →", desc: "Context resets; the chain loops to the next issue with accumulated learnings." },
];

const MULTIAGENT_CARDS: Card[] = [
  {
    kind: "framework",
    badge: "Orchestration",
    title: "barkain / claude-code-workflow-orchestration",
    href: "https://github.com/barkain/claude-code-workflow-orchestration",
    cta: "Open repo",
    desc: "Claude Code plugin for multi-step orchestration: automatic task decomposition, parallel agent execution, and specialized delegation with native plan mode.",
  },
  {
    kind: "framework",
    badge: "Pipeline",
    title: "aaddrick / claude-pipeline",
    href: "https://github.com/aaddrick/claude-pipeline",
    cta: "Open repo",
    desc: "Portable multi-agent pipeline — skills, agents, hooks, orchestration scripts and quality gates that work together end to end.",
  },
  {
    kind: "tool",
    badge: "Parallel",
    title: "Dicklesworthstone / claude_code_agent_farm",
    href: "https://github.com/Dicklesworthstone/claude_code_agent_farm",
    cta: "Open repo",
    desc: "Run 20+ Claude Code agents in parallel: automated bug fixing, best-practice sweeps, lock-based coordination, real-time tmux monitoring.",
  },
  {
    kind: "skill",
    badge: "Subagents",
    title: "VoltAgent / awesome-claude-code-subagents",
    href: "https://github.com/VoltAgent/awesome-claude-code-subagents",
    cta: "Open repo",
    desc: "100+ specialized Claude Code subagents — research, build, test, review — the building blocks for a role-based agent chain.",
  },
  {
    kind: "skill",
    badge: "Subagents",
    title: "wshobson / agents",
    href: "https://github.com/wshobson/agents",
    cta: "Open repo",
    desc: "76 production-ready subagents for Claude Code, each scoped to a role with the right tool set. Drop into ~/.claude/agents/.",
  },
  {
    kind: "skill",
    badge: "Collection",
    title: "rahulvrane / awesome-claude-agents",
    href: "https://github.com/rahulvrane/awesome-claude-agents",
    cta: "Open repo",
    desc: "A curated collection of Claude Code subagents to mix and match into your own pipeline.",
  },
  {
    kind: "doc",
    badge: "Anthropic",
    title: "How we built our multi-agent research system",
    href: "https://www.anthropic.com/engineering/built-multi-agent-research-system",
    cta: "Read",
    desc: "The orchestrator–worker blueprint: a lead agent plans and delegates to subagents. Beat single-agent by 90%+ in evals.",
  },
  {
    kind: "doc",
    badge: "Anthropic",
    title: "Building effective agents",
    href: "https://www.anthropic.com/engineering/building-effective-agents",
    cta: "Read",
    desc: "The canonical patterns — prompt chaining, routing, orchestrator-workers, evaluator-optimizer — for composing agents over mega-prompts.",
  },
  {
    kind: "doc",
    badge: "Anthropic",
    title: "Effective context engineering for AI agents",
    href: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    cta: "Read",
    desc: "Why resetting and curating context per stage beats one ballooning thread — the backbone of a clean agent chain.",
  },
  {
    kind: "doc",
    badge: "Docs",
    title: "Claude Code — Create custom subagents",
    href: "https://code.claude.com/docs/en/sub-agents",
    cta: "Read docs",
    desc: "Official guide: each subagent gets its own context window, system prompt, tool access & permissions — the unit of the pipeline.",
  },
  {
    kind: "doc",
    badge: "Guide",
    title: "Shipyard — Multi-agent orchestration for Claude Code (2026)",
    href: "https://shipyard.build/blog/claude-code-multi-agent/",
    cta: "Read",
    desc: "A practical 2026 walkthrough of wiring multiple Claude Code agents into a coordinated workflow.",
  },
  {
    kind: "doc",
    badge: "Patterns",
    title: "Beyond One-Shot Prompts: 5 Workflow Patterns",
    href: "https://www.mindstudio.ai/blog/claude-code-agentic-workflow-patterns",
    cta: "Read",
    desc: "Five agentic Claude Code patterns that replace single prompts with structured, repeatable flows.",
  },
  {
    kind: "video",
    badge: "Video",
    title: "Claude Code Dynamic Workflows: 1,000 Agents at Once",
    href: "https://www.youtube.com/watch?v=iJHJaTOwggs",
    cta: "Watch",
    desc: "Walkthrough of dynamic, large-scale multi-agent workflows in Claude Code.",
  },
  {
    kind: "video",
    badge: "Video",
    title: "Build a proactive agent workflow with Claude Code",
    href: "https://www.youtube.com/watch?v=eSP7PLTXNy8",
    cta: "Watch",
    desc: "How routines turn Claude Code into a proactive teammate that reads your repo and opens PRs autonomously.",
  },
];

const OPTIMIZE_TABLE: [string, string][] = [
  ["Prompt caching", "Cache long, stable context (system prompt, docs, code) so repeat calls skip re-processing — big latency & cost wins."],
  ["Skills over mega-prompts", "Load focused instructions on demand instead of stuffing everything into one prompt — keeps context lean and on-task."],
  ["Subagents / fan-out", "Dispatch parallel read-only agents for search/review; keep their noisy output out of the main context."],
  ["Plan → grill → execute", "Stress-test a plan (brainstorming/grill) before writing code; cheaper to fix a plan than a codebase."],
  ["TDD red-green-refactor", "Tests give the agent a verifiable target and stop silent regressions during autonomous (AFK) runs."],
  ["Hooks & permissions", "Automate guardrails so AFK agents don't stall or run unsafe commands; tier autonomy by trust."],
  ["Memory files", "Persist durable facts/preferences so each session starts informed instead of cold."],
  ["Right model for the job", "Use a strong model (Opus) to plan/review, a faster one (Sonnet/Haiku) for bounded execution."],
];

const OPTIMIZE_CARDS: Card[] = [
  {
    kind: "doc",
    badge: "Guide",
    title: "Superpowers Complete Guide 2026",
    href: "https://pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide",
    cta: "Read",
    desc: "End-to-end walkthrough of the Superpowers methodology and how the skills fit together.",
  },
  {
    kind: "doc",
    badge: "Article",
    title: "Matt Pocock's 5 Claude Code skills",
    href: "https://adityakumarpuri.medium.com/matt-pococks-5-claude-code-skills-made-me-rewrite-how-i-work-with-ai-agents-d71853c3056c",
    cta: "Read",
    desc: "Practical patterns for restructuring how you work with AI agents day to day.",
  },
];

const OLLAMA_TABLE: [string, string, string][] = [
  ["Light / 6–8GB GPU", "llama3.1:8b · qwen2.5:7b", "~6 GB"],
  ["Mid all-rounder", "qwen2.5:32b", "~20 GB"],
  ["Coding", "qwen2.5-coder:32b", "~20 GB"],
  ["Top quality", "llama3.3:70b", "~40 GB"],
  ["Tiny / CPU-ish", "gemma4:e2b · llama3.2:3b", "2–4 GB"],
];

const OLLAMA_STEPS = [
  "Lower temperature (0.1–0.3) for coding/factual work; raise it for brainstorming.",
  "Match num_ctx to the job — big contexts eat VRAM fast; don't set 128k if you need 8k.",
  "Quantize the K/V cache (q8_0) to run longer contexts on the same GPU.",
  "Use system prompts — Gemma 4 & most modern models honor the system role for steerability.",
  "Benchmark quants — run the same prompt at Q4/Q5/Q8 and keep the smallest that's still good enough.",
  "Point your tools at it — the /v1 endpoint drops into most OpenAI SDKs, IDE plugins, and agent frameworks.",
];

const OLLAMA_CARDS: Card[] = [
  { kind: "doc", badge: "Official", title: "Ollama FAQ & Docs", href: "https://docs.ollama.com/faq", cta: "Read", desc: "Context length, env vars, GPU config, K/V cache quantization — the authoritative reference." },
  { kind: "doc", badge: "Library", title: "Ollama Model Library", href: "https://ollama.com/library", cta: "Browse", desc: "Browse every model + quantization tag (e.g. q4_K_M, q8_0) with sizes." },
  { kind: "doc", badge: "Cheat sheet", title: "Ollama CLI Cheat Sheet", href: "https://llmhardware.io/guides/ollama-cheat-sheet", cta: "Open", desc: "Complete command reference for daily use." },
  { kind: "doc", badge: "Tuning", title: "Performance Optimization Guide", href: "https://eastondev.com/blog/en/posts/ai/20260410-ollama-performance-optimization/", cta: "Read", desc: "Quantization, batching & memory tuning for faster local inference." },
  { kind: "doc", badge: "Rankings", title: "Best Ollama Models 2026", href: "https://whatllm.org/best-ollama-models", cta: "Read", desc: "Up-to-date model rankings by task (coding, RAG, chat, reasoning)." },
  { kind: "doc", badge: "Windows", title: "Ollama on Windows", href: "https://medium.com/@kapildevkhatik2/optimizing-ollama-performance-on-windows-hardware-quantization-parallelism-more-fac04802288e", cta: "Read", desc: "Hardware, quantization & parallelism tuning specifically for Windows." },
];

export default function ClaudeSkills() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-10"
    >
      {/* Intro */}
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-soft">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Claude Skills & LLM Optimization Hub
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          A curated launchpad for Claude Code skills — Superpowers, AFK agents,
          REPLs, skill managers, issue workflows — plus optimization techniques
          and a practical guide to running local LLMs with Ollama.
        </p>
      </div>

      {/* Multi-agent orchestration — the headline workflow */}
      <section className="space-y-4">
        <SectionHeading
          title="🤖 Multi-Agent Orchestration — Build with a chain, not a prompt"
          sub="Instead of one-shotting a feature with a single prompt, route the work through a chain of specialized Claude agents. Each stage gets a fresh, curated context; the right agent (and model) is matched to each task. This ships products far more reliably than prompt-based coding."
        />

        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PIPELINE.map((stage, i) => (
              <PipelineStep key={stage.title} stage={stage} index={i} />
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Note>
              <RefreshCw className="mr-1 inline h-3.5 w-3.5 text-amber" />
              Reset context after every stage — each agent starts clean with only
              what it needs, so errors and noise don't compound down the chain.
            </Note>
            <Note>
              <Bot className="mr-1 inline h-3.5 w-3.5 text-amber" />
              Route by strength — use a strong model (Opus) to plan, research &
              review; a faster one (Sonnet/Haiku) for bounded build & test steps.
              Track which agent performs each task best.
            </Note>
          </div>
        </div>

        <CardGrid cards={MULTIAGENT_CARDS} />
      </section>

      {SECTIONS.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}

      {/* Optimization techniques */}
      <section className="space-y-4">
        <SectionHeading
          title="⚙️ Claude / LLM Optimization Techniques"
          sub="Core practices that make any Claude/LLM workflow faster, cheaper, and more reliable."
        />
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg-tint">
                <th className="px-4 py-2.5 font-semibold text-indigo">Technique</th>
                <th className="px-4 py-2.5 font-semibold text-indigo">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {OPTIMIZE_TABLE.map(([t, why]) => (
                <tr key={t} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-ink">{t}</td>
                  <td className="px-4 py-2.5 text-muted">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardGrid cards={OPTIMIZE_CARDS} />
      </section>

      {/* Ollama guide */}
      <section className="space-y-4">
        <SectionHeading
          title="🦙 Using Local LLMs with Ollama — Effectively"
          sub="Ollama is the de-facto local-LLM runtime: one CLI + an OpenAI-compatible REST API. Here's how to get real value out of it."
        />

        <GuideStep n="1" title="Install & first run" />
        <CodeBlock>{`# after installing from ollama.com
ollama pull llama3.1:8b        # download a model
ollama run llama3.1:8b         # interactive chat
ollama list                    # what's installed
ollama ps                      # what's loaded in memory`}</CodeBlock>

        <GuideStep n="2" title="Pick the right model for your hardware" />
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg-tint">
                <th className="px-4 py-2.5 font-semibold text-indigo">Use case</th>
                <th className="px-4 py-2.5 font-semibold text-indigo">Model</th>
                <th className="px-4 py-2.5 font-semibold text-indigo">~VRAM (Q4)</th>
              </tr>
            </thead>
            <tbody>
              {OLLAMA_TABLE.map(([use, model, vram]) => (
                <tr key={use} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">{use}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-coral-deep">{model}</td>
                  <td className="px-4 py-2.5 text-muted">{vram}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          Rule of thumb: Q4_K_M is the sweet spot for 7B+ models (halves VRAM,
          minimal quality loss). For small models (&lt;4B) prefer q6_K or q8_0 to
          keep quality up.
        </Note>

        <GuideStep n="3" title="Tune context & memory" />
        <CodeBlock>{`# bigger default context window (default is 4096)
export OLLAMA_CONTEXT_LENGTH=32000
# K/V cache quantization — q8_0 ≈ half memory, tiny quality loss
export OLLAMA_KV_CACHE_TYPE=q8_0
# keep models loaded longer / unload sooner
export OLLAMA_KEEP_ALIVE=30m
ollama serve`}</CodeBlock>

        <GuideStep n="4" title="Make a reusable model with a Modelfile" />
        <CodeBlock>{`# Modelfile
FROM qwen2.5:7b
PARAMETER temperature 0.3
PARAMETER num_ctx 16384
SYSTEM "You are a concise senior engineer. Answer with code first, prose second."

# then build & run it
ollama create mydev -f Modelfile
ollama run mydev`}</CodeBlock>

        <GuideStep n="5" title="Use the API (OpenAI-compatible)" />
        <CodeBlock>{`curl http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"qwen2.5:7b","messages":[{"role":"user","content":"hi"}]}'`}</CodeBlock>

        <ol className="space-y-2 pl-1">
          {OLLAMA_STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-soft">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <CardGrid cards={OLLAMA_CARDS} />
      </section>

      <p className="border-t border-line pt-6 text-center text-xs text-faint">
        Curated for Viswajeet · Some skills (grill-with-docs, to-issues, triage)
        ship built-in with Claude Code and are invoked with /command rather than a
        standalone repo.
      </p>
    </motion.div>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <section className="space-y-4">
      <SectionHeading title={section.title} sub={section.sub} />
      {section.note && (
        <Note>
          <Lightbulb className="mr-1 inline h-3.5 w-3.5 text-amber" />
          {section.note}
        </Note>
      )}
      <CardGrid cards={section.cards} />
    </section>
  );
}

function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border-l-[3px] border-coral pl-3">
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-sm text-muted">{sub}</p>
    </div>
  );
}

function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <SkillCard key={c.title} card={c} />
      ))}
    </div>
  );
}

function SkillCard({ card }: { card: Card }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-soft transition-shadow hover:shadow-lift"
    >
      <span
        className={`mb-2 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_TW[card.kind]}`}
      >
        {card.badge}
      </span>
      <h4 className="text-sm font-semibold leading-snug text-ink">
        {card.href ? (
          <a
            href={card.href}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-indigo"
          >
            {card.title}
          </a>
        ) : (
          card.title
        )}
      </h4>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">{card.desc}</p>
      {card.href && (
        <a
          href={card.href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo transition hover:gap-1.5"
        >
          {card.cta ?? "Open"}{" "}
          {card.kind === "video" ? (
            <Play className="h-3 w-3" />
          ) : (
            <ExternalLink className="h-3 w-3" />
          )}
        </a>
      )}
    </motion.div>
  );
}

function PipelineStep({
  stage,
  index,
}: {
  stage: { icon: typeof Brain; title: string; desc: string };
  index: number;
}) {
  const Icon = stage.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="relative flex flex-col gap-1.5 rounded-xl border border-line bg-bg/50 p-3"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-soft text-indigo">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-faint">
          Step {index + 1}
        </span>
      </div>
      <h4 className="text-xs font-semibold leading-snug text-ink">{stage.title}</h4>
      <p className="text-[11px] leading-relaxed text-muted">{stage.desc}</p>
    </motion.div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line border-l-[3px] border-l-amber bg-amber-soft/40 px-4 py-3 text-sm leading-relaxed text-ink-soft">
      {children}
    </div>
  );
}

function GuideStep({ n, title }: { n: string; title: string }) {
  return (
    <h4 className="flex items-center gap-2 pt-2 text-sm font-semibold text-ink">
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-soft text-xs font-bold text-indigo">
        {n}
      </span>
      {title}
    </h4>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-ink px-4 py-3.5 font-mono text-xs leading-relaxed text-bg">
      {children}
    </pre>
  );
}
