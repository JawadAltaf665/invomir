export const translationKeys = {
  common: {
    active: 'common.active',
    applyFilters: 'common.applyFilters',
    cancel: 'common.cancel',
    actions: 'common.actions',
    refresh: 'common.refresh',
    reset: 'common.reset',
    retry: 'common.retry',
    save: 'common.save',
    search: 'common.search',
    signOut: 'common.signOut',
  },
  navigation: {
    dashboard: 'navigation.dashboard',
    invoices: 'navigation.invoices',
    clients: 'navigation.clients',
    payments: 'navigation.payments',
    reports: 'navigation.reports',
    subscriptions: 'navigation.subscriptions',
    team: 'navigation.team',
    auditLogs: 'navigation.auditLogs',
    settings: 'navigation.settings',
    admin: 'navigation.admin',
    emailTemplates: 'navigation.emailTemplates',
    queuedEmails: 'navigation.queuedEmails',
    users: 'navigation.users',
  },
} as const;

type NestedValues<T> = T extends string ? T : { [K in keyof T]: NestedValues<T[K]> }[keyof T];

export type TranslationKey = NestedValues<typeof translationKeys>;
