import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CounterScreen from '../../app/session/[collectionId]';
import * as Haptics from 'expo-haptics';

import { resetFakeStore } from './fakeSessionService';

// SQLite is replaced by an in-memory fake that uses the real core rules.
jest.mock('@/services/sessionService', () => require('./fakeSessionService'));

let mockCollectionId = 'tasbih';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ collectionId: mockCollectionId }),
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// ---------------------------------------------------------------------------

let clock = 1_000_000;

beforeEach(() => {
  jest.clearAllMocks();
  resetFakeStore();
  mockCollectionId = 'tasbih';
  jest.spyOn(Date, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function tapTimes(times: number, advanceMs = 0) {
  for (let i = 0; i < times; i += 1) {
    clock += advanceMs;
    await fireEvent.press(screen.getByTestId('tap-area'));
  }
}

async function renderCounter() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <CounterScreen />
    </SafeAreaProvider>,
  );
  await screen.findByTestId('tap-area');
}

describe('counter screen', () => {
  it('counts one per tap', async () => {
    await renderCounter();
    await tapTimes(3, 10);
    expect(screen.getByText('DIKRI 1 / 3 · 3 / 100')).toBeTruthy();
  });

  it('locks taps briefly after an item completes', async () => {
    mockCollectionId = 'tasbih';
    await renderCounter();
    await tapTimes(33, 1);
    // The first item is done; a leftover tap right away must not count.
    await tapTimes(1, 1);
    expect(screen.getByText('DIKRI 2 / 3 · 33 / 100')).toBeTruthy();
    // After the lock window the next tap counts on the second dhikr.
    await tapTimes(1, 500);
    expect(screen.getByText('DIKRI 2 / 3 · 34 / 100')).toBeTruthy();
  });

  it('undo removes the last count', async () => {
    await renderCounter();
    await tapTimes(2, 10);
    await fireEvent.press(screen.getByLabelText('Ka noqo tirintii ugu dambaysay'));
    expect(screen.getByText('DIKRI 1 / 3 · 1 / 100')).toBeTruthy();
  });

  it('shows completion with new round and home buttons, and stops counting', async () => {
    mockCollectionId = 'tiny';
    await renderCounter();
    await tapTimes(2, 10);
    expect(screen.getByText('DHAMMAYSTIRAN · 2 / 2')).toBeTruthy();
    expect(screen.getByText('Taqabbal Allaahu minnaa wa minkum')).toBeTruthy();
    expect(screen.getByLabelText('Wareeg cusub')).toBeTruthy();
    expect(screen.getByLabelText('Bogga hore')).toBeTruthy();

    await tapTimes(1, 600);
    expect(screen.getByText('DHAMMAYSTIRAN · 2 / 2')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Wareeg cusub'));
    expect(screen.getByText('DIKRI 1 / 1 · 0 / 2')).toBeTruthy();
  });

  it('plays a selection haptic per count and a light impact on undo', async () => {
    await renderCounter();
    await tapTimes(2, 10);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    await fireEvent.press(screen.getByLabelText('Ka noqo tirintii ugu dambaysay'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});
