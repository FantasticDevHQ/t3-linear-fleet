---
name: fleet-models
description: "Classify the user's favorite models in T3 Code once, so the fleet can give each ticket the right model. Reads the favorites from T3 Code's settings, proposes a rating for each model (intelligence, taste, cost, best use) as helpful defaults, asks the user to confirm or edit them in one question, saves the result, and asks again only about favorites that were added since. Also holds the rule for choosing a model for a ticket. Use when fleet-plan or fleet-run needs a model, when the user changes their favorite models, or when the user asks to classify, rate, or review their models."
metadata:
  author: kellykampen
  version: "1.3.0"
---

# Fleet Models

The fleet gives each ticket a model and an effort level. This skill decides **which models are candidates** and **how good each one is at what**, using the user's own judgment, asked once. `fleet-plan` uses it to fill every ticket's Fleet section. `fleet-run` uses it to replace a model that is not available.

## Where things live

- **Favorites:** T3 Code's settings file, `settings.json` in T3 Code's user data folder (usually `~/.t3/userdata/settings.json`). Its `favorites` field is a list of `{provider, model}`. Read it; never write to it. The user changes favorites in T3 Code.
- **Classification:** `~/.config/t3-linear-fleet/models.json` (use `$XDG_CONFIG_HOME/t3-linear-fleet/models.json` when that variable is set). This skill owns the file. It is the user's judgment, so keep it across runs and never overwrite a rating the user gave without asking.

```json
{
  "version": 1,
  "models": [
    {
      "model": "<model ID exactly as T3 Code lists it>",
      "providers": ["<provider instance IDs that offer it>"],
      "intelligence": 8,
      "taste": 7,
      "cost": 5,
      "bestFor": "<one line, for example: everyday implementation and review>",
      "favorite": true,
      "classified": "2026-11-21"
    }
  ],
  "providerNotes": {
    "<provider instance ID>": {
      "avoid": "<optional: ticket kinds this provider does badly, for example: long UI tickets with remote end-to-end runs>",
      "budget": "<optional: a spending or quota cap, for example: $10 per month>",
      "noted": "2026-11-23"
    }
  }
}
```

One entry per model ID, even when several providers offer the same model.

**Replaced models.** The user may keep a model as a T3 Code favorite but not want the fleet to use it. Its entry then carries `"replacedBy": {"model": "<model ID>", "effort": "<low|medium|high|xhigh|max>"}`. A replaced model never runs. Rank and choose exactly as if it were an ordinary candidate; whenever it would be used, use the replacement model at the replacement effort instead. That covers a ticket choice in planning, a ticket's Fleet section that names it, a reviewer choice, and a closest-replacement pick. When the replacement wins on its own ratings, use the effort the choosing rule gives. After substituting, check the replacement against the same limits as the original choice: an eligible machine for a ticket, and a provider that wrote none of the PR's commits for a reviewer. If it fails them, skip that choice and take the next candidate by the same rule; if none is left, stop and report it as that rule says. The replacement must itself be a classified favorite; if it is not available, choose the closest candidate to the replacement. Keep the replaced model's ratings and `favorite` value as they are. Set `replacedBy` only when the user asks, and remove it only when they ask.

**Provider notes.** `providerNotes` is optional and records what ratings cannot: how a provider behaves in a fleet. An `avoid` note takes that provider out of the candidates for matching tickets, as an implementer, not as a reviewer. A `budget` note means the provider can run out mid-run: `fleet-run` makes one cheap call to it before relying on it, and drops it for the rest of the run when it runs out. `fleet-run` proposes notes from what it saw in its final report; save one only when the user confirms it, and remove one only when they ask.

## The scale

Every rating is 1 to 9, and **higher is always better**, including cost:

| Score | Intelligence | Taste | Cost |
| --- | --- | --- | --- |
| 9 | Trust it unsupervised on the hardest problems | Expert design, copy, and API judgment | Nearly free; use it freely |
| 7–8 | Reliable on complex, multi-step work | Good; safe for most user-facing work (7 is the floor) | Cheap; fine for everyday work |
| 5–6 | Solid on well-specified work | Serviceable but generic | Noticeably priced |
| 3–4 | Routine tasks only | Below the bar for anything users see | Expensive; burns real quota |
| 1–2 | Trivial, known-answer work | Mechanical output only | Very expensive; only for what nothing else can do |

## Step 1: Sync

