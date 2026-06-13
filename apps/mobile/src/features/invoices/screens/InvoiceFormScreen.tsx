import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { AppInput } from '@/src/components/forms/AppInput';
import { DatePickerField } from '@/src/components/forms/DatePickerField';
import { FilterChip } from '@/src/components/forms/FilterChip';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { clientsApi } from '@/src/features/clients/api/clients-api';
import { invoicesApi } from '@/src/features/invoices/api/invoices-api';
import {
  InvoiceDiscountType,
  InvoiceItemInputDto,
  InvoicePaymentTerms,
  InvoiceSaveRequest,
  invoicePaymentTerms,
} from '@/src/features/invoices/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';

type DraftLineItem = InvoiceItemInputDto & { localId: string };

const defaultLineItem = (): DraftLineItem => ({
  localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  description: '',
  quantity: 1,
  unitPrice: 0,
});

export function InvoiceFormScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string; clientId?: string }>();
  const invoiceId = params.id;
  const isEditing = Boolean(invoiceId);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission(permissions.invoice.create);
  const canUpdate = hasPermission(permissions.invoice.update);
  const canAccess = isEditing ? canUpdate : canCreate;
  const [clientId, setClientId] = useState(params.clientId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<InvoicePaymentTerms | null>('net_30');
  const [taxPercent, setTaxPercent] = useState('0');
  const [discountType, setDiscountType] = useState<InvoiceDiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<readonly DraftLineItem[]>([defaultLineItem()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const clientsQuery = useQuery({
    queryKey: queryKeys.clients({ page: 1, limit: 100, q: '' }),
    queryFn: () => clientsApi.listClients({ page: 1, limit: 100, q: '' }),
    enabled: canAccess,
  });
  const invoiceQuery = useQuery({
    queryKey: queryKeys.invoice(invoiceId ?? ''),
    queryFn: () => invoicesApi.getInvoice(invoiceId ?? ''),
    enabled: canAccess && Boolean(invoiceId),
  });
  const saveMutation = useMutation({
    mutationFn: (request: InvoiceSaveRequest) =>
      invoiceId ? invoicesApi.updateInvoice(invoiceId, request) : invoicesApi.createInvoice(request),
    async onSuccess(invoice) {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      router.replace(`/invoices/${invoice.id}`);
    },
  });

  useEffect(() => {
    const invoice = invoiceQuery.data;

    if (!invoice || !isEditing) {
      return;
    }

    setClientId(invoice.client.id);
    setDueDate(invoice.dueDate.slice(0, 10));
    setPaymentTerms(null);
    setTaxPercent(String(invoice.taxPercent ?? 0));
    setDiscountType('fixed');
    setDiscountValue(String(invoice.discountAmount ?? 0));
    setNotes(invoice.notes ?? '');
    setItems(
      invoice.items.map((item) => ({
        localId: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );
  }, [invoiceQuery.data, isEditing]);

  const clients = clientsQuery.data?.items ?? [];
  const selectedClient = clients.find((client) => client.id === clientId);
  const currency = selectedClient?.currency ?? invoiceQuery.data?.currency ?? 'USD';
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + safeNumber(item.quantity) * safeNumber(item.unitPrice), 0);
    const discount = discountType === 'percent'
      ? subtotal * (Math.min(100, safeNumber(discountValue)) / 100)
      : safeNumber(discountValue);
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * (Math.min(100, safeNumber(taxPercent)) / 100);

    return {
      subtotal,
      discount,
      tax,
      total: taxable + tax,
    };
  }, [discountType, discountValue, items, taxPercent]);

  if (!canAccess) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  if (invoiceQuery.isLoading) {
    return (
      <AppScreen>
        <AppHeader title={isEditing ? t('invoices.edit') : t('invoices.create')} />
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

  const updateItem = (localId: string, patch: Partial<InvoiceItemInputDto>) => {
    setItems((current) => current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  };

  const removeItem = (localId: string) => {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.localId !== localId) : current));
  };

  const buildRequest = (): InvoiceSaveRequest | null => {
    const normalizedItems = items.map((item) => ({
      description: item.description.trim(),
      quantity: safeNumber(item.quantity),
      unitPrice: safeNumber(item.unitPrice),
    }));

    if (!clientId) {
      setValidationError(t('invoices.validation.client'));
      return null;
    }

    if (!dueDate && !paymentTerms) {
      setValidationError(t('invoices.validation.dueDateOrTerms'));
      return null;
    }

    if (normalizedItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setValidationError(t('invoices.validation.items'));
      return null;
    }

    if (safeNumber(taxPercent) < 0 || safeNumber(taxPercent) > 100) {
      setValidationError(t('validation.taxPercent'));
      return null;
    }

    if (discountType === 'percent' && safeNumber(discountValue) > 100) {
      setValidationError(t('invoices.validation.discountPercent'));
      return null;
    }

    setValidationError(null);

    return {
      clientId,
      dueDate: dueDate || null,
      paymentTerms: dueDate ? null : paymentTerms,
      taxPercent: safeNumber(taxPercent),
      discount: safeNumber(discountValue) > 0 ? { type: discountType, value: safeNumber(discountValue) } : null,
      notes: notes.trim() || null,
      items: normalizedItems,
    };
  };

  return (
    <AppScreen>
      <AppHeader
        title={isEditing ? t('invoices.edit') : t('invoices.create')}
        subtitle={isEditing ? invoiceQuery.data?.invoiceNumber : undefined}
      />

      {clientsQuery.isError ? <ErrorState message={clientsQuery.error.message} onRetry={() => clientsQuery.refetch()} /> : null}
      {saveMutation.isError ? <ErrorState message={saveMutation.error.message} /> : null}
      {validationError ? <ErrorState message={validationError} /> : null}

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.title')}</AppText>
        {clientsQuery.isLoading ? <LoadingState rows={2} /> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {clients.map((client) => (
            <FilterChip
              key={client.id}
              label={client.company ? `${client.name} / ${client.company}` : client.name}
              selected={clientId === client.id}
              onPress={() => setClientId(client.id)}
            />
          ))}
        </ScrollView>
        <AppButton
          title={t('clients.add')}
          iconName="person-add-outline"
          variant="ghost"
          onPress={() => router.push('/clients/new')}
        />
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('invoices.scheduleAndTerms')}</AppText>
        <DatePickerField
          label={t('invoices.dueDate')}
          value={dueDate}
          placeholder={t('invoices.datePlaceholder')}
          sheetTitle={t('invoices.pickDueDate')}
          onSelect={(value) => {
            setDueDate(value);
            setPaymentTerms(null);
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {invoicePaymentTerms.map((terms) => (
            <FilterChip
              key={terms}
              label={t(`invoices.paymentTerms.${terms}`)}
              selected={paymentTerms === terms}
              onPress={() => {
                setDueDate('');
                setPaymentTerms(terms);
              }}
            />
          ))}
        </ScrollView>
      </AppCard>

      <AppCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText variant="h3">{t('invoices.lineItems')}</AppText>
          <AppButton
            title={t('invoices.addItem')}
            iconName="add-outline"
            variant="secondary"
            fullWidth={false}
            onPress={() => setItems((current) => [...current, defaultLineItem()])}
          />
        </View>
        {items.map((item, index) => (
          <View key={item.localId} style={styles.itemCard}>
            <View style={styles.sectionHeader}>
              <AppText variant="label">{t('invoices.itemNumber', { count: index + 1 })}</AppText>
              <AppButton
                title={t('common.cancel')}
                iconName="trash-outline"
                variant="danger"
                fullWidth={false}
                disabled={items.length === 1}
                onPress={() => removeItem(item.localId)}
              />
            </View>
            <AppInput
              label={t('invoices.description')}
              value={item.description}
              onChangeText={(value) => updateItem(item.localId, { description: value })}
              leftIconName="cube-outline"
            />
            <View style={styles.twoColumn}>
              <View style={styles.inputColumn}>
                <AppInput
                  label={t('invoices.quantity')}
                  value={String(item.quantity)}
                  onChangeText={(value) => updateItem(item.localId, { quantity: safeNumber(value) })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.inputColumn}>
                <AppInput
                  label={t('invoices.unitPrice')}
                  value={String(item.unitPrice)}
                  onChangeText={(value) => updateItem(item.localId, { unitPrice: safeNumber(value) })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        ))}
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('invoices.taxAndDiscount')}</AppText>
        <AppInput
          label={t('invoices.taxPercent')}
          value={taxPercent}
          onChangeText={setTaxPercent}
          keyboardType="decimal-pad"
          leftIconName="calculator-outline"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <FilterChip label={t('invoices.discountTypes.fixed')} selected={discountType === 'fixed'} onPress={() => setDiscountType('fixed')} />
          <FilterChip
            label={t('invoices.discountTypes.percent')}
            selected={discountType === 'percent'}
            onPress={() => setDiscountType('percent')}
          />
        </ScrollView>
        <AppInput
          label={t('invoices.discount')}
          value={discountValue}
          onChangeText={setDiscountValue}
          keyboardType="decimal-pad"
          leftIconName="pricetag-outline"
        />
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="h3">{t('invoices.notesAndTerms')}</AppText>
        <AppInput
          label={t('invoices.notes')}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          leftIconName="reader-outline"
        />
      </AppCard>

      <AppCard style={styles.card}>
        <View style={styles.totalRow}>
          <AppText>{t('invoices.subtotal')}</AppText>
          <MoneyText amount={totals.subtotal} currency={currency} />
        </View>
        <View style={styles.totalRow}>
          <AppText>{t('invoices.discount')}</AppText>
          <MoneyText amount={totals.discount} currency={currency} />
        </View>
        <View style={styles.totalRow}>
          <AppText>{t('invoices.tax')}</AppText>
          <MoneyText amount={totals.tax} currency={currency} />
        </View>
        <View style={styles.totalRow}>
          <AppText variant="h3">{t('invoices.total')}</AppText>
          <MoneyText amount={totals.total} currency={currency} variant="h3" />
        </View>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title={isEditing ? t('common.save') : t('invoices.saveDraft')}
          iconName="save-outline"
          isLoading={saveMutation.isPending}
          onPress={save}
        />
        <AppButton title={t('common.cancel')} iconName="close-outline" variant="ghost" onPress={() => router.back()} />
      </View>

    </AppScreen>
  );
}

function safeNumber(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  chips: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.large,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputColumn: {
    flex: 1,
    minWidth: 0,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
