import { supabase } from '../lib/supabase';

export interface JournalVideo {
  id: string;
  entry_id: string;
  local_uri: string;
  title: string | null;
  created_at: string;
}

export async function addVideo(
  entryId: string,
  localUri: string,
  title?: string,
): Promise<JournalVideo> {
  const { data, error } = await supabase
    .from('journal_videos')
    .insert({ entry_id: entryId, local_uri: localUri, title: title ?? null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JournalVideo;
}

export async function getVideosByEntry(entryId: string): Promise<JournalVideo[]> {
  const { data, error } = await supabase
    .from('journal_videos')
    .select('*')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as JournalVideo[];
}

export async function deleteVideo(videoId: string): Promise<void> {
  const { error } = await supabase
    .from('journal_videos')
    .delete()
    .eq('id', videoId);

  if (error) throw new Error(error.message);
}
