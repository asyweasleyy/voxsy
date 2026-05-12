import { useCallback, useEffect, useState } from 'react';
import { journalItemsService } from '../services/journalItemsService';
import type { JournalItem, JournalItemType } from '../types';

export function useJournalItems(entryId: string | null) {
  const [items, setItems] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!entryId) return;
    setLoading(true);
    try {
      const data = await journalItemsService.getForEntry(entryId);
      setItems(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (type: JournalItemType, content: string) => {
    if (!entryId) return;
    const position = items.length;
    const item = await journalItemsService.create(entryId, type, content, position);
    setItems((prev) => [...prev, item]);
    return item;
  }, [entryId, items.length]);

  const update = useCallback(async (id: string, content: string) => {
    const item = await journalItemsService.update(id, content);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await journalItemsService.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, add, update, remove, refresh: load };
}
