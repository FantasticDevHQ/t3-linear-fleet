---
name: fleet-setup
description: "One-time setup and health check for the T3 Linear Fleet. Checks Linear access (Linear MCP or linear-cli), T3 Code's orchestration tools and providers, and the GitHub CLI; creates the t3-fleet label group at the right level of the Linear workspace; walks the user through Linear's GitHub automation (magic-word commit linking and branch rules); and classifies the user's favorite models with fleet-models. Safe to run again: it only fixes what is missing and ends with a ready or not-ready checklist. Use when the user installs the fleet, says set up or check the fleet, or when fleet-plan or project-run finds setup missing."
metadata:
  author: kellykampen
  version: "1.0.1"
---

# Fleet Setup

Get a user from "installed the skills" to "ready to plan and run" in one sitting, and check it again whenever something seems wrong. Every step first **checks**, then **fixes only what is missing**, then **reads back**. Running it twice changes nothing the second time.

Collect every question for the user and ask them **once**, through your harness's question tool, after the checks that need no answers. Never ask for an API key or token in chat.

This skill sets up the user's tools and Linear workspace. A repository's own readiness (CI on `feat/**`, previews) is checked per project by `project-refresh` and `project-run`.

## Step 1: Linear access

Check, in this order, and use the first that works:

1. **Linear MCP server** (`https://mcp.linear.app/mcp`), reached directly or through a tool host: a read such as listing teams succeeds.
2. **linear-cli** (https://github.com/nesszer/linear-cli): `linear-cli --version` works and a read succeeds.

If neither works, stop this step and tell the user how to connect one: add the Linear MCP server to their agent (https://linear.app/docs/mcp), or `cargo install linear-cli`, then `linear-cli setup`. Continue with the steps that do not need Linear, and mark Linear as not ready.

## Step 2: T3 Code and the GitHub CLI

- **T3 Code machines:** list linked machines with `t3_environment_links` and note which answer now. None is fine; the local machine runs everything.
- **Providers:** call `orchestrator_capabilities` on the local machine and on each machine that answers (pass its `environmentId`). Count the distinct providers that can run child tasks across those machines, and separately on the local machine alone. `project-run` needs at least **two** usable providers, because every review comes from a provider other than the writer's. `t3-fleet-local-only` tickets need two on the local machine. Fewer is a warning, not a failure: planning still works.
- **GitHub CLI:** `gh auth status` succeeds, and `gh pr edit --help` lists `--attach` (agents upload screenshots and recordings with it). If `--attach` is missing, tell the user to update `gh`.

## Step 3: The t3-fleet labels

The orchestrator schedules from one multi-select label group named **t3-fleet** with four labels:

| Label | Meaning |
| --- | --- |
| `t3-fleet-foundation` | Shared groundwork that other tickets build on; runs first |
| `t3-fleet-local-only` | Needs something only the user's local machine has |
| `t3-fleet-schema-change` | Changes the database schema after the foundation; runs one at a time |
| `t3-fleet-risky` | Security, auth, data, money, migrations, or concurrency; reviewed by another provider before merge |

1. **Read the hierarchy and labels, every page.** List teams and follow `parentId` to find the top-level teams. Read the label catalog with groups included, and each team's labels too; a plain read can miss labels inside another team's group. Follow pagination to the end of every list before you decide anything; never create on a partial read.
2. **Find the group by its labels too.** If the four labels exist under a group with another name (for example one created before the group was renamed), that group is the t3-fleet group: rename it to `t3-fleet` and read the name back. Never create a second group while the four labels exist.
3. **If the group exists,** check that it is multi-select, sits at the workspace or a top-level team, and is visible to every team that will run fleet projects (read each of those teams' labels). If all holds, add any missing labels to it, and it is ready. If not, report the exact conflict (for example "single-select" or "on team Ops, not inherited by Web") as **needs you**; do not create a second group.
4. **If it does not exist,** decide where it goes: the **workspace** when more than one top-level team may run fleet projects, or that **top-level team** when only its teams will. Ask if it is not clear from the hierarchy. Never put it on a team that has a parent.
5. **Create** the group (multi-select) and its four labels, then read them back as seen by one team below it.
6. **Name clash.** Linear label names are unique across the workspace and every team, ignoring case and group. If a create fails because a name exists, tell the user which team owns it. Do not rename another team's label without asking.

## Step 4: Linear's GitHub automation

The fleet links work through commits, not PR titles: every commit carries `Fixes ENG-123` or `Refs ENG-123`. Linear's API cannot change these settings, so check what you can and walk the user through the rest, once per team that will run fleet projects (Settings > Team > Workflows & automations):

1. **Link commits to issues with magic words** is on, and the GitHub push webhook Linear shows is added to the repositories.
2. **Branch rules:** a merge into `^feat/.*` moves the issue to an "Integrated" status (or "no action"), and a merge into the default branch moves it to Done.

Put both in the question batch as a checklist the user confirms. If the user cannot confirm, mark it not ready; `project-run` then checks Linear statuses after its first merge and corrects them by hand.

## Step 5: Models

Run `fleet-models`: it reads the user's favorite models from T3 Code's settings and asks the user to classify any that are new. Put its question into this skill's single batch.

## Step 6: Report

End with one checklist, each line **ready**, **fixed now**, or **needs you** (with the exact action):

```text
Linear access           ready (Linear MCP)
T3 Code providers       ready (3 providers can run child tasks)
GitHub CLI              ready (--attach available)
t3-fleet labels         fixed now (created at the workspace)
GitHub automation       needs you: turn on magic-word linking for team WEB
Models                  ready (5 favorites classified)
```

Say whether the fleet is **ready to plan** (Linear access) and **ready to run** (everything else).

## Never

- Ask for or accept a secret in chat.
- Rename, merge, or delete labels you did not create.
- Create the t3-fleet group on a team that has a parent.
- Write to T3 Code's settings file.
