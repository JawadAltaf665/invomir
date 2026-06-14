import { ReactNode, useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { normalizeApiError } from '@/src/services/api/api-error';
import { theme } from '@/src/theme/theme';

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => Promise<void> | void;
}

interface ConfirmationDialogProps {
  options: ConfirmationOptions;
  errorMessage: string | null;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function useConfirmationDialog(): {
  confirm: (options: ConfirmationOptions) => void;
  ConfirmationDialog: ReactNode;
} {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const close = useCallback(() => {
    if (isProcessing) {
      return;
    }

    setOptions(null);
    setErrorMessage(null);
  }, [isProcessing]);

  const confirm = useCallback((nextOptions: ConfirmationOptions) => {
    setErrorMessage(null);
    setOptions(nextOptions);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!options || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await options.onConfirm();
      setOptions(null);
    } catch (error) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, options]);

  return {
    confirm,
    ConfirmationDialog: options ? (
      <ConfirmationDialog
        errorMessage={errorMessage}
        isProcessing={isProcessing}
        onCancel={close}
        onConfirm={handleConfirm}
        options={options}
      />
    ) : null,
  };
}

function ConfirmationDialog({
  options,
  errorMessage,
  isProcessing,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel={options.cancelLabel ?? t('common.cancel')}
          disabled={isProcessing}
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dialog}>
          <View style={styles.icon}>
            <AppText variant="h3" color={theme.colors.warning}>
              !
            </AppText>
          </View>
          <View style={styles.copy}>
            <AppText variant="h3" align="center">
              {options.title ?? t('common.confirmAction')}
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} align="center">
              {options.message}
            </AppText>
            {errorMessage ? (
              <AppText variant="caption" color={theme.colors.error} align="center">
                {errorMessage}
              </AppText>
            ) : null}
          </View>
          <View style={styles.actions}>
            <AppButton
              title={options.cancelLabel ?? t('common.cancel')}
              variant="ghost"
              fullWidth={false}
              disabled={isProcessing}
              style={styles.actionButton}
              onPress={onCancel}
            />
            <AppButton
              title={options.confirmLabel ?? t('common.confirm')}
              variant={options.tone === 'danger' ? 'danger' : 'primary'}
              fullWidth={false}
              disabled={isProcessing}
              isLoading={isProcessing}
              style={styles.actionButton}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 380,
    padding: theme.spacing.lg,
    width: '100%',
    ...(theme.shadows.floating ?? {}),
  },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
});
