import { useCallback, useState } from 'react';
import {
  addVideo,
  deleteVideo,
  getVideosByEntry,
  type JournalVideo,
} from '../services/video.service';

export function useVideos() {
  const [videos, setVideos] = useState<JournalVideo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVideos = useCallback(async (entryId: string) => {
    setLoading(true);
    try {
      const data = await getVideosByEntry(entryId);
      setVideos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewVideo = useCallback(
    async (entryId: string, localUri: string, title?: string) => {
      const video = await addVideo(entryId, localUri, title);
      setVideos((v) => [...v, video]);
      return video;
    },
    [],
  );

  const removeVideo = useCallback(async (videoId: string) => {
    setVideos((v) => v.filter((vid) => vid.id !== videoId));
    await deleteVideo(videoId);
  }, []);

  return { videos, loading, loadVideos, addNewVideo, removeVideo };
}