1. Read the favorites from the settings file. They alone decide `favorite: true` or `false`; provider availability does not.
2. Read the classification file. If it does not exist, every favorite is new. If it cannot be parsed, or an entry lacks a model ID or has a rating outside 1 to 9, report the problem and the file's path, and treat the broken entries (or the whole file) as unclassified for now. Planning and setup may offer to reclassify in their question batch; `fleet-run` never asks and never writes the file. **Before saving over a broken file, copy it** to `models.json.broken-<date>` next to it, then write a valid file that keeps every valid entry and adds the new answers.
3. Compare, by model ID:
   - **Favorites to classify:** those with no entry yet, and those whose entry is broken (step 2).
   - **Removed favorites** get `"favorite": false`. Keep their ratings in case they come back.
   - A removed favorite that returns gets `"favorite": true` with its old ratings.
   - Set each entry's `providers` to the providers the settings list for that model; when the same model is a favorite under several providers, list them all.
4. **Candidates for this run** are the favorites that are classified and offered by a usable provider in `orchestrator_capabilities` (when it is available). A favorite whose provider is disabled stays a favorite in the file; it is just not a candidate today.
5. If no favorite needs classifying, you are done. Do not ask anything.

**If there are no candidates** (no favorites, or none of them is classified and offered by a usable provider), say why, and use every model `orchestrator_capabilities` lists as candidates for this run, without saving them, except models the classification file marks as replaced (substitute those as above). If no model remains, stop and report it. Without ratings, choose among them by your own judgment of each model's intelligence, taste, and cost, in that order, and say so in the ticket's `Why`.

## Step 2: Classify new or broken entries (once)

1. **Propose defaults** for each new model: intelligence, taste, cost, and a one-line best use. Base them on what you know about the model and its family, its public pricing, and the provider's quota. Say plainly which ratings are guesses.
2. **Show one table** of the new models with your defaults, and the existing ones for context.
3. **Ask once** through your harness's question tool (`AskUserQuestion`, `request_user_input`, or similar): accept the defaults, or give changes in the notes (for example "Opus taste 9, Luna cost 7"). When another skill is about to ask a batch of questions anyway (such as `fleet-plan` Step 5), put this question in that batch instead of asking separately.
4. Save the answers to the classification file with today's date, then read the file back.

When the user asks to reclassify, show every favorite with its current ratings and ask the same way.

## Choosing a model for a ticket

Candidates are the classified favorites that the run can reach. Choose by the ticket's needs, weighing **intelligence first, then taste, then cost**:

| Ticket | Choose | Effort |
| --- | --- | --- |
| Mechanical and fully specified (config, triggers, renames, copy changes) | The highest cost score with intelligence 6 or more | `low` or `medium` |
| Ordinary implementation | Intelligence 7 or more, then the highest cost score | `medium` |
| User-facing UI, copy, or API design | Taste 7 or more, then the highest intelligence | `medium` or `high` |
| `t3-fleet-foundation`, `t3-fleet-risky`, or novel work | The highest intelligence, then taste | `high` or `xhigh` |
| Being wrong is expensive and hard to detect (money, security, permanent data) | The highest intelligence | `xhigh` or `max` |

**No candidate meets the bar** (for example, none has taste 7 or more): choose the best candidate on that row's first measure, say so in `Why` (for example "best available taste is 6"), and continue. Never stop planning for it.

**Ties:** spread tickets across providers so one rate limit cannot stall the run: prefer the provider with fewer tickets chosen so far, then the model ID that sorts first. Write the reason in the ticket's `Why` line.

**Choosing a reviewer** (for `fleet-review`): only candidates from a provider that wrote none of the PR's commits.

| Review | Choose | Effort |
| --- | --- | --- |
| Ordinary ticket | Intelligence 7 or more, then the highest cost score | `medium` |
| `t3-fleet-risky` ticket, or the whole feature | The highest intelligence, then taste | `high` |

If no eligible candidate has intelligence 7 or more, use the highest one there is and note it in the review's evidence. **Ties:** prefer the provider with fewer reviews in this run, then the model ID that sorts first. **Without ratings:** rank eligible models by your own judgment of intelligence, then cost, apply the same rule, and say so in the review's evidence.

**Orchestrator fallback** (for `fleet-run`, when the orchestrator's own provider hits a limit): the model the run request names, else the closest replacement for the orchestrator's model from another provider.

**Closest replacement** (for `fleet-run`, when a ticket's model is not available): the available candidate with the smallest difference in intelligence, then in taste, then the same tie rule. If the missing model has no ratings, judge its strength from its family and tier, and pick the candidate closest to that.

## Never

- Write to T3 Code's settings file.
- Change a rating, a replacement, or a provider note the user set without asking.
- Ask about models that are already classified, unless the user asks to reclassify.
- Ask in the middle of a `fleet-run`. During a run, unclassified favorites are not candidates; list them in the run's final report instead.
