# Trengo SLA — prototype, decisions and trade-offs

A complete record of what we built, what we decided, and what we deliberately
left open. Written to be read by someone joining cold.

- **Repo:** `github.com/sittingdesk/trengo-sla-prototype`
- **Live:** https://sittingdesk.github.io/trengo-sla-prototype/ (opens on Iteration 3)
- **Stack:** Vue 3 + TypeScript, Tailwind v4 (CSS-first `@theme`), shadcn-vue (reka-ui).
  Builds to a **single self-contained `dist/index.html`** — opens by double-click, works offline.
- **Sibling:** `../SLA-Inbox` — the agent-facing half (scaffolded, not built).

---

## 1. What this is

A settings prototype for **service level agreements**: an admin sets response-time
promises per channel, and analytics show which promises are being kept.

The one-liner:

> Set response-time promises per channel, vary them by topic, and see exactly where
> they're missed — by channel, team or agent.

**Important:** there is **no runtime SLA clock**. The prototype *configures* targets and
*shows* what analytics could look like. Every number in the analytics is hand-picked mock
data. Nothing measures anything.

### Three iterations, side by side

The app ships all three at once, switchable bottom-right. They are **fully independent**
copies (own components, store, data, `localStorage` key) so each can diverge without
breaking the others.

| | Model | Storage key |
|---|---|---|
| **Iteration 1** | One policy per channel, bundling a first-response **and** a resolution target | `trengo_sla_policies` |
| **Iteration 2** | Same bundle, but resolution can **vary by a custom field value** | `trengo_sla_policies_v2` |
| **Iteration 3** | **Typed SLAs** — each SLA is *either* first response *or* resolution | `trengo_sla_policies_v3` |

Iteration 3 is the current direction and the default view.

---

## 2. The model

### The clocks

| Metric | Definition | Status |
|---|---|---|
| **First response** | Incoming message → first reply. **Any** reply stops it — AI Agent or person. | Live |
| **Resolution** | Creation → final close. Any proper close counts, **including an AI close**. A close that reopens within 24h is voided. | Live |
| **Hand-off pickup** | AI hand-off → a human picks the conversation up. Dashboard-only, no target. | Not built — needs a hand-off event that doesn't exist in the registry |

### How it's judged

- **SLA compliance = met ÷ measured, strict.** Every target that applies to a conversation
  must pass, or the whole conversation counts as a miss.
- **Denominator:** conversations with at least one applicable SLA. Only **no-policy**
  conversations are excluded.
- **Counted time** pauses while waiting on the customer, while closed pending a reopen, and
  outside business hours. Business hours are **per channel**; no schedule = 24/7.
- **Coverage:** whether every channel is claimed by an active SLA. In Iteration 3 this is
  **per type** — a channel can be covered for first response but not resolution.

### When the custom field is set later

A ticket's custom field is often set *after* the conversation starts, manually or by a rule.

- The conversation switches to that value's target as soon as the field is set.
- **The clock is never reset — it always runs from when the conversation started.**
- Change or clear the field → falls back to the next matching value, or the default.
- Set it after close → nothing changes; the result is already decided.

---

## 3. Product decisions (and why)

### First response counts AI replies

**Decision:** any first reply satisfies the target — AI Agent or person.

**Why:** the customer got an answer; who sent it doesn't change their wait. Critically, it's
**buildable today** — measuring "first *human* response" needs a human-vs-bot distinction
in the pipeline that doesn't exist yet, plus a hand-off event for the related metric.

**Trade-off, stated plainly:** if a workspace runs a canned auto-acknowledgment, the metric
collapses toward zero and becomes a vanity number. We handle the common case by **filtering
on sender type** — auto-replies are a distinct message type and don't count; humans and AI
Agents do. No text analysis, no guessing.

