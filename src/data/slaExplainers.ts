// SLA explainers — the consolidated "how it works" reference, shown in the
// rail-Help modal. Sample/prototype content lives here (CLAUDE.md rule 4).
//
// Source of truth for the model's definitions, drawn from the SLA hand-off's
// locked decisions + the analytics definitions. One reference across all
// iterations; items that only apply to the typed iterations (3, 4) are badged.

export type ExplainerBadge = 'Future'

export interface Explainer {
  id: string
  title: string
  /** Icon.vue name (verified present in `svg icons/`). */
  icon: string
  badge?: ExplainerBadge
  /** One-line gist. */
  summary: string
  /** How it works, in a few bullets. */
  points: string[]
  /** Optional "what counts / doesn't count" pair. */
  counts?: string[]
  notCounts?: string[]
}

export interface ExplainerGroup {
  group: string
  items: Explainer[]
}

export const SLA_EXPLAINERS: ExplainerGroup[] = [
  {
    group: 'The clocks',
    items: [
      {
        id: 'first_response',
        title: 'First response',
        icon: 'Reply',
        summary: 'Time from the incoming message to the first reply.',
        points: [
          'The clock starts when the customer’s message arrives.',
          'The first reply of any kind stops it — an AI Agent or a person.',
          'Any first reply counts, so there’s no human-vs-bot distinction to build.',
          'One target for every ticket — first response doesn’t vary by custom field.',
        ],
        counts: ['A substantive reply, from an AI Agent or a person'],
        notCounts: ['A canned auto-acknowledgment (the metric is sound only where the AI genuinely replies)'],
      },
      {
        id: 'resolution',
        title: 'Resolution',
        icon: 'Check',
        summary: 'Time from creation until the ticket is fully closed.',
        points: [
          'Any proper close counts — including one made by an AI Agent.',
          'A close that reopens within 24 hours is voided (it wasn’t really resolved).',
          'Frozen time is excluded (see Counted time).',
          'The target can vary by a custom field value (see When the custom field is set later).',
        ],
      },
      {
        id: 'field_set_later',
        title: 'When the custom field is set later',
        icon: 'Tag',
        summary: 'The target can change mid-conversation — the clock never restarts.',
        points: [
          'A ticket’s custom field is often set after the conversation starts — by a person or by a rule.',
          'As soon as it’s set, the ticket switches to that value’s resolution target.',
          'Change or clear the field and it falls back to the next value that matches, or to the default.',
          'Set it after the ticket is closed and nothing changes — the result is already decided.',
          'Only resolution varies by custom field, so this never affects first response.',
        ],
        counts: ['Time from the moment the conversation started'],
        notCounts: ['Time from the moment the custom field was set'],
      },
      {
        id: 'handoff_pickup',
        title: 'Hand-off pickup time',
        icon: 'Forward',
        badge: 'Future',
        summary: 'Time from an AI hand-off until a human picks the conversation up (agent responsiveness).',
        points: [
          'Dashboard-only: it has no target and no effect on compliance.',
          'Null for conversations that were never handed off by an AI.',
          'Needs a recorded “AI handed off to human” event — not in the registry yet, so it isn’t built.',
        ],
      },
    ],
  },
  {
    group: 'How it’s judged',
    items: [
      {
        id: 'sla_compliance',
        title: 'SLA compliance',
        icon: 'ProcentCircle',
        summary: 'Met ÷ measured, judged strictly.',
        points: [
          'Every target that applies to a conversation must pass, or the whole conversation counts as a miss.',
          'The denominator is conversations with at least one applicable SLA; conversations with no SLA are excluded.',
          'An AI reply or AI close counts like any other — AI-handled conversations are measured, not set aside.',
        ],
      },
      {
        id: 'counted_time',
        title: 'Counted time',
        icon: 'Clock',
        summary: 'When the SLA clock runs — and when it pauses.',
        points: [
          'It pauses while waiting on the customer, while closed (pending a reopen), and outside business hours.',
          'Business hours are per channel; a channel with no schedule runs 24/7.',
          'Reporting must agree with the timer on business hours (a data-capability item to confirm).',
        ],
      },
      {
        id: 'coverage',
        title: 'Coverage',
        icon: 'CheckCircle',
        summary: 'Whether every channel is claimed by an active SLA.',
        points: [
          'Channels with no active SLA have no promise — surfaced as a banner on the overview.',
          'In Iterations 3 and 4 coverage is per type: a channel can be covered for first response but not resolution.',
        ],
      },
    ],
  },
]
