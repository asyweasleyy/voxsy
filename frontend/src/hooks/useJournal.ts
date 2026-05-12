import { useCallback, useState } from 'react';
import {
  addItem,
  deleteItem,
  getEntryByDate,
  getOrCreateEntry,
  reorderItems,
  updateItem,
  type JournalEntry,
  type JournalEntryWithItems,
  type JournalItem,
  type JournalItemType,
} from '../services/journal.service';

interface JournalState {
  entry: JournalEntryWithItems | null;
  loading: boolean;
  error: string | null;
}

export function useJournal(userId: string | undefined) {
  const [state, setState] = useState<JournalState>({
    entry: null,
    loading: false,
    error: null,
  });

  const loadEntry = useCallback(
    async (instrumentId: string, date: string) => {
      if (!userId) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const entry = await getEntryByDate(userId, instrumentId, date);
        setState({ entry, loading: false, error: null });
      } catch (e: any) {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    },
    [userId],
  );

  const ensureEntry = useCallback(
    async (instrumentId: string, date: string): Promise<JournalEntry | null> => {
      if (!userId) return null;
      try {
        return await getOrCreateEntry(userId, instrumentId, date);
      } catch {
        return null;
      }
    },
    [userId],
  );

  const handleAdd = useCallback(
    async (entryId: string, type: JournalItemType, content: string) => {
      try {
        const item = await addItem(entryId, type, content);
        setState((s) =>
          s.entry
            ? { ...s, entry: { ...s.entry, items: [...s.entry.items, item] } }
            : s,
        );
      } catch (e: any) {
        setState((s) => ({ ...s, error: e.message }));
      }
    },
    [],
  );

  const handleUpdate = useCallback(async (itemId: string, content: string) => {
    try {
      const updated = await updateItem(itemId, content);
      setState((s) =>
        s.entry
          ? {
              ...s,
              entry: {
                ...s.entry,
                items: s.entry.items.map((i) => (i.id === itemId ? updated : i)),
              },
            }
          : s,
      );
    } catch (e: any) {
      setState((s) => ({ ...s, error: e.message }));
    }
  }, []);

  const handleDelete = useCallback(async (itemId: string) => {
    setState((s) =>
      s.entry
        ? {
            ...s,
            entry: {
              ...s.entry,
              items: s.entry.items.filter((i) => i.id !== itemId),
            },
          }
        : s,
    );
    try {
      await deleteItem(itemId);
    } catch (e: any) {
      setState((s) => ({ ...s, error: e.message }));
    }
  }, []);

  const handleReorder = useCallback(
    async (entryId: string, items: JournalItem[]) => {
      setState((s) =>
        s.entry ? { ...s, entry: { ...s.entry, items } } : s,
      );
      try {
        await reorderItems(
          entryId,
          items.map((i) => i.id),
        );
      } catch (e: any) {
        setState((s) => ({ ...s, error: e.message }));
      }
    },
    [],
  );

  return {
    ...state,
    loadEntry,
    ensureEntry,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleReorder,
  };
}
