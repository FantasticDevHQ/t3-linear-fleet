<p align="center">
  <a href="https://fantastic.dev"><img src="assets/fantastic-dev-logo.svg" width="80" height="80" alt="Fantastic.Dev" /></a>
</p>

<h1 align="center">T3 Linear Fleet</h1>

<p align="center"><strong>Plan a feature in Linear, then let a fleet of agents build it, get it green, and hand you the evidence.</strong></p>

<p align="center">A <a href="https://fantastic.dev">Fantastic.Dev</a> Project</p>

<p align="center">
  <a href="https://fantastic.dev"><img src="https://img.shields.io/badge/Fantastic.dev-94C173?style=for-the-badge&amp;logoColor=0c0e13" alt="Visit Fantastic.Dev" /></a>
  <a href="https://github.com/FantasticDevHQ"><img src="https://img.shields.io/badge/GitHub-0c0e13?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="Fantastic.Dev on GitHub" /></a>
  <a href="https://www.youtube.com/@FantasticDevHQ"><img src="https://img.shields.io/badge/YouTube-FF0033?style=for-the-badge&amp;logo=youtube&amp;logoColor=white" alt="Fantastic.Dev on YouTube" /></a>
  <a href="https://twitter.com/FantasticDevHQ"><img src="https://img.shields.io/badge/Twitter_%2F_X-0c0e13?style=for-the-badge&amp;logo=x&amp;logoColor=white" alt="Fantastic.Dev on Twitter / X" /></a>
</p>

<p align="center"><a href="#quick-start">Quick start</a> · <a href="#have-my-agent-set-this-up">Agent setup</a> · <a href="#skills">Skills</a></p>

---

T3 Linear Fleet is a set of agent skills for solo developers who plan in [Linear](https://linear.app) and run coding agents through [T3 Code](https://github.com/pingdotgg/t3code). You plan a feature once. A fleet of agents builds it in parallel across your machines and model providers, gets everything green, and hands you evidence to review. You don't have to babysit them.

> **Unofficial.** Not affiliated with T3, T3 Code, or their authors.

## Quick start

### Have my agent set this up

Copy this into your coding agent (Claude Code, Codex, or another agent that supports skills), in any directory:

```text
Install the T3 Linear Fleet skills from https://github.com/FantasticDevHQ/t3-linear-fleet
for my coding agents, using the public `skills` CLI (https://skills.sh).

1. Check that Node.js 22 or newer and npx are available. Stop and tell me if not.
2. Run `npx skills@latest add FantasticDevHQ/t3-linear-fleet --list` and show me
   the available skills.
3. Install them globally for the agents I use:
   `npx skills@latest add FantasticDevHQ/t3-linear-fleet --global --skill '*'`
   Ask me which agents to target if the CLI cannot detect them.
4. Verify with `npx skills@latest list --global` that `issue-breakdown` is installed.
5. Check whether my agent can reach Linear through the Linear MCP server or
   `linear-cli`. Do not create, edit, or delete any Linear data. Only report
   whether access is available.

Report the commands you ran, the installed skills, the agents they were linked
to, and whether Linear access is ready. Do not claim anything you did not verify.
```

### Manual setup

Requires Node.js 22 or newer with npx. Using the skills also needs a Linear workspace, connected through the Linear MCP server or `linear-cli`.

List the skills, then install them globally:

```sh
npx skills@latest add FantasticDevHQ/t3-linear-fleet --list
npx skills@latest add FantasticDevHQ/t3-linear-fleet --global --skill '*'
```

Verify the install:

```sh
npx skills@latest list --global
```

Expected result: `issue-breakdown` appears in the list for your agents. Ask your agent to "break down" a feature to start a Linear plan.

## The workflow

1. **Plan (about 30 minutes, the only conversation).** The planner reads the codebase and writes an intent brief: problem, users, definition of done, non-goals, and decisions. It then asks you all of its questions in one batch, each with a recommended default. Tickets are few, describe what to build, and have acceptance criteria that can be proven inside the PR before merge.
2. **Execute (no human in the loop).** An orchestrator in T3 Code dispatches tickets as their blockers merge. Each worker gets its own checkout, on a local or a cloud machine, using whichever provider has capacity. Workers own their tickets until they are merged and green. Only costly or irreversible decisions are escalated, and those are batched.
3. **Review evidence (about 5 minutes).** You get a recording of the feature working on a preview deploy, the decisions and deviations, and a checklist linking each acceptance criterion to its proof. You merge.

## Skills

| Skill | Status | What it does |
| --- | --- | --- |
| [issue-breakdown](./skills/issue-breakdown/SKILL.md) | Ready (2.0) | Plans a feature as a Linear project: intent brief, one batch of questions with defaults, a cold read, the fewest tickets, EARS requirements traced to acceptance criteria provable inside the PR, and a readiness gate. |
| project-run | Planned | Orchestrator: dispatch, load balancing across machines and providers, merge and freeze rules, escalation, evidence packet. |
| ticket-worker | Planned | The worker brief: intent, smallest change, proof, ownership through green. |
| pr-gate | Planned | Merge gate and PR event handling. |
| review-loop | Planned | Budgeted review by a different provider, with blocker / should / nit severity. |
| council | Planned | Optional review by several providers for large or risky work. |
| ticket-takeover | Planned | A fresh agent takes over a stuck ticket. |
| pr-writing | Planned | PR descriptions, evidence packets, and comment attribution. |

The skills require Linear (MCP server or `linear-cli`) and T3 Code for orchestration. They never assume a specific secrets manager; they use whatever your project declares.

## Linear setup

The fleet tracks tickets on commits, not PR titles. Every commit carries a Linear magic word (`Fixes ENG-123` when it completes the ticket, `Refs ENG-123` for partial work), and the feature PR lists every ticket again, because Linear does not re-detect tickets merged into a feature branch. Do this once per Linear team, under Settings > Team > Workflows & automations:

1. Turn on **Link commits to issues with magic words** and add the GitHub push webhook that Linear shows.
2. Add branch-specific rules: a merge into `^feat/.*` moves the ticket to an "Integrated" status (or "no action"), and a merge into `main` moves it to Done.

See [Linear's GitHub integration docs](https://linear.app/docs/github) for details.

## Contributing

Requires Node.js 22 or newer. No dependency install is needed. Run the checks:

```sh
node scripts/check.mjs
```

Follow [AGENTS.md](AGENTS.md) for skill rules and the [pull request standard](docs/pull-request-standard.md) for PRs.

## Credits

The orchestration patterns are informed by Theo's [tstack](https://github.com/t3dotgg/tstack) skills (MIT). Everything here is written independently and has no dependency on tstack.

## License

[MIT](LICENSE)
