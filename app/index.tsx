import { Redirect } from 'expo-router';

// Temporary entry until the home screen lands: open the tasbih counter.
export default function Index() {
  return <Redirect href="/session/tasbih" />;
}
