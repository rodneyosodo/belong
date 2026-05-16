import { useCallback, useMemo, useRef, useState } from 'react';

export interface HistoryEntry {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  description: string;
}

export function useHistory() {
  const pastRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const busyRef = useRef(false);
  const [revision, setRevision] = useState(0);

  const bump = useCallback(() => setRevision((n) => n + 1), []);

  const push = useCallback(
    (entry: HistoryEntry) => {
      pastRef.current = [...pastRef.current, entry];
      futureRef.current = [];
      bump();
    },
    [bump],
  );

  const undo = useCallback(async () => {
    if (pastRef.current.length === 0 || busyRef.current) return;
    busyRef.current = true;
    try {
      const entry = pastRef.current[pastRef.current.length - 1];
      await entry.undo();
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [entry, ...futureRef.current];
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      busyRef.current = false;
      bump();
    }
  }, [bump]);

  const redo = useCallback(async () => {
    if (futureRef.current.length === 0 || busyRef.current) return;
    busyRef.current = true;
    try {
      const entry = futureRef.current[0];
      await entry.redo();
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, entry];
    } catch (err) {
      console.error('Redo failed:', err);
    } finally {
      busyRef.current = false;
      bump();
    }
  }, [bump]);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    bump();
  }, [bump]);

  return useMemo(
    () => ({
      push,
      undo,
      redo,
      clear,
      canUndo: pastRef.current.length > 0 && !busyRef.current,
      canRedo: futureRef.current.length > 0 && !busyRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [push, undo, redo, clear, revision],
  );
}
