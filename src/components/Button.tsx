import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, TOUCH } from '../theme/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icons';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  height?: number;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
  ghost: 'transparent',
};

const FG: Record<Variant, string> = {
  primary: colors.onPrimary,
  secondary: colors.ink,
  danger: colors.onPrimary,
  ghost: colors.primary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  height = 54,
  icon,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: Math.max(TOUCH, height),
          backgroundColor: BG[variant],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'secondary' && styles.outlined,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon && <Icon name={icon} size={20} color={FG[variant]} />}
        <AppText weight="extrabold" size={16} color={FG[variant]} align="center">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  size = TOUCH,
  color = colors.ink,
  background = 'rgba(255,255,255,0.75)',
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  color?: string;
  background?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={Math.max(0, (TOUCH - size) / 2)}
      style={({ pressed }) => [
        styles.icon,
        {
          width: size,
          height: size,
          borderRadius: size / 2.6,
          backgroundColor: background,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  outlined: { borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
});
