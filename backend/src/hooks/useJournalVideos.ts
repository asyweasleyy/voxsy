import { useCallback, useEffect, useState } from 'react';
import { journalVideosService } from '../services/journalVideosService';
import type { JournalVideo } from '../types';

export function useJournalVideos(entryId: string | null) {
  const [videos, setVideos] = useState<JournalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!entryId) return;
    setLoading(true);
    try {
      const data = await journalVideosService.getForEntry(entryId);
      setVideos(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (localUri: string, title?: string) => {
    if (!entryId) return;
    const video = await journalVideosService.create(entryId, localUri, title);
    setVideos((prev) => [...prev, video]);
    return video;
  }, [entryId]);

  const update = useCallback(async (id: string, title: string) => {
    const video = await journalVideosService.update(id, title);
    setVideos((prev) => prev.map((v) => (v.id === id ? video : v)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await journalVideosService.delete(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { videos, loading, error, add, update, remove, refresh: load };
}
