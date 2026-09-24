// Page-level error content — shown when the whole settings page fails to load
// (an API error, a 5xx, a dropped connection). Sample/prototype content lives
// here (CLAUDE.md rule 4: no inline mock data).
//
// Copy follows what-happened / why / reassurance / how-to-fix. The reassurance
// line earns its place on a SETTINGS page specifically: the user's first fear
// when a config screen breaks is that their configuration is gone.

export const PAGE_ERROR = {
  /** What happened, from the user's point of view — not the HTTP status. */
  title: 'We couldn’t load your SLAs',
  /** Why, plus the reassurance that nothing was lost. */
  body: 'Something went wrong on our end. Your SLAs haven’t changed — nothing was saved or deleted.',
  /** The one action worth offering. */
  action: 'Try again',
  /** Support hand-off. A code beats "contact support" with nothing to quote. */
  supportHint: 'If this keeps happening, contact support and include this code:',
  /** Illustrative only — a real build would surface the live request id. */
  reference: 'SLA-503 · req_7f3ab291',
} as const
