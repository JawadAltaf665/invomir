import { useTranslation } from 'react-i18next';

import { AppBadge } from '@/src/components/common/AppBadge';
import { statusColors } from '@/src/constants/colors';
import { InvoiceStatus } from '@/src/features/invoices/types';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const palette = status in statusColors ? statusColors[status as InvoiceStatus] : statusColors.draft;

  return (
    <AppBadge foreground={palette.foreground} background={palette.background}>
      {t(`invoices.statuses.${status}`, { defaultValue: status })}
    </AppBadge>
  );
}
