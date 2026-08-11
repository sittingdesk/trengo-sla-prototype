# SLA prototype — latest changes (for the hand-off deck)

Companion to the existing hand-offs (`HANDOFF-sla-page.md`, `resolution-by-type-handoff.md`).
Focus here is **logic and definitions** of the two most recent changes, ready to fold into the
presentation. All analytics numbers in the prototype are **illustrative mock data** — there is
no runtime SLA clock; this surface only *shows* and *configures*, it does not measure.

---

## 1. First-response metric simplified → "First response (incl. AI)"

### What changed
The first-response target is reframed from **"First human response"** to **"First response"** —
satisfied by the **first reply of any kind, including an AI Agent**.

### Definition (new)
> **First response** — time from the incoming message until the first reply, **whether that
> reply comes from an AI Agent or a person**. The clock starts at creation and stops on the
> first reply, either way.

Previously ("First human response"): the clock stopped **only** when a *human* replied; AI time
before the human was counted but did not stop the clock.

### Why (logic + rationale)
- **Unblocks reporting.** Measuring "first *human* response" requires the data pipeline to
  distinguish a human reply from a bot reply, and — for hand-off pickup — an "AI handed off to
  human" event **that does not exist in the registry yet**. "First response (incl. AI)" needs
  none of that: any reply stops the clock.
- **Zero-migration.** The codebase never had a human-vs-AI branch — the distinction was purely
  wording. Nothing in the data model or logic changes; only copy.
- **Reversible by design.** "First human response" stays the documented **V1.1 upgrade**; the
  data model already reserved a per-policy "satisfied by" slot so it can return with no migration.

### Trade-off to state explicitly
If a channel runs a **canned auto-acknowledgment** ("Thanks, we got your message"), the metric
collapses toward ~0 and stops being a meaningful promise. This definition is sound **only where
the AI gives a genuine reply**, not an instant autoresponder. Flag this as the definition the
data team implements.

### Scope
Applied to **Iteration 2 only**. Iteration 1 deliberately keeps "First human response" for a
side-by-side comparison. Copy touched: the editor row label + description, the ⓘ tooltip, the
overview scope line ("reply within Nh"), and the plain-terms summary ("get a first response
within…").

---

## 2. SLA analytics preview (new)

A large modal opened from the rail's pie-chart ("Reports") icon — a **preview of the insights
SLA policies unlock**. Available in both iterations. Three sections, each shown with its
definition. This is the on-screen realisation of the dashboard widgets tracked for the data
team; the definitions below are the "how it's measured" contract.

### Section 1 — SLA compliance (headline)
- **Shows:** an overall compliance ring + "X of Y conversations met their SLA."
- **Definition:**
  > **SLA compliance = met ÷ measured, judged strictly** — every *enabled* target on a
  > conversation must pass, or the whole conversation counts as a miss. **AI-only** and
  > **no-policy** conversations are **excluded** from the measured total (the denominator).
- **Logic notes:** "strict" means one failing target fails the whole conversation. The
  denominator is conversations with ≥1 applicable target; AI-only conversations enter only via
  the resolution target (they have no first-response obligation).

### Section 2 — Resolution by custom field
- **Shows:** resolution compliance per **custom-field value** (e.g. Topic → Invoices, Contract
  changes, Complaints, …), each with its own target and a compliance bar; a default row for
  "All other conversations"; values below threshold are flagged (amber).
- **Definition:**
  > **Resolution compliance per custom-field value**, with each conversation judged against
  > **its own** resolution target. Surfaces *which type of work* misses its promise — not just
  > which channel.
- **Logic notes:** this is the insight the resolution-by-custom-field feature unlocks (see
  `resolution-by-type-handoff.md`). A ticket's single-select field value maps 1:1 to one target
  row (implicit "Equals", topmost-match-wins); anything unmatched uses the policy default. Only
  values that actually carry a target appear; the default catches the rest.

### Section 3 — SLA compliance per channel
- **Shows:** a table — Channel · Resolution time · First response time · SLA compliance ·
  Closed tickets · Open tickets — sorted **worst compliance first**; the compliance cell is a
  green pill (amber below threshold).
- **Definition:**
  > **Compliance per channel, worst first.** Resolution and first-response times are **medians**
  > over the period; closed/open are **ticket volumes**. Channel volumes sum to the measured total.
- **Logic notes:** "worst first" is deliberate — it's the operational signal (which channel to
  fix). Uses the same compliance definition as §1, sliced by channel.

### What is NOT in this preview (still data-team / backend work)
Consistent with the earlier dashboard tracking, these remain out of the prototype:
- **"Currently at risk"** (open conversations past a warn threshold) — needs a per-policy
  **warn-before-breach** field (not yet in the editor) and live open-conversation state.
- **Label/custom-field applied & removed events** (timestamped) — needed for mid-flight
  re-scope and to audit which target was in effect.
- **Target-in-effect snapshot at close** — for the verdict + policy versioning.
- **Business-hours agreement** — reporting counts wall-clock today; the timer and dashboard
  must agree on frozen time.
- **Trend bucketing** — count a conversation in the week it was created vs. resolved (open).

---

## One-line summary for a slide
> First response now counts **any** first reply (AI included) — simpler and buildable today,
> with "first human response" kept as the V1.1 upgrade. A new **SLA analytics preview** shows
> three views — overall compliance, resolution **by custom-field value**, and compliance **per
> channel** — each with the exact definition the data team will implement.
