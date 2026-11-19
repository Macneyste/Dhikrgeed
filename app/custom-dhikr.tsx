import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button, IconButton } from '@/components/Button';
import { InfoNote } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { LIMITS, validateCustomDhikr, type CustomDhikrField } from '@/core/validation';
import { customCollectionId, insertCustomDhikr } from '@/db/customDhikrRepo';
import { getDatabase } from '@/db/database';
import { useSettings } from '@/hooks/useSettings';
import { colors, fonts, scaleFont, TOUCH } from '@/theme/theme';

const PRESETS = [33, 99, 100, 1000];

export default function CustomDhikrScreen() {
  const { settings } = useSettings();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState('');
  const [target, setTarget] = useState(33);
  const [errors, setErrors] = useState<Partial<Record<CustomDhikrField | 'save', string>>>({});
  const [saving, setSaving] = useState(false);

  const fontSize = scaleFont(15, settings.largeText);
  const setCount = (n: number) => setTarget(Math.max(LIMITS.minTarget, Math.min(LIMITS.maxTarget, n)));

  const save = async () => {
    const result = validateCustomDhikr({ title, text, meaning, target });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const db = await getDatabase();
      const created = await insertCustomDhikr(db, randomUUID(), result.value, new Date());
      router.replace({ pathname: '/session/[collectionId]', params: { collectionId: customCollectionId(created.id) } });
    } catch {
      setErrors({ save: 'Dikriga lama kaydin. Mar kale isku day.' });
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Dikri gaar ah"
      left={<IconButton icon="back" label="Dib u noqo" onPress={() => router.back()} background={colors.surface} />}
    >
      <Field label="Magaca" error={errors.title}>
        <Input value={title} onChangeText={setTitle} maxLength={LIMITS.title + 10} fontSize={fontSize} />
      </Field>

      <Field label="Qoraalka dikriga (Carabi ama Soomaali)" error={errors.text}>
        <Input
          value={text}
          onChangeText={setText}
          multiline
          maxLength={LIMITS.text + 20}
          fontSize={fontSize + 2}
          style={styles.multiline}
        />
      </Field>

      <Field label="Macnaha (ikhtiyaari)" error={errors.meaning}>
        <Input
          value={meaning}
          onChangeText={setMeaning}
          multiline
          maxLength={LIMITS.meaning + 20}
          fontSize={fontSize}
          style={styles.multilineSmall}
        />
      </Field>

      <Field label="Tirada" error={errors.target}>
        <View style={styles.stepper}>
          <IconButton
            icon="minus"
            label="Yaree tirada"
            onPress={() => setCount(target - 1)}
            background={colors.surface}
            disabled={target <= LIMITS.minTarget}
          />
          <TextInput
            value={String(target)}
            onChangeText={(v) => setCount(parseInt(v.replace(/\D/g, '') || '1', 10))}
            keyboardType="number-pad"
            accessibilityLabel="Tirada"
            maxLength={4}
            style={[styles.count, { fontSize: scaleFont(22, settings.largeText) }]}
          />
          <IconButton
            icon="plus"
            label="Kordhi tirada"
            onPress={() => setCount(target + 1)}
            background={colors.surface}
            disabled={target >= LIMITS.maxTarget}
          />
        </View>
        <View style={styles.presets}>
          {PRESETS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setTarget(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n}`}
              accessibilityState={{ selected: target === n }}
              style={[styles.preset, target === n && styles.presetOn]}
            >
              <AppText weight="extrabold" size={15} color={target === n ? colors.onPrimary : colors.ink}>
                {n}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Field>

      <InfoNote text="Dikrigan waxaa lagu calaamadeynayaa “Dikri gaar ah”. Ma maro dib-u-eegista adkaarta app-ka." />
      {errors.save ? (
        <AppText color={colors.danger} weight="bold" accessibilityLiveRegion="polite">
          {errors.save}
        </AppText>
      ) : null}
      <Button label="Kaydi oo bilow" onPress={save} disabled={saving} height={56} />
    </Screen>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText size={14} weight="bold">
        {label}
      </AppText>
      {children}
      {error ? (
        <AppText size={13} weight="semibold" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function Input({ fontSize, style, ...rest }: TextInputProps & { fontSize: number }) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      autoCorrect={false}
      style={[styles.input, { fontSize }, style]}
      textAlignVertical={rest.multiline ? 'top' : 'center'}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: TOUCH + 4,
    color: colors.ink,
    fontFamily: fonts.medium,
  },
  multiline: { minHeight: 110 },
  multilineSmall: { minHeight: 80 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: TOUCH,
  },
  presets: { flexDirection: 'row', gap: 8, marginTop: 4 },
  preset: {
    flex: 1,
    minHeight: TOUCH,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  presetOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
