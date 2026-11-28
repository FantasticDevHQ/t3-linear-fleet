# Repository instructions

This repo is a skill set. It has no app, backend, build step, or dev services.

## Rules for skills in this repo

- **Self-contained.** Every skill is written here, in this repo's own words. Do not wrap, call, or depend on skills from other collections. Borrowing ideas is fine. Do not reuse another collection's skill names (for example tstack's `council`, `full-send`, `sol-loop`, `babysit-pr`, `takeover`); pick distinct names.
- **Agnostic about personal tooling.** Linear and T3 Code are supported dependencies. Do not hard-code a specific secrets manager, cloud provider, machine list, or model ID. Refer to "the project's secrets manager" and to the user's `fleet.config`. Discover models at runtime.
- **Small and plain.** Prefer the shortest instruction that changes agent behavior. No speculative options or features. Skills must practice the anti-over-engineering rules they teach.
- **One skill per folder** under `skills/<name>/` with a `SKILL.md`, plus `references/` and `evals/` only when needed. Register every skill in `.claude-plugin/plugin.json` and the README table. In the same PR as any skill change, update that skill's README row: its version (checked by `scripts/validate-skills.mjs`) and its one-line description.

## Checks, CI, and PRs

- Run `node scripts/check.mjs` (Node.js 22 or newer, no install). It validates skill frontmatter and listings and runs the PR standard tests.
- Follow `docs/pull-request-standard.md`: a Conventional Commit PR title (ticket ID optional), a Summary that supplies ticket linkage for commits and declares any ticket explicitly named by a commit, the five ordered sections, real evidence, and the actual agent/session identity. Evidence belongs in the PR, never in the repo.
- CI runs on `ubicloud-standard-2-ubuntu-2404`. The PR standard workflow executes trusted base code only; never check out the PR head with write permissions.
- The README follows the Fantastic.Dev header and Quick start standard. Keep `assets/fantastic-dev-logo.svg` byte-identical (SHA-256 `4869b13bae195ef7f934fb3a1dd2b37e86700ce33bf88f9c863e7597e20c2075`). Keep only project-fact badges that are verifiable from the public repo (CI status and license).

## Changes

- Never reset, stash, or discard user changes.
- Keep `CHANGELOG.md` updated for user-visible skill changes.
