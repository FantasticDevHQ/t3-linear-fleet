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

<p align="center">
  <a href="https://github.com/FantasticDevHQ/t3-linear-fleet/actions/workflows/check.yml"><img src="https://img.shields.io/github/actions/workflow/status/FantasticDevHQ/t3-linear-fleet/check.yml?branch=main&amp;style=flat-square" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/FantasticDevHQ/t3-linear-fleet?style=flat-square" alt="License" /></a>
</p>

<p align="center"><a href="#quick-start">Quick start</a> · <a href="#have-my-agent-set-this-up">Agent setup</a> · <a href="#skills">Skills</a></p>

---

T3 Linear Fleet is a set of agent skills for solo developers who plan in [Linear](https://linear.app) and run coding agents through [T3 Code](https://github.com/pingdotgg/t3code). You plan a feature once. A fleet of agents builds it in parallel across your machines and model providers, gets everything green, and hands you evidence to review. You don't have to watch over them.

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
4. Verify with `npx skills@latest list --global` that `fleet-plan` is installed.
5. Check whether my agent can reach Linear, through either:
   - the Linear MCP server (https://linear.app/docs/mcp), at
     https://mcp.linear.app/mcp, or
   - linear-cli (https://github.com/nesszer/linear-cli): `linear-cli --version`.
   If neither works, tell me how to connect the MCP server for my agent, or how
   to install linear-cli (`cargo install linear-cli`) and authenticate it
   (`linear-cli setup`). Do not ask me for an API key in chat. Do not create,
   edit, or delete any Linear data. Only report whether access is available.
6. Check that T3 Code (https://github.com/pingdotgg/t3code) is how I run my
   agents if I want to use project-run; it needs T3 Code's orchestration tools.

Report the commands you ran, the installed skills, the agents they were linked
to, and whether Linear access is ready. Do not claim anything you did not verify.
```

### Manual setup

Requires Node.js 22 or newer with npx. Using the skills also needs a Linear workspace, connected through either:

- the [Linear MCP server](https://linear.app/docs/mcp) at `https://mcp.linear.app/mcp`, added to your agent; or
- [linear-cli](https://github.com/nesszer/linear-cli): `cargo install linear-cli`, then `linear-cli setup`.

`project-run` also needs [T3 Code](https://github.com/pingdotgg/t3code), which provides the orchestration tools.

List the skills, then install them globally:

```sh
npx skills@latest add FantasticDevHQ/t3-linear-fleet --list
npx skills@latest add FantasticDevHQ/t3-linear-fleet --global --skill '*'
```

Verify the install:

```sh
npx skills@latest list --global
```

Expected result: `fleet-plan` appears in the list for your agents. Then ask your agent to "set up the fleet" (`fleet-setup`), and "plan this feature with fleet-plan" to start a Linear plan.

## The workflow

1. **Plan (about 30 minutes, the only conversation).** The planner reads the codebase and writes an intent brief: problem, users, definition of done, non-goals, and decisions. It then asks you all of its questions in one batch, each with a recommended default. Tickets are few, describe what to build, and have acceptance criteria that can be proven inside the PR before merge.
2. **Execute (no human in the loop).** An orchestrator in T3 Code dispatches tickets as their blockers merge. Each worker gets its own checkout, on a local or a cloud machine, using whichever provider has capacity. Workers own their tickets until they are merged and green. Only costly or irreversible decisions are escalated, and those are batched.
3. **Review evidence (about 5 minutes).** You get a recording of the feature working on a preview deploy, the decisions and deviations, and a checklist linking each acceptance criterion to its proof. You merge.

## Skills

| Skill | Status | What it does |
| --- | --- | --- |
| [fleet-setup](./skills/fleet-setup/SKILL.md) | Ready (1.0.0) | One-time setup and health check: Linear access (MCP or linear-cli), T3 Code providers, the GitHub CLI, the t3-fleet labels, Linear's GitHub automation, and your model ratings. Safe to rerun. |
| [fleet-plan](./skills/fleet-plan/SKILL.md) | Ready (3.1.1) | Plans a feature as a Linear project: intent brief, one batch of questions with defaults, a cold read, the fewest tickets, EARS requirements traced to acceptance criteria provable inside the PR, and a readiness gate. |
| [fleet-models](./skills/fleet-models/SKILL.md) | Ready (1.0.0) | Classifies your favorite models in T3 Code once (intelligence, taste, cost, best use) from suggested defaults you confirm, asks again only about new favorites, and holds the rule for picking each ticket's model. |
| [project-run](./skills/project-run/SKILL.md) | Ready (1.5.0) | The orchestrator: preflight, integration branch, foundation first, dispatch on blockers across T3 Code machines and providers, merge and freeze rules, takeovers, batched escalation, feature review, and the evidence packet. |
| [project-refresh](./skills/project-refresh/SKILL.md) | Ready (1.3.0) | `/project-refresh <Linear project URL>`: audits a project written to an older standard and rewrites it in place to the fleet spec, keeping IDs and history, so `project-run` can execute it. |
| [ticket-worker](./skills/ticket-worker/SKILL.md) | Ready (1.2.0) | The worker brief: intent, smallest change, proof, ownership through green, escalation to the orchestrator, fixed report line. |
| [pr-gate](./skills/pr-gate/SKILL.md) | Ready (1.1.1) | Ticket and final merge gates, PR watching without polling, event routing, and the freeze on a red integration branch. |
| [review-loop](./skills/review-loop/SKILL.md) | Ready (1.1.0) | Budgeted review by a different provider, with blocker / should / nit severity, a ledger, and checks for over-engineering and weakened tests. |
| [panel-review](./skills/panel-review/SKILL.md) | Ready (1.0.0) | Optional review by a panel of three flagship models from three providers, with scores per round, synthesis, and firm scope control. For plans, contracts, and large features. |

The skills require Linear, through the [Linear MCP server](https://linear.app/docs/mcp) or [linear-cli](https://github.com/nesszer/linear-cli), and [T3 Code](https://github.com/pingdotgg/t3code) for orchestration. No config file lists your machines or models: `project-run` discovers your linked machines, their providers and models, and the repository's project on each machine through T3 Code every time it runs, so machines can come and go. Set limits in the request itself, for example "run this project, max 8 workers". Each ticket names the model that builds it and an effort level (`low` to `max`) in a short Fleet section. Planning picks them from your favorite models in T3 Code, using the ratings you gave each one through `fleet-models`, which keeps them in one file, `~/.config/t3-linear-fleet/models.json`. Edit that section to change a ticket's model, or override it in the run request. The skills never assume a specific secrets manager; they use whatever your project declares.

## Linear setup

Run `fleet-setup` once (ask your agent to "set up the fleet"). It checks Linear access, T3 Code, and the GitHub CLI, creates the `t3-fleet` label group (`t3-fleet-foundation`, `t3-fleet-local-only`, `t3-fleet-schema-change`, `t3-fleet-risky`) at the right level of your workspace, rates your favorite models, and ends with a ready checklist. Run it again any time; it only fixes what is missing.

Two Linear settings cannot be changed through the API, so `fleet-setup` walks you through them, once per team (Settings > Team > Workflows & automations):

1. Turn on **Link commits to issues with magic words** and add the GitHub push webhook that Linear shows. The fleet links work through commits (`Fixes ENG-123`, `Refs ENG-123`), not PR titles, and the feature PR lists every ticket again, because Linear does not re-detect tickets merged into a feature branch.
2. Add branch-specific rules: a merge into `^feat/.*` moves the ticket to an "Integrated" status (or "no action"), and a merge into `main` moves it to Done.

Your repository's CI must also run on pull requests into `feat/**` and on pushes to `feat/**`, not only on the default branch. `project-refresh` plans this as a prerequisite, and `project-run` checks it before it starts.

See [Linear's GitHub integration docs](https://linear.app/docs/github) for details.

## Contributing

Contributions are welcome. Read the
[contributing guide](https://github.com/FantasticDevHQ/.github/blob/main/CONTRIBUTING.md)
and [Code of Conduct](https://github.com/FantasticDevHQ/.github/blob/main/CODE_OF_CONDUCT.md),
and report vulnerabilities privately as described in the
[security policy](https://github.com/FantasticDevHQ/.github/blob/main/SECURITY.md).

Source development needs Node.js 22 or newer. There is no package manager step:
the checks use only Node.js built-ins, so no dependency install is needed.

```sh
node scripts/check.mjs   # skill frontmatter and listing validation, plus PR standard tests
```

Follow [AGENTS.md](AGENTS.md) for skill rules. Pull requests follow the
[PR standard](docs/pull-request-standard.md).

## Credits

The orchestration patterns are informed by Theo's [tstack](https://github.com/t3dotgg/tstack) skills (MIT). Everything here is written independently and has no dependency on tstack.

## License

[MIT](LICENSE), Copyright (c) 2026 Kelly Kampen.
