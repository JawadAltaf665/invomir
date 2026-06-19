import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { AppInput } from '@/src/components/forms/AppInput';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { clientsApi } from '@/src/features/clients/api/clients-api';
import { ClientSaveRequest } from '@/src/features/clients/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';

export function ClientFormScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const clientId = params.id;
  const isEditing = Boolean(clientId);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canAccess = isEditing ? hasPermission(permissions.client.update) : hasPermission(permissions.client.create);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const clientQuery = useQuery({
    queryKey: queryKeys.client(clientId ?? ''),
    queryFn: () => clientsApi.getClient(clientId ?? ''),
    enabled: canAccess && Boolean(clientId),
  });
  const saveMutation = useMutation({
    mutationFn: (request: ClientSaveRequest) =>
      clientId ? clientsApi.updateClient(clientId, request) : clientsApi.createClient(request),
    async onSuccess(client) {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.replace(`/clients/${client.id}`);
    },
  });

  useEffect(() => {
    const client = clientQuery.data;

    if (!client || !isEditing) {
      return;
    }

    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone ?? '');
    setAddress(client.address ?? '');
    setCompany(client.company ?? '');
    setTaxId(client.taxId ?? '');
    setNotes(client.notes ?? '');
  }, [clientQuery.data, isEditing]);

  if (!canAccess) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  if (clientQuery.isLoading) {
    return (
      <AppScreen>
        <AppHeader title={isEditing ? t('clients.edit') : t('clients.add')} />
        <LoadingState rows={5} />
      </AppScreen>
    );
  }

  const save = () => {
    const request = buildRequest();

    if (!request) {
      return;
    }

    saveMutation.mutate(request);
  };

  const buildRequest = (): ClientSaveRequest | null => {
    if (!name.trim()) {
      setValidationError(t('clients.validation.name'));
      return null;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError(t('validation.email'));
      return null;
    }

    setValidationError(null);

    return {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      company: company.trim() || null,
      taxId: taxId.trim() || null,
      notes: notes.trim() || null,
    };
  };

  return (
    <AppScreen>
      <AppHeader
        title={isEditing ? t('clients.edit') : t('clients.add')}
        subtitle={isEditing ? clientQuery.data?.email : t('clients.formSubtitle')}
      />

      {clientQuery.isError ? <ErrorState message={clientQuery.error.message} onRetry={() => clientQuery.refetch()} /> : null}
      {saveMutation.isError ? <ErrorState message={saveMutation.error.message} /> : null}
      {validationError ? <ErrorState message={validationError} /> : null}

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.contact')}</AppText>
        <AppInput label={t('clients.name')} value={name} onChangeText={setName} leftIconName="person-outline" />
        <AppInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          leftIconName="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <AppInput label={t('clients.phone')} value={phone} onChangeText={setPhone} leftIconName="call-outline" />
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.companyInfo')}</AppText>
        <AppInput label={t('clients.company')} value={company} onChangeText={setCompany} leftIconName="business-outline" />
        <AppInput label={t('clients.taxId')} value={taxId} onChangeText={setTaxId} leftIconName="receipt-outline" />
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.billingInfo')}</AppText>
        <AppInput
          label={t('clients.address')}
          value={address}
          onChangeText={setAddress}
          leftIconName="location-outline"
          multiline
          numberOfLines={3}
        />
        <AppInput
          label={t('clients.notes')}
          value={notes}
          onChangeText={setNotes}
          leftIconName="reader-outline"
          multiline
          numberOfLines={4}
        />
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title={isEditing ? t('common.save') : t('clients.add')}
          iconName="save-outline"
          isLoading={saveMutation.isPending}
          onPress={save}
        />
        <AppButton title={t('common.cancel')} iconName="close-outline" variant="ghost" onPress={() => router.back()} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
