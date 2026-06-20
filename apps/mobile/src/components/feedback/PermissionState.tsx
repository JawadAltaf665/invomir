import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/src/components/feedback/ErrorState';

export function PermissionState() {
  const { t } = useTranslation();

  return <ErrorState title={t('states.permissionTitle')} message={t('states.permissionMessage')} />;
}
