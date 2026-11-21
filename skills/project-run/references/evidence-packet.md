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

### 3. Deviations and surprises
- <anything that differs from the intent brief or a ticket, and why>
- <known limitations>
(Write "None." only if it is true.)

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
- Review-bot threads: all resolved or dismissed with reasons.
- Ticket PRs: <list with links>

</details>

### Release checks (after merge, non-blocking)
- <copied from the intent brief>
```

Never write a result you did not observe. If a piece of evidence is missing, say so in section 3.