**The honest edge case:** an AI Agent configured only to say "an agent will be with you"
*would* still count. We can't detect substance. If that becomes real, the fix is
product-side (an intake mode whose messages don't count), not metric-side.

**Deferred:** "first human response" remains the obvious upgrade — the data model reserves a
per-policy "satisfied by" slot so it can ship with zero migration. It is **not** in the
prototype; too much is still TBD to imply a version roadmap.

### Resolution varies by custom field, not by label

**Decision:** resolution targets are scoped by a **single-select custom ticket field**
(e.g. Topic → Invoices 48h), not by labels.

**Why:** labels work but add **inbox noise** (a chip on every conversation) and are
many-per-ticket, which creates ordering ambiguity. A single-select custom field is **one
structured value per ticket** — a clean 1:1 with target rows — and it's quiet in the inbox.
Verified against the Trengo codebase: `CustomField` (type=TICKET, field_type=DROPDOWN) is
already usable as a rule condition.

**Backend caveat (noted, not blocking):** custom fields have no multi-select and no `IN`
operator. Irrelevant here — each row is one value, i.e. `EQUALS`.

### A mandatory default row

Every resolution SLA has an irremovable **"All other conversations"** row.

**Why:** it guarantees coverage. This deliberately avoids Zendesk's documented failure mode
where "no priority set" means "no SLA at all".

### Picking a field auto-lists all its values

**Problem raised in review:** after choosing "Topic" you still had to add each value
manually via a faint "Add value" link — easy to miss, and it's the very next thing you want.

**Decision:** selecting a field immediately lists **every** option value, pre-filled at the
default. You edit the ones that differ and remove the rest.

**Consequence we had to handle:** auto-filled rows all equal the default at first, which
would make the summary and overview list every value redundantly. So derived sentences
**only count rows that differ from the default** — a row equal to the default is a no-op.

### Separate SLA types (Iteration 3)

**Decision:** an SLA is a single type. You **choose the type first**, then set name,
channels, conditions and target.

**Why:** the type is the one decision that reframes everything after it — the two types
don't share conditions or targets. Asking first is correct progressive disclosure, it lets
each form show only relevant fields, and it leaves room for future types (hand-off pickup)
without cramming.

**What it costs — and how we paid it:**

| Cost | Mitigation |
|---|---|
| Coverage is no longer one yes/no per channel | Coverage is computed **per type**; the overview shows both gaps in one banner |
| "One policy per channel" guarantee weakens | Replaced with **per-type exclusivity**: one active SLA of each type per channel |
| More objects to manage (SMB overhead) | One merged list, type shown per row; no per-section chrome |

### Per-channel exclusivity

**Iterations 1–2:** one channel belongs to exactly one active policy — a hard save block.
**Iteration 3:** one active SLA **of each type** per channel.

The channel picker disables channels already taken, and activation re-checks on toggle (the
editor only validates on save, so without it an inactive SLA could silently claim a channel).

---

## 4. UX trade-offs we took a side on

**Disable, don't hide.** When a target is switched off, its inputs stay visible but greyed
rather than disappearing. Hiding collapsed the row (layout jump) and made the entered value
feel discarded.

**Make the invalid state unreachable, don't error.** At least one target is required. Rather
than let you turn both off and *then* show a red message, the last enabled toggle is
**disabled**. The error copy became unnecessary and was deleted.

**Guard destructive actions properly.** Delete moved from a hover-only trash icon with a
two-step "Delete?" to a **kebab menu + confirmation dialog** that names the policy *and* its
coverage impact ("Conversations on Info email will no longer have an SLA"). The old pattern
was easy to double-click by accident and never told you what you were losing.

**One list beats two sections.** The Iteration-3 overview initially split into "First
response" and "Resolution" sections, each with a header, coverage banner and add-link. That
was a lot of chrome for four rows. Now: **one list**, type shown per row via an icon
thumbnail, one combined coverage banner.

**Icon + description beats a badge.** Rows briefly carried a type pill *and* an icon *and*
often the type in the name — three signals for one attribute. The pill went; the description
now leads with the type ("Resolution for Info email · within 24h +2 by type · business hours")
and drops the redundant verb.

**Cap the channel list, don't truncate the promise.** Long channel lists pushed the target
off the end of the row. The row now names **2 channels, then "+N more"** — a fixed cap, not
measured truncation, so rows look identical on every screen (important for screenshots and
presentations). The editor summary and dialogs still name every channel.

**Prototype affordances are labelled as such.** The iteration switcher, view-mode switcher
(Normal/Loading/Empty) and custom-fields On/Off toggle are demo controls, parked
bottom-right, visually distinct from the product.

### Things we removed on purpose

- **The compliance metric on the settings page** — settings is for configuring, not reporting.
- **A fallback/catch-all policy** — coverage gaps are surfaced honestly instead.
- **Teams as a scoping dimension** — "team" is a reporting grouping, not an SLA scope.
- **Group headings in the channel picker** — the channel names are self-describing.
- **Version badges (V1 / V1.1)** in the explainer — too much is still TBD to imply a roadmap.

---

## 5. Analytics decisions

### Compliance is per type, not one blended number

Splitting SLAs by type broke the old bundled definition ("every enabled target on a
conversation"), because a conversation's targets now live in separate objects.

**Decision:** lead with **per-type compliance** (First response 94% · Resolution 89%). A
strict per-conversation composite ("all SLAs met") is available as a clearly-labelled
secondary. We rejected a **blended** headline — it averages a first-response breach and a
resolution breach as if they were the same thing.

### Speed and compliance are separate metric families

Each type shows a **compliance %** *and* a **median time**. They answer different questions
and can diverge — you can be fast on average and still miss the tail. Medians, not means,
and every number is paired with its volume so a small channel's "100%" isn't over-read.

### The AI-vs-human toggle is a reporting lens

A toggle switches first-response figures between **Incl. AI** and **Human only**. It changes
*reporting*, never configuration. In the mock data it moves compliance 94% → 82% and the
median 2m 40s → 38m 12s — making the auto-acknowledgment risk visible instead of hidden.

**For the future dashboard:** the basis is a **definition parameter, not a filter**, and it
only touches first-response tiles. So it belongs to **each tile's config** (shown in the
tile's title), **not** a global switch. This also dissolves the "what if there are no SLA
metrics on the dashboard?" problem — with no first-response tile there's no control to show
or hide. Every first-response view in the prototype labels its active basis to model this.

### Distribution, not just a pass rate

Borrowed from a customer's own dashboard: a stacked bar bucketing conversations by how long
they took — **relative to each SLA's target** (≤ target · 1–2× · 2–4× · > 4×), not fixed
hours, so it stays meaningful across policies. A compliance % can't tell you whether misses
are narrow or catastrophic; this can.

That customer's chart also gave us the sharpest phrasing of the AI question — *"the bot
counts, auto-replies don't"* — which is now our definition.

### By-topic for first response is descriptive, not a promise

First response has **one** target for all conversations. Breaking its results down by topic
shows *where responses are slow*; it is **not** a set of per-topic promises. Labelled as such
so nobody misreads it.

### Per-agent has an unresolved conceptual problem — flagged

In the per-agent table, "Incl. AI" first response is essentially *"the AI was fast on this
agent's tickets"* — an AI reply can't be attributed to a person. Only the **human-only**
column genuinely reflects an agent. The right long-term metric for agent responsiveness is
**hand-off pickup time**. **Status: raised, not yet resolved in the prototype.**

### GDPR

The per-agent table is people-performance data on identifiable individuals. The prototype
uses **fictional agents with initials-only avatars** and carries a note that real per-agent
reporting needs access controls and aggregation thresholds.

---

## 6. In-app documentation

- **Rail Help (?) → "How SLAs work"** — an accordion reference: the clocks (first response,
  resolution, the custom-field-set-later rule, hand-off pickup) and how compliance, counted
  time and coverage are judged. Several entries carry a ✓ *Counts* / ✕ *Doesn't count* pair.
- **Rail pie-chart → SLA analytics** — the analytics preview (per-type in Iteration 3).
- **ⓘ tooltips** on the editor's target rows.

Content lives in `src/data/slaExplainers.ts`, structured so the scattered tooltips could
later read from it as a single source.

---

## 7. Open items — mostly for the data team

| Item | Why it matters |
|---|---|
| **Business-hours measurement** | Reporting counts wall-clock today; the timer and the dashboard must agree on frozen time |
| **Custom-field applied/removed events, timestamped** | Needed to audit which target was in effect, and for mid-flight re-scope |
| **Target-in-effect snapshot at close** | The verdict is judged at final close; also serves policy versioning |
| **Auto-reply message-type flag** | The whole "substantive reply vs auto-ack" definition depends on it being queryable |
| **Warn-before-breach threshold** | Required for a "currently at risk" view; not in the editor |
| **Hand-off event** | Blocks hand-off pickup time entirely |
| **Trend bucketing** | Count a conversation in the week it was created, or resolved? |
| **Reminder-driven closes** | The reminder feature closes then reopens; needs a flag to exclude |
| **Forward-only policy changes** | Turning a target off shouldn't retroactively recompute history |

**Not built, deliberately:** the "Currently at risk" widget, the data pipeline, and any
runtime SLA clock.

---

## 8. Repo map

```
src/
  components/
    sla/         Iteration 1   sla-v2/  Iteration 2   sla-v3/  Iteration 3
    analytics/   analytics modals, explainer modal, donut, distribution
    ui/          shadcn-vue primitives      rail/  portable icon rail
  composables/   useSlaPolicies{,V2,V3}, useSlaNav{,V2,V3}, useIteration, useViewMode
  data/          slaData{,V2,V3}, slaAnalytics{V2,V3}, slaExplainers
  lib/           sla{,V2,V3}.ts — pure logic: sentences, coverage, validation
```

Each iteration's `lib/` holds all derived text and rules, so the overview and editor can't
drift apart.

### Related documents

- `sla-latest-changes-handoff.md` — the first-response change + analytics definitions
- `design.md` — design tokens (the source of truth for all styling)
- `CLAUDE.md` — working rules for this repo
- `../SLA-Inbox` — the agent-facing prototype (scaffolded, empty)
