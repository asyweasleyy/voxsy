import { supabase } from '../lib/supabase';
import type { JournalItem, JournalItemType } from '../types';

export const journalItemsService = {
  async getForEntry(entryId: string): Promise<JournalItem[]> {
    const { data, error } = await supabase
      .from('journal_items')
      .select('*')
      .eq('entry_id', entryId)
      .order('position');
    if (error) throw error;
    return data;
  },

  async create(
    entryId: string,
    type: JournalItemType,
    content: string,
    position: number,
  ): Promise<JournalItem> {
    const { data, error } = await supabase
      .from('journal_items')
      .insert({ entry_id: entryId, type, content, position })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, content: string): Promise<JournalItem> {
    const { data, error } = await supabase
      .from('journal_items')
      .update({ content })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async reorder(items: Pick<JournalItem, 'id' | 'position'>[]): Promise<void> {
    const updates = items.map(({ id, position }) =>
      supabase.from('journal_items').update({ position }).eq('id', id),
    );
    await Promise.all(updates);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
