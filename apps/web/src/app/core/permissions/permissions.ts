export const permissions = {
  dashboard: {
    view: 'dashboard.view'
  },
  invoice: {
    view: 'invoice.view',
    create: 'invoice.create',
    update: 'invoice.update',
    delete: 'invoice.delete',
    send: 'invoice.send',
    markPaid: 'invoice.mark_paid',
    cancel: 'invoice.cancel',
    duplicate: 'invoice.duplicate',
    manageReminders: 'invoice.manage_reminders'
  },
  client: {
    view: 'client.view',
    create: 'client.create',
    update: 'client.update',
    delete: 'client.delete'
  },
  payment: {
    view: 'payment.view',
    manage: 'payment.manage'
  },
  report: {
    view: 'report.view',
    export: 'report.export'
  },
  auditLog: {
    view: 'audit_log.view'
  },
  notification: {
    view: 'notification.view'
  },
  subscription: {
    view: 'subscription.view',
    manage: 'subscription.manage'
  },
  team: {
    manage: 'team.manage'
  },
  settings: {
    manage: 'settings.manage'
  },
  system: {
    access: 'system.access',
    users: {
      view: 'system.user.view',
      manage: 'system.user.manage'
    }
  }
} as const;

export type Permission = string;
