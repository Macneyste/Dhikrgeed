import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card, InfoNote } from '@/components/Card';
import { Icon } from '@/components/Icons';
import { Sheet } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { CITIES, CUSTOM_CITY_ID, isValidCoordinate, parseCustomCity } from '@/core/cities';
import { formatTime } from '@/core/format';
import { PRAYER_KEYS, PRAYER_NAMES, REMINDER_OFFSETS, type PrayerKey, type ReminderSettings } from '@/core/reminders';
import { sanitizeText } from '@/core/validation';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSettings } from '@/hooks/useSettings';
import { hasPermission, requestPermission } from '@/services/notifications';
import { colors, fonts, shadow, TOUCH } from '@/theme/theme';

export default function PrayersScreen() {
  const { settings, update } = useSettings();
  const info = usePrayerTimes();
  const [cityOpen, setCityOpen] = useState(false);
  const [prePrompt, setPrePrompt] = useState<PrayerKey | 'after' | null>(null);
  const [denied, setDenied] = useState(false);
  const r = settings.reminders;

  const setReminders = (patch: Partial<ReminderSettings>) => update('reminders', { ...r, ...patch }).catch(() => {});

  /** Turning a reminder on needs notification permission, asked only here. */
  const enable = async (target: PrayerKey | 'after') => {
    if (await hasPermission()) {
      apply(target, true);
      return;
    }
    if (!settings.notificationsAsked) setPrePrompt(target);
    else setDenied(true);
  };

  const apply = (target: PrayerKey | 'after', on: boolean) => {
    if (target === 'after') setReminders({ afterPrayer: on });
    else setReminders({ prayers: { ...r.prayers, [target]: on } });
  };

  const accept = async () => {
    const target = prePrompt;
    setPrePrompt(null);
    const granted = await requestPermission().catch(() => false);
    await update('notificationsAsked', true).catch(() => {});
    if (granted && target) apply(target, true);
    else setDenied(true);
  };

  return (
    <Screen
      title="Salaadda"
      right={
        <Pressable
          onPress={() => setCityOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Magaalada: ${info.city.name}. Beddel`}
          style={styles.cityButton}
        >
          <AppText size={13.5} weight="bold" color={colors.primary}>
            {info.city.name} · Beddel
          </AppText>
        </Pressable>
      }
    >
      {info.next && (
        <Card style={styles.highlight}>
          <AppText size={11} weight="extrabold" color={colors.amberText} style={styles.eyebrow}>
            SALAADDA XIGTA
          </AppText>
          <AppText size={24} weight="extrabold">
            {info.next.name} · {formatTime(info.next.at)}
          </AppText>
          <AppText size={14} weight="semibold" color={colors.soft}>
            {info.next.countdown}
          </AppText>
        </Card>
      )}

      <Card style={styles.list}>
        {PRAYER_KEYS.map((k, i) => {
          const on = r.prayers[k];
          const isNext = info.next?.prayer === k;
          return (
            <View key={k} style={[styles.row, i > 0 && styles.divider]}>
              <View style={styles.rowText}>
                <AppText size={16} weight={isNext ? 'extrabold' : 'bold'} color={isNext ? colors.primary : colors.ink}>
                  {PRAYER_NAMES[k].so}
                </AppText>
                <AppText size={14} color={colors.soft} style={styles.arabic}>
                  {PRAYER_NAMES[k].ar}
                </AppText>
              </View>
              <AppText size={16} weight="bold">
                {formatTime(info.today[k])}
              </AppText>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel={`Xusuusinta ${PRAYER_NAMES[k].so}`}
                accessibilityState={{ checked: on }}
                onPress={() => (on ? apply(k, false) : enable(k))}
                style={[styles.bell, on && styles.bellOn]}
              >
                <Icon name={on ? 'bell' : 'bellOff'} color={on ? colors.onPrimary : colors.muted} size={22} />
              </Pressable>
            </View>
          );
        })}
      </Card>

      <AppText size={15} weight="bold">
        I xusuusi salaadda ka hor
      </AppText>
      <View style={styles.segment} accessibilityRole="radiogroup">
        {REMINDER_OFFSETS.map((m) => {
          const selected = r.offsetMinutes === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setReminders({ offsetMinutes: m })}
              style={[styles.segmentItem, selected && styles.segmentOn]}
            >
              <AppText size={13.5} weight="bold" color={selected ? colors.onPrimary : colors.ink}>
                {m === 0 ? 'Waqtiga' : `${m} daq`}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.toggleRow}>
        <View style={styles.rowText}>
          <AppText size={15} weight="bold">
            Salaadda kadib, i xusuusi adkaarta
          </AppText>
          <AppText size={13} color={colors.soft}>
            15 daqiiqo kadib waqtiga salaadda
          </AppText>
        </View>
        <Switch
          value={r.afterPrayer}
          onValueChange={(v) => (v ? enable('after') : apply('after', false))}
          trackColor={{ true: colors.primary, false: colors.line }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Salaadda kadib, i xusuusi adkaarta"
        />
      </Card>

      {denied && (
        <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button">
          <InfoNote text="Ogeysiisyada waa xiran yihiin. Taabo si aad uga furto dejinta telefoonka." />
        </Pressable>
      )}

      <AppText size={12.5} color={colors.soft} align="center">
        Waxaa laga xisaabiyaa magaalada aad dooratay, internet la&apos;aan.
      </AppText>

      <CitySheet visible={cityOpen} onClose={() => setCityOpen(false)} />
      <PermissionPrompt visible={prePrompt !== null} onAccept={accept} onLater={() => setPrePrompt(null)} />
    </Screen>
  );
}

function CitySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, update } = useSettings();
  const existing = parseCustomCity(settings.customCity);
  const [showCustom, setShowCustom] = useState(false);
  const [name, setName] = useState(existing?.name ?? '');
  const [lat, setLat] = useState(existing ? String(existing.lat) : '');
  const [lng, setLng] = useState(existing ? String(existing.lng) : '');
  const [error, setError] = useState<string | null>(null);

  const choose = (id: string) => {
    update('city', id).catch(() => {});
    onClose();
  };

  const saveCustom = async () => {
    const la = Number(lat.replace(',', '.'));
    const ln = Number(lng.replace(',', '.'));
    if (!isValidCoordinate(la, ln)) {
      setError('Geli loolka (latitude) iyo dhererka (longitude) sax ah.');
      return;
    }
    const cleanName = sanitizeText(name, false).slice(0, 40) || 'Magaalo kale';
    try {
      await update('customCity', JSON.stringify({ name: cleanName, lat: la, lng: ln }));
      await update('city', CUSTOM_CITY_ID);
      setError(null);
      onClose();
    } catch {
      setError('Lama kaydin. Mar kale isku day.');
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Dooro magaalada">
      <ScrollView style={styles.cityList} keyboardShouldPersistTaps="handled">
        {CITIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => choose(c.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: settings.city === c.id }}
            style={styles.cityRow}
          >
            <AppText size={16} weight={settings.city === c.id ? 'extrabold' : 'semibold'}>
              {c.name}
            </AppText>
            {settings.city === c.id && <Icon name="check" color={colors.primary} />}
          </Pressable>
        ))}
        <Pressable onPress={() => setShowCustom((v) => !v)} accessibilityRole="button" style={styles.cityRow}>
          <AppText size={16} weight="semibold">
            Magaalo kale
          </AppText>
          {settings.city === CUSTOM_CITY_ID && <Icon name="check" color={colors.primary} />}
        </Pressable>
        {showCustom && (
          <View style={styles.customForm}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Magaca magaalada"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Magaca magaalada"
              maxLength={40}
              style={styles.input}
            />
            <View style={styles.coords}>
              <TextInput
                value={lat}
                onChangeText={setLat}
                placeholder="Latitude"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Latitude"
                keyboardType="numbers-and-punctuation"
                maxLength={12}
                style={[styles.input, styles.coord]}
              />
              <TextInput
                value={lng}
                onChangeText={setLng}
                placeholder="Longitude"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Longitude"
                keyboardType="numbers-and-punctuation"
                maxLength={12}
                style={[styles.input, styles.coord]}
              />
            </View>
            {error && (
              <AppText size={13} color={colors.danger} weight="semibold">
                {error}
              </AppText>
            )}
            <Button label="Kaydi magaalada" onPress={saveCustom} height={48} />
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

function PermissionPrompt({
  visible,
  onAccept,
  onLater,
}: {
  visible: boolean;
  onAccept: () => void;
  onLater: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onLater} statusBarTranslucent>
      <View style={[styles.prompt, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.promptBody}>
          <View style={[styles.bellBox, shadow]}>
            <Icon name="bell" size={40} color={colors.primary} />
          </View>
          <AppText size={24} weight="extrabold" align="center" accessibilityRole="header">
            Ma rabtaa in lagu xusuusiyo salaadda?
          </AppText>
          <AppText size={15} color={colors.soft} align="center">
            Telefoonkaaga ayaa ogeysiis kuu soo diraya marka salaaddu timaado. Xisaabtu waxay ka dhacdaa telefoonka,
            internet la&apos;aan.
          </AppText>
          <View style={styles.checks}>
            <CheckRow text="Waqtiga salaadda ee magaaladaada" />
            <CheckRow text="Adkaarta salaadda kadib, haddii aad rabto" />
          </View>
        </View>
        <View style={styles.promptActions}>
          <Button label="Oggolow ogeysiisyada" onPress={onAccept} height={56} />
          <Button label="Hadda maya" variant="ghost" onPress={onLater} />
        </View>
      </View>
    </Modal>
  );
}

function CheckRow({ text }: { text: string }) {
  return (
    <View style={styles.checkRow}>
      <Icon name="check" color={colors.primary} size={20} />
      <AppText size={15} weight="semibold" style={styles.rowText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  cityButton: {
    minHeight: TOUCH,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  highlight: { backgroundColor: colors.amberSoft, borderColor: colors.amberSoft, gap: 2 },
  eyebrow: { letterSpacing: 1.3 },
  list: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  divider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  rowText: { flex: 1 },
  arabic: { fontFamily: fonts.arabic },
  bell: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lineSoft,
  },
  bellOn: { backgroundColor: colors.primary },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: {
    flex: 1,
    minHeight: TOUCH,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segmentOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cityList: { maxHeight: 420 },
  cityRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  customForm: { gap: 10, paddingVertical: 12 },
  coords: { flexDirection: 'row', gap: 10 },
  coord: { flex: 1 },
  input: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: TOUCH,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  prompt: { flex: 1, backgroundColor: colors.sky1, paddingHorizontal: 24, justifyContent: 'space-between' },
  promptBody: { alignItems: 'center', gap: 14 },
  bellBox: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checks: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promptActions: { gap: 6 },
});
