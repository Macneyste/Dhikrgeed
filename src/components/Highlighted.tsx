import { Text } from 'react-native';

import { fonts } from '../theme/theme';
import { AppText, type AppTextProps } from './AppText';

/** Renders text with every "Allaah" in the given colour and bold weight. */
export function HighlightAllaah({ text, highlight, ...rest }: AppTextProps & { text: string; highlight: string }) {
  const parts = text.split(/(Allaah)/);
  return (
    <AppText {...rest}>
      {parts.map((part, i) =>
        part === 'Allaah' ? (
          <Text key={i} style={{ color: highlight, fontFamily: fonts.extrabold }}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}
