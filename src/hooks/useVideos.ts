import { useState, useEffect, useCallback } from 'react';
import {
  addVideo,
  getVideosByEntry,
  deleteVideo,
  type JournalVideo,
} from '../services/video.service';

interface UseVideosResult {
  videos: JournalVideo[];
  loading: boolean;
  error: string | null;
  add: (localUri: string, title?: string) => Promise<void>;
  remove: (videoId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useVideos(entryId: string): UseVideosResult {
  const [videos, setVideos] = useState<JournalVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVideosByEntry(entryId);
      setVideos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (localUri: string, title?: string) => {
      setError(null);
      const video = await addVideo(entryId, localUri, title);
      setVideos((prev) => [...prev, video]);
    },
    [entryId],
  );

  const remove = useCallback(async (videoId: string) => {
    setError(null);
    await deleteVideo(videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  }, []);

  return { videos, loading, error, add, remove, refresh };
}
