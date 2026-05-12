import { supabase } from '../lib/supabase';
import type { JournalEntry } from '../types';

export const journalEntriesService = {
  async getForUser(userId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, instrument:instruments(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByDate(userId: string, date: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, instrument:instruments(*), items:journal_items(*), videos:journal_videos(*)')
      .eq('user_id', userId)
      .eq('date', date)
      .order('position', { referencedTable: 'journal_items' });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, instrument:instruments(*), items:journal_items(*), videos:journal_videos(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(userId: string, instrumentId: string, date: string): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId, instrument_id: instrumentId, date })
      .select('*, instrument:instruments(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
