# Evidence packet template

Write this into the feature PR description, inside the repository's PR format: use `###` subheadings inside its Evidence section, and never add top-level headings the format does not define. Order matters: the human should be able to verify the core behavior and every consequential decision in about five minutes.

```markdown
### 1. See it work
User-facing feature:
- Video: <recording of the definition of done, end to end, on the preview deploy, made by an agent that did not write the code>
- Preview: <preview deploy URL>

Backend feature:
- <fenced command, API, or test transcripts that prove each part of the definition of done>

- Reviewed head: <sha> (all evidence was captured on this head)

### 2. Decisions made for you
| Decision | Reason | Ticket |
| --- | --- | --- |
| <user-visible, data, or contract decision> | <one line> | <ENG-…> |

Product-rule decisions (limits, caps, prices, user-facing steps) are listed here for the user to confirm, even when a ticket implemented them.

### 3. Deviations and surprises
- <anything that differs from the intent brief or a ticket, and why>
- <requirements or findings moved between tickets, with the user's approval>
- <commits written by the orchestrator, and who reviewed them>
- <flows blocked by a known ticket: "expected: blocked by <ticket>">
- <known limitations>
(Write "None." only if it is true. State a cause only when you verified it.)

### 4. Test integrity
- Foundation (Wave 0) test changes since the foundation merged: <`git diff <foundation-sha>..<head> -- <test paths>` summary, or "none">
- Each changed or removed test, with its recorded reason.
- Quarantined flaky tests: <list, or "none">

<details>
<summary>5. Acceptance criteria → proof</summary>

| Ticket | AC | REQ | Verify | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| ENG-… | AC-1 | REQ-001 | <test or check> | pass | <CI link, screenshot> |

</details>

<details>
<summary>6. CI and review</summary>

- Full CI on the feature + latest default branch: <link>
- Feature review: <rounds> rounds with <reviewer model>, verdict <APPROVE / stopped: reason>; fixed / declined findings with reasons.
- Fallback reviewers: <where a preferred reviewer model was replaced, by which model, and why; or "none">
- Known red checks that do not block: <check, why it is red, what clears it; or "none">
- Review-bot threads: all resolved or dismissed with reasons.
- Ticket PRs: <list with links>

</details>

### Release checks (after merge, non-blocking)
- <copied from the intent brief>
```

Publish screenshots and recordings with the GitHub CLI, never a browser: put `![alt](./file.png)` on the labeled line, then run `gh pr edit <n> --body-file body.md --attach './file.png#alt'`. `gh` uploads the file and rewrites the reference.

Never write a result you did not observe. If a piece of evidence is missing, say so in section 3. Evidence from separate runs never proves a criterion that asks for one run.
