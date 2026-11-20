import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CounterScreen from '../../app/session/[collectionId]';
import * as Haptics from 'expo-haptics';

import { DEFAULT_SETTINGS, type AppSettings } from '../../src/db/settingsRepo';
import { SettingsProvider } from '../../src/hooks/useSettings';
import { resetFakeStore } from './fakeSessionService';

// SQLite is replaced by an in-memory fake that uses the real core rules.
jest.mock('@/services/sessionService', () => require('./fakeSessionService'));

let mockCollectionId = 'tasbih';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ collectionId: mockCollectionId }),
  // The screen is always focused in these tests.
  useFocusEffect: (effect: () => void | (() => void)) => require('react').useEffect(effect, [effect]),
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Tracks whether a keep-awake lock is held (acquired on mount, released on unmount).
let mockAwake = 0;
jest.mock('expo-keep-awake', () => {
  const { useEffect } = require('react');
  return {
    useKeepAwake: () =>
      useEffect(() => {
        mockAwake += 1;
        return () => {
          mockAwake -= 1;
        };
      }, []),
  };
});

// Fake native volume-keys module: tests press keys through mockVolumeKey.
let mockVolumeListener: ((key: 'up' | 'down') => void) | null = null;
jest.mock('../../modules/volume-keys', () => ({
  startVolumeKeys: (onKey: (key: 'up' | 'down') => void) => {
    mockVolumeListener = onKey;
    return () => {
      mockVolumeListener = null;
    };
  },
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

async function renderCounter(settings: Partial<AppSettings> = {}) {
  await render(
    <SettingsProvider initial={{ ...DEFAULT_SETTINGS, ...settings }}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <CounterScreen />
      </SafeAreaProvider>
    </SettingsProvider>,
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

  it('keeps the screen awake while counting and releases it on completion and leave', async () => {
    mockCollectionId = 'tiny';
    mockAwake = 0;
    await renderCounter();
    expect(mockAwake).toBe(1);
    await tapTimes(2, 10);
    expect(screen.getByText('DHAMMAYSTIRAN · 2 / 2')).toBeTruthy();
    expect(mockAwake).toBe(0);
    await fireEvent.press(screen.getByLabelText('Wareeg cusub'));
    expect(mockAwake).toBe(1);
    await screen.unmount();
    expect(mockAwake).toBe(0);
  });

  it('a Volume Down press counts once and Volume Up undoes', async () => {
    await renderCounter({ volumeKeys: true });
    expect(mockVolumeListener).not.toBeNull();
    clock += 10;
    await act(async () => mockVolumeListener!('down'));
    expect(screen.getByText('DIKRI 1 / 3 · 1 / 100')).toBeTruthy();
    clock += 10;
    await act(async () => mockVolumeListener!('up'));
    expect(screen.getByText('DIKRI 1 / 3 · 0 / 100')).toBeTruthy();
  });

  it('leaves the volume keys alone when the setting is off and after leaving', async () => {
    await renderCounter({ volumeKeys: false });
    expect(mockVolumeListener).toBeNull();
    await screen.unmount();
    await renderCounter({ volumeKeys: true });
    expect(mockVolumeListener).not.toBeNull();
    await screen.unmount();
    expect(mockVolumeListener).toBeNull();
  });
});
