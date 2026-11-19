import { StyleSheet, View } from 'react-native';

import type { StatusKind } from '../hooks/useOverview';
import { colors } from '../theme/theme';
import { AppText } from './AppText';
import { Card } from './Card';
import { Icon } from './Icons';

export function CollectionCard({
  title,
  subtitle,
  status,
  statusKind,
  onPress,
  dashed,
}: {
  title: string;
  subtitle?: string;
  status?: string;
  statusKind?: StatusKind;
  onPress: () => void;
  dashed?: boolean;
}) {
  const statusColor =
    statusKind === 'done' ? colors.primary : statusKind === 'active' ? colors.amberText : colors.muted;
  return (
    <Card
      onPress={onPress}
      dashed={dashed}
      style={styles.card}
      accessibilityLabel={[title, subtitle, status].filter(Boolean).join(', ')}
    >
      {dashed && (
        <View style={styles.plus}>
          <Icon name="plus" color={colors.primary} size={20} />
        </View>
      )}
      <AppText size={16} weight="extrabold" numberOfLines={2}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText size={12.5} color={colors.soft} numberOfLines={2}>
          {subtitle}
        </AppText>
      ) : null}
      {status ? (
        <AppText size={12} weight="bold" color={statusColor} style={styles.status}>
          {status}
        </AppText>
      ) : null}
    </Card>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47.5%', flexGrow: 1, minHeight: 112, gap: 4 },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  status: { marginTop: 'auto', paddingTop: 6 },
});
