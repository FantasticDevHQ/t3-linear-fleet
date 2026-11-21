# Linear notes for a refresh

Practical notes for reading and changing a large existing project through the Linear MCP server. They hold however you reach the server: connected to your agent directly, or through a tool host that runs code. With `linear-cli`, map the same ideas to its commands.

## Reading

- **Relations need two flags.** `get_issue` returns `relations` only with `includeRelations: true` **and** `"relations"` in `fields`. With only the flag, every ticket shows no links. If no ticket in a large project has a link, suspect the request.
- **Team hierarchy:** `list_teams` gives each team's parent as `parentId`. Follow it to the top-most parent before you decide where the `t3-fleet` group goes.
- **Fields differ by tool:** `list_issues` rejects some fields that `get_issue` accepts (for example `attachments`); ask `get_issue` for them.
- **Label catalog:** ask for groups too (`includeGroups: true`), follow every page, and also read each relevant team's labels with the team filter. A plain workspace read can miss labels inside another team's label group. A name-clash error on create is the final check.
- **Read in bulk where you can.** A project with 40 tickets means more than 80 reads (issue, comments, relations). If your harness or tool host can run a script, loop in one program and write the result to a file, then read only the parts you need. Tool hosts often cap the size of a program (for example 64 KB), so split large writes into chunks and record each chunk's result in its own file.
- **Run a write program once.** If a write's output is lost, read the state back from Linear before you run anything again. A second run creates duplicates. Make each write check first whether it already happened (an existing comment, a ticket with the same title).

## Writing

- **Patch, do not round-trip.** `save_issue` and `save_project` take `patch: [{op: "insert_after", anchor, text}, {op: "insert_before", anchor, text}, {op: "replace", old_string, new_string}, {op: "append", text}]`. Each anchor must occur exactly once in the current description. A description read through the API holds `<linear-image>` blocks with signed URLs; sending the whole description back writes those URLs again.
- **Every write can fail silently.** Renames, duplicate links, and related links have returned success without applying. Read every write back and compare.
- **Linear normalizes Markdown.** Nested `- ` bullets come back as `* `, ticket IDs can become mention tags, and the stored length changes. Read-back checks must match the meaning (for example `/^\s+[*-] Verify: /m`), not your exact input.
- **Labels:** use `addLabels` and `removeLabels`. `labels` replaces the whole set. Label names are unique across the workspace and every team, ignoring case and group.
- **Duplicates:** `save_issue` with `duplicateOf: "<survivor id>"`, after a comment that says why. It can return success without creating the relation, and Linear refuses the Duplicate state without one. Read the relation back; if it is missing, cancel the ticket with a comment that names the survivor. `relatedTo` has shown the same behavior; `blocks` and `blockedBy` have worked.
- **Relations:** `blocks`, `blockedBy`, and `relatedTo` add links; `removeBlocks`, `removeBlockedBy`, and `removeRelatedTo` remove them.
- **Old text first:** save the old description as a comment (`save_comment`), or as a project document (`save_document` with `project`) for the project description. Read it back in full before you patch the description.
