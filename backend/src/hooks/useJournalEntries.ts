import { useCallback, useEffect, useState } from 'react';
import { journalEntriesService } from '../services/journalEntriesService';
import type { JournalEntry } from '../types';

export function useJournalEntries(userId: string | null) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await journalEntriesService.getForUser(userId);
      setEntries(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (instrumentId: string, date: string) => {
    if (!userId) return;
    const entry = await journalEntriesService.create(userId, instrumentId, date);
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    await journalEntriesService.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, error, create, remove, refresh: load };
}

export function useJournalEntriesByDate(userId: string | null, date: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    journalEntriesService
      .getByDate(userId, date)
      .then(setEntries)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId, date]);

  return { entries, loading, error };
}
