# Repository instructions

This repo is a skill set. It has no app, backend, build step, or dev services.

## Rules for skills in this repo

- **Self-contained.** Every skill is written here, in this repo's own words. Do not wrap, call, or depend on skills from other collections. Borrowing ideas is fine.
- **Agnostic about personal tooling.** Linear and T3 Code are supported dependencies. Do not hard-code a specific secrets manager, cloud provider, machine list, or model ID. Refer to "the project's secrets manager" and to the user's `fleet.config`. Discover models at runtime.
- **Small and plain.** Prefer the shortest instruction that changes agent behavior. No speculative options or features. Skills must practice the anti-over-engineering rules they teach.
- **One skill per folder** under `skills/<name>/` with a `SKILL.md`, plus `references/` and `evals/` only when needed. Register every skill in `.claude-plugin/plugin.json` and the README table.

## Changes

- Never reset, stash, or discard user changes.
- Keep `CHANGELOG.md` updated for user-visible skill changes.
