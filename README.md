# t3-linear-fleet

[A Fantastic.Dev Project](https://fantastic.dev)

[![license](https://img.shields.io/badge/license-MIT-blue?labelColor=333)](LICENSE)

> **Unofficial.** A skill set for running Linear projects with [T3 Code](https://github.com/pingdotgg/t3code). Not affiliated with T3 or its authors.

You plan a feature in Linear. A fleet of agents builds it in parallel across your machines and model providers, gets everything green, and hands you evidence to review. You don't have to babysit them.

## The workflow

1. **Plan (about 30 minutes, the only conversation).** The planner reads the codebase and writes an intent brief: problem, users, definition of done, non-goals, and decisions. It then asks you all of its questions in one batch, each with a recommended default. Tickets are few, describe what to build, and have acceptance criteria that can be proven inside the PR before merge.
2. **Execute (no human in the loop).** An orchestrator in T3 Code dispatches tickets as their blockers merge. Each worker gets its own checkout, on a local or a cloud machine, using whichever provider has capacity. Workers own their tickets until they are merged and green. Only costly or irreversible decisions are escalated, and those are batched.
3. **Review evidence (about 5 minutes).** You get a recording of the feature working on a preview deploy, the decisions and deviations, and a checklist linking each acceptance criterion to its proof. You merge.

## Skills

| Skill | Status | What it does |
| --- | --- | --- |
| [issue-breakdown](./skills/issue-breakdown/SKILL.md) | Copied from agent-skills. Rewrite in progress. | Turns a feature into a Linear project plus review-ready tickets. |
| project-run | Planned | Orchestrator: dispatch, load balancing across machines and providers, merge and freeze rules, escalation, evidence packet. |
| ticket-worker | Planned | The worker brief: intent, smallest change, proof, ownership through green. |
| pr-gate | Planned | Merge gate and PR event handling. |
| review-loop | Planned | Budgeted review by a different provider, with blocker / should / nit severity. |
| council | Planned | Optional review by several providers for large or risky work. |
| ticket-takeover | Planned | A fresh agent takes over a stuck ticket. |
| pr-writing | Planned | PR descriptions, evidence packets, and comment attribution. |

## Requirements

- [Linear](https://linear.app), through the Linear MCP or `linear-cli`.
- [T3 Code](https://github.com/pingdotgg/t3code) for orchestration across providers and machines.
- A secrets manager for your projects. The skills never assume which one.

## Install

```bash
npx skills@latest add FantasticDevHQ/t3-linear-fleet
```

## Credits

The orchestration patterns are informed by Theo's [tstack](https://github.com/t3dotgg/tstack) skills (MIT). Everything here is written independently and has no dependency on tstack.

## License

MIT
