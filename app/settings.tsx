import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { enabledCount } from '@/core/reminders';
import type { AppSettings } from '@/db/settingsRepo';
import { useSettings } from '@/hooks/useSettings';
import { exportBackup } from '@/services/backup';
import { colors } from '@/theme/theme';

type BoolKey = 'largeText' | 'haptics' | 'volumeKeys' | 'transliteration' | 'meaning' | 'reducedMotion';

const READING: { key: BoolKey; title: string; description: string }[] = [
  { key: 'largeText', title: 'Qoraal weyn', description: 'Qoraalka oo dhan ayaa la weyneynayaa.' },
  { key: 'haptics', title: 'Gariir', description: 'Gariir yar marka aad tiriso.' },
  {
    key: 'volumeKeys',
    title: 'Ku tiri badhamada codka',
    description: 'Codka hoos: hal tiro. Codka kor: ka noqo. Shaashadda tirinta oo keliya.',
  },
  { key: 'transliteration', title: 'Sida loo akhriyo', description: 'Dikriga oo far Laatiin ah lagu qoray.' },
  { key: 'meaning', title: 'Macnaha Soomaaliga', description: 'Macnaha dikriga oo Af-Soomaali ah.' },
  {
    key: 'reducedMotion',
    title: 'Dhaqdhaqaaq yar',
    description: 'Dhibcaha dhacaya iyo isbeddelada geedka waa la joojinayaa.',
  },
];

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const version = Constants.expoConfig?.version ?? '';
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onExport = () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    exportBackup(settings, version)
      .catch(() => setNotice('Kaydka lama dhoofin karin. Mar kale isku day.'))
      .finally(() => setBusy(false));
  };

  return (
    <Screen
      title="Dejinta"
      left={<IconButton icon="back" label="Dib u noqo" onPress={() => router.back()} background={colors.surface} />}
    >
      <SectionLabel>AKHRINTA IYO TIRINTA</SectionLabel>
      <Card style={styles.list}>
        {READING.map((item, i) => (
          <View key={item.key} style={[styles.row, i > 0 && styles.divider]}>
            <View style={styles.text}>
              <AppText size={15.5} weight="bold">
                {item.title}
              </AppText>
              <AppText size={13} color={colors.soft}>
                {item.description}
              </AppText>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={(v) => update(item.key, v as AppSettings[BoolKey]).catch(() => {})}
              trackColor={{ true: colors.primary, false: colors.line }}
              thumbColor="#FFFFFF"
              accessibilityLabel={item.title}
              accessibilityHint={item.description}
            />
          </View>
        ))}
      </Card>

      <SectionLabel>KAYDKA</SectionLabel>
      <Card style={styles.list}>
        <LinkRow
          title="Dhoofi kaydka"
          value="Fayl JSON ah oo aad adigu kaydsato ama u dirto telefoon kale."
          onPress={onExport}
        />
      </Card>
      {notice ? (
        <AppText size={13} color={colors.soft} align="center" accessibilityLiveRegion="polite">
          {notice}
        </AppText>
      ) : null}

      <SectionLabel>KALE</SectionLabel>
      <Card style={styles.list}>
        <LinkRow
          title="Xusuusinta salaadda"
          value={`${enabledCount(settings.reminders)} / 5 shidan`}
          onPress={() => router.push('/prayers')}
        />
        <LinkRow title="Taariikhda wareegyada" onPress={() => router.push('/history')} divider />
        <LinkRow title="Ku saabsan app-ka" value={`Open source · MIT${version ? ` · ${version}` : ''}`} divider />
      </Card>

      <AppText size={13} color={colors.soft} align="center" style={styles.footer}>
        Xogtaadu waxay ku kaydsan tahay telefoonkaaga oo keliya. Akoon, xayeysiis iyo tracking midna ma jiro.
      </AppText>
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText size={12} weight="extrabold" color={colors.soft} style={styles.section} accessibilityRole="header">
      {children}
    </AppText>
  );
}

function LinkRow({
  title,
  value,
  onPress,
  divider,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
  divider?: boolean;
}) {
  const content = (
    <>
      <View style={styles.text}>
        <AppText size={15.5} weight="bold">
          {title}
        </AppText>
        {value ? (
          <AppText size={13} color={colors.soft}>
            {value}
          </AppText>
        ) : null}
      </View>
      {onPress && <Icon name="chevron" color={colors.muted} size={20} />}
    </>
  );
  if (!onPress) return <View style={[styles.row, divider && styles.divider]}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      style={[styles.row, divider && styles.divider]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { letterSpacing: 1.3, marginTop: 6 },
  list: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  text: { flex: 1, gap: 2 },
  footer: { marginTop: 8, paddingHorizontal: 12 },
});
