import { Redirect } from 'expo-router';

import { useSettings } from '@/hooks/useSettings';

/** Entry: welcome once, then home (which offers to resume an active round). */
export default function Index() {
  const { settings } = useSettings();
  return <Redirect href={settings.onboarded ? '/(tabs)' : '/welcome'} />;
}
