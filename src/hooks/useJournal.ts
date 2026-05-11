import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addItem,
  deleteItem,
  getEntryByDate,
  getOrCreateEntry,
  JournalEntryWithItems,
  JournalItem,
  JournalItemType,
  reorderItems,
  updateItem,
} from '../services/journal.service';

interface UseJournalOptions {
  userId: string;
  instrumentId: string;
  date: string;
}

interface UseJournalResult {
  entry: JournalEntryWithItems | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addJournalItem: (type: JournalItemType, content: string) => Promise<void>;
  updateJournalItem: (itemId: string, content: string) => Promise<void>;
  deleteJournalItem: (itemId: string) => Promise<void>;
  reorderJournalItems: (orderedIds: string[]) => Promise<void>;
}

export function useJournal({
  userId,
  instrumentId,
  date,
}: UseJournalOptions): UseJournalResult {
  const [entry, setEntry] = useState<JournalEntryWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !instrumentId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getEntryByDate(userId, instrumentId, date);
      setEntry(result);
      entryIdRef.current = result?.id ?? null;
    } catch (e: any) {
      setError(e.message ?? 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  }, [userId, instrumentId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureEntry = useCallback(async (): Promise<string> => {
    if (entryIdRef.current) return entryIdRef.current;
    const created = await getOrCreateEntry(userId, instrumentId, date);
    entryIdRef.current = created.id;
    return created.id;
  }, [userId, instrumentId, date]);

  const addJournalItem = useCallback(
    async (type: JournalItemType, content: string) => {
      setError(null);
      try {
        const eid = await ensureEntry();
        const item = await addItem(eid, type, content);
        setEntry((prev) =>
          prev
            ? { ...prev, items: [...prev.items, item] }
            : null,
        );
      } catch (e: any) {
        setError(e.message ?? 'Failed to add item');
        throw e;
      }
    },
    [ensureEntry],
  );

  const updateJournalItem = useCallback(
    async (itemId: string, content: string) => {
      setError(null);
      try {
        const updated = await updateItem(itemId, content);
        setEntry((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) =>
                  i.id === itemId ? updated : i,
                ),
              }
            : null,
        );
      } catch (e: any) {
        setError(e.message ?? 'Failed to update item');
        throw e;
      }
    },
    [],
  );

  const deleteJournalItem = useCallback(async (itemId: string) => {
    setError(null);
    try {
      await deleteItem(itemId);
      setEntry((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) }
          : null,
      );
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete item');
      throw e;
    }
  }, []);

  const reorderJournalItems = useCallback(
    async (orderedIds: string[]) => {
      setError(null);
      // Optimistic update
      setEntry((prev) => {
        if (!prev) return null;
        const map = new Map<string, JournalItem>(prev.items.map((i) => [i.id, i]));
        const reordered = orderedIds
          .map((id, index) => {
            const item = map.get(id);
            return item ? { ...item, position: index } : null;
          })
          .filter((i): i is JournalItem => i !== null);
        return { ...prev, items: reordered };
      });
      try {
        const eid = entryIdRef.current;
        if (eid) await reorderItems(eid, orderedIds);
      } catch (e: any) {
        setError(e.message ?? 'Failed to reorder items');
        await load(); // rollback optimistic update
        throw e;
      }
    },
    [load],
  );

  return {
    entry,
    loading,
    error,
    refresh: load,
    addJournalItem,
    updateJournalItem,
    deleteJournalItem,
    reorderJournalItems,
  };
}
