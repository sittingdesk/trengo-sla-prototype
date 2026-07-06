// Settings navigation — the grouped nav shown in the SettingsSidebar.
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// `icon` is a fuzzy name resolved by Icon.vue against `svg icons/linear/*`.
// WhatsApp / Facebook / Instagram have no brand glyphs in the set, so they use
// monochrome proxies from the existing outline icons (agreed with the user).

export interface NavItem {
  key: string
  label: string
  icon: string
  badge?: string
}

export interface NavGroup {
  key: string
  label: string
  items: NavItem[]
}

export const SETTINGS_NAV: NavGroup[] = [
  {
    key: 'channels',
    label: 'Channels',
    items: [
      { key: 'whatsapp', label: 'WhatsApp Business', icon: 'Chatbot' }, // proxy
      { key: 'facebook', label: 'Facebook', icon: 'Comment' }, // proxy
      { key: 'instagram', label: 'Instagram', icon: 'Camera' }, // proxy
      { key: 'email', label: 'Email', icon: 'Email' },
      { key: 'live-chat', label: 'Live chat', icon: 'Comment' },
      { key: 'telegram', label: 'Telegram', icon: 'Send' }, // paper-plane proxy
      { key: 'sms', label: 'SMS', icon: 'SMS' },
      { key: 'custom-channel', label: 'Custom channel', icon: 'CustomIntegration' },
      { key: 'voice', label: 'Voice', icon: 'Phone' },
    ],
  },
  {
    key: 'automation',
    label: 'Automation',
    items: [
      { key: 'rules', label: 'Rules', icon: 'Lightning' },
      { key: 'flowbots', label: 'Flowbots', icon: 'FlowCustom' },
      { key: 'auto-replies', label: 'Auto replies', icon: 'Reply' },
      { key: 'widget-automations', label: 'Widget automations', icon: 'WebsiteWidgetCustom' },
      { key: 'csat', label: 'Customer satisfaction', icon: 'EmotionHappy' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    items: [
      { key: 'inbox', label: 'Inbox', icon: 'Inbox', badge: 'Beta' },
      { key: 'integrations', label: 'Integrations', icon: 'Integration' },
      { key: 'web-widgets', label: 'Web widgets', icon: 'Globe' },
      { key: 'quick-replies', label: 'Quick replies', icon: 'QuickReplyCustom' },
      { key: 'labels', label: 'Labels', icon: 'Tag' },
      { key: 'views', label: 'Views', icon: 'Eye' },
      { key: 'custom-fields', label: 'Custom fields', icon: 'ListUnordered' },
      { key: 'ticket-results', label: 'Ticket results', icon: 'Trophy' },
      { key: 'locations', label: 'Locations', icon: 'Pin' },
      { key: 'business-hours', label: 'Business hours', icon: 'Clock' },
      { key: 'sla-policies', label: 'SLA policies', icon: 'Stopwatch' },
    ],
  },
]
