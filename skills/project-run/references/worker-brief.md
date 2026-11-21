# Worker brief

Build every worker `task` from this template. The worker starts with no history and may not have this skill set installed, so the brief carries the whole contract:

1. Fill in the header below. Paste the intent brief, Decisions, and ticket in full; do not send links only.
2. Add the attempt block that matches the attempt (fix task or takeover), if any.
3. Append the full text of `ticket-worker/SKILL.md` from this skill set, without its frontmatter, as the contract. Do not paraphrase it; one canonical copy keeps every worker on the same rules.

## Header

```text
You are a worker agent for ONE Linear ticket, in ONE task. Follow the
ticket-worker contract appended below exactly. Nobody will answer questions.

Repository: <clone URL>   Integration branch (PR target): <feat/project-slug>
Ticket: <ENG-123> <title>   Linear branch name: <branch name from Linear>
Attempt: <first attempt | fix task n of <budget> | takeover>
Your identity for the PR's Agent section: <agent and model>, thread <child thread ID if known, else "see T3">
UI evidence publishing: <GitHub attachments via authenticated browser | CI artifacts from job <name> | not needed>

INTENT BRIEF:
<full intent brief>

DECISIONS (settled; do not re-decide):
<full Decisions section>

TICKET:
<full ticket: outcome, requirements, scope and decisions, non-goals,
acceptance criteria with Verify and Evidence lines>
```

## Fix task block

```text
FIX TASK on an existing PR: <PR URL>, branch <branch>.
Fix only this: <failing check and log link | conflict | accepted review findings with IDs>
Previous summary: <the last worker's summary>
Continue the existing branch (fetch, detach at origin/<branch>, push HEAD:<branch>).
```

## Takeover block

```text
TAKEOVER. The previous agent could not finish.
Branch: <branch>   PR: <PR URL or none>
What it tried and why it stopped: <summary and blocker>
Treat this as context, not proof. Verify the current code and checks yourself.
Continue the existing branch and keep the earlier commits.
```

## Escalation answer block

Use this, with the first-attempt or fix-task form, to continue a ticket after an escalation is answered:

```text
ESCALATION ANSWERED for <ENG-123>: <the decision, as recorded in Decisions>
Continue the existing branch <branch> from where the last attempt stopped.
```
