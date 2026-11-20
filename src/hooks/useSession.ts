import { useCallback, useEffect, useRef, useState } from 'react';

import { createTapGate, tap as coreTap } from '../core/session.ts';
import type { Session } from '../core/types.ts';
import { openSession, resetSession, tapSession, undoSession, type MutationResult } from '../services/sessionService';

export interface TapEvent {
  /** Increments on every saved tap, for animations. */
  seq: number;
  itemCompleted: boolean;
  roundCompleted: boolean;
}

export interface UseSession {
  session: Session | null;
  loading: boolean;
  loadError: boolean;
  /** Count shown in the save-failed toast, or null when hidden. */
  saveFailedAt: number | null;
  lastTap: TapEvent | null;
  /** Increments on every saved undo that changed a count. */
  undoSeq: number;
  tap(): void;
  undo(): void;
  reset(): void;
  newRound(): void;
  retry(): void;
  dismissSaveError(): void;
}

function total(session: Session): number {
  return session.items.reduce((sum, i) => sum + Math.min(i.count, i.target), 0);
}

export function useSession(collectionId: string | null): UseSession {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveFailedAt, setSaveFailedAt] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState<TapEvent | null>(null);
  const [undoSeq, setUndoSeq] = useState(0);

  // Saved state, plus a synchronous prediction that includes queued taps so
  // the transition lock engages at tap time.
  const confirmed = useRef<Session | null>(null);
  const predicted = useRef<Session | null>(null);
  const gate = useRef(createTapGate());
  const seq = useRef(0);
  const pending = useRef(0);
  const mounted = useRef(true);

  const apply = useCallback((s: Session) => {
    confirmed.current = s;
    setSession(s);
  }, []);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    mounted.current = true;
    if (!collectionId) return;
    openSession(collectionId)
      .then((s) => {
        if (!mounted.current) return;
        predicted.current = s;
        apply(s);
      })
      .catch(() => {
        if (mounted.current) setLoadError(true);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [collectionId, reloadKey, apply]);

  const onFailure = useCallback(() => {
    if (!mounted.current) return;
    // Roll the prediction back to what is really saved.
    predicted.current = confirmed.current;
    setSaveFailedAt(confirmed.current ? total(confirmed.current) : 0);
  }, []);

  const tap = useCallback(() => {
    const p = predicted.current;
    if (!p || p.status === 'completed') return;
    const now = Date.now();
    if (!gate.current.accept(now)) return;
    const guess = coreTap(p, new Date(now));
    if (!guess.accepted) return;
    predicted.current = guess.session;
    if (guess.itemCompleted) gate.current.lock(now);

    pending.current += 1;
    tapSession(p.id)
      .then((r: MutationResult) => {
        if (!mounted.current) return;
        apply(r.session);
        if (r.changed) {
          seq.current += 1;
          setLastTap({ seq: seq.current, itemCompleted: r.itemCompleted, roundCompleted: r.roundCompleted });
          setSaveFailedAt(null);
        }
      })
      .catch(onFailure)
      .finally(() => {
        pending.current -= 1;
        // Once every queued tap has settled, the prediction equals saved state.
        if (pending.current === 0) predicted.current = confirmed.current;
      });
  }, [apply, onFailure]);

  const run = useCallback(
    (op: (id: string) => Promise<MutationResult>, onChanged?: () => void) => {
      const s = predicted.current;
      if (!s) return;
      op(s.id)
        .then((r) => {
          if (!mounted.current) return;
          predicted.current = r.session;
          apply(r.session);
          if (r.changed) onChanged?.();
        })
        .catch(onFailure);
    },
    [apply, onFailure],
  );

  const undo = useCallback(() => run(undoSession, () => setUndoSeq((n) => n + 1)), [run]);
  const reset = useCallback(() => run(resetSession), [run]);

  const newRound = useCallback(() => {
    if (!collectionId) return;
    openSession(collectionId)
      .then((s) => {
        if (!mounted.current) return;
        predicted.current = s;
        setLastTap(null);
        apply(s);
      })
      .catch(onFailure);
  }, [collectionId, apply, onFailure]);

  return {
    session,
    loading,
    loadError,
    saveFailedAt,
    lastTap,
    undoSeq,
    tap,
    undo,
    reset,
    newRound,
    retry: () => {
      setLoading(true);
      setLoadError(false);
      setReloadKey((k) => k + 1);
    },
    dismissSaveError: () => setSaveFailedAt(null),
  };
}
