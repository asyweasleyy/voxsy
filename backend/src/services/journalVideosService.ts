import { supabase } from '../lib/supabase';
import type { JournalVideo } from '../types';

export const journalVideosService = {
  async getForEntry(entryId: string): Promise<JournalVideo[]> {
    const { data, error } = await supabase
      .from('journal_videos')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at');
    if (error) throw error;
    return data;
  },

  async create(entryId: string, localUri: string, title?: string): Promise<JournalVideo> {
    const { data, error } = await supabase
      .from('journal_videos')
      .insert({ entry_id: entryId, local_uri: localUri, title: title ?? null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, title: string): Promise<JournalVideo> {
    const { data, error } = await supabase
      .from('journal_videos')
      .update({ title })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_videos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
