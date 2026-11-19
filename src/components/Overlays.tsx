import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '../theme/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icons';

/** Bottom sheet with a title, message and actions. */
export function Sheet({
  visible,
  onClose,
  title,
  message,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Xir" accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.handle} />
        <AppText size={20} weight="extrabold" accessibilityRole="header">
          {title}
        </AppText>
        {message ? (
          <AppText size={15} color={colors.soft} style={styles.message}>
            {message}
          </AppText>
        ) : null}
        <View style={styles.actions}>{children}</View>
      </View>
    </Modal>
  );
}

/** Save-failed toast shown on the counter. */
export function Toast({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={[styles.toast, shadow]} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      <View style={styles.toastRow}>
        <Icon name="alert" color={colors.danger} size={22} />
        <View style={styles.toastText}>
          <AppText size={15} weight="extrabold">
            {title}
          </AppText>
          <AppText size={13} color={colors.soft}>
            {message}
          </AppText>
        </View>
      </View>
      <Button label={actionLabel} onPress={onAction} variant="secondary" height={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(58,36,32,0.35)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  message: { marginTop: 8 },
  actions: { marginTop: 20, gap: 10 },
  toast: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.line },
  toastRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  toastText: { flex: 1, gap: 2 },
});
