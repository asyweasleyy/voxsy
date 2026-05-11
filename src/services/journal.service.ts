import { supabase } from '../lib/supabase';

export type JournalItemType = 'learned' | 'did' | 'todo';

export interface JournalItem {
  id: string;
  entry_id: string;
  type: JournalItemType;
  content: string;
  position: number;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  instrument_id: string;
  date: string;
  created_at: string;
}

export interface JournalEntryWithItems extends JournalEntry {
  instrument_name: string;
  instrument_emoji: string;
  items: JournalItem[];
}

export interface MonthEntry {
  id: string;
  instrument_id: string;
  instrument_name: string;
  instrument_emoji: string;
  date: string;
  created_at: string;
  item_count: number;
}

export async function getOrCreateEntry(
  userId: string,
  instrumentId: string,
  date: string,
): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { user_id: userId, instrument_id: instrumentId, date },
      { onConflict: 'user_id,instrument_id,date', ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntry;
}

export async function getEntriesByMonth(
  userId: string,
  year: number,
  month: number,
): Promise<MonthEntry[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('journal_entries')
    .select(`
      id,
      instrument_id,
      date,
      created_at,
      instruments ( name, emoji ),
      journal_items ( id )
    `)
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  if (error) throw error;

  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    instrument_id: row.instrument_id,
    instrument_name: row.instruments?.name ?? '',
    instrument_emoji: row.instruments?.emoji ?? '',
    date: row.date,
    created_at: row.created_at,
    item_count: (row.journal_items as any[])?.length ?? 0,
  }));
}

export async function getEntryByDate(
  userId: string,
  instrumentId: string,
  date: string,
): Promise<JournalEntryWithItems | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select(`
      id,
      user_id,
      instrument_id,
      date,
      created_at,
      instruments ( name, emoji ),
      journal_items ( id, entry_id, type, content, position, created_at )
    `)
    .eq('user_id', userId)
    .eq('instrument_id', instrumentId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as any;
  return {
    id: row.id,
    user_id: row.user_id,
    instrument_id: row.instrument_id,
    date: row.date,
    created_at: row.created_at,
    instrument_name: row.instruments?.name ?? '',
    instrument_emoji: row.instruments?.emoji ?? '',
    items: ((row.journal_items as JournalItem[]) ?? []).sort(
      (a, b) => a.position - b.position,
    ),
  };
}

export async function addItem(
  entryId: string,
  type: JournalItemType,
  content: string,
): Promise<JournalItem> {
  const { data: existingItems, error: countError } = await supabase
    .from('journal_items')
    .select('position')
    .eq('entry_id', entryId)
    .order('position', { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextPosition =
    existingItems && existingItems.length > 0
      ? (existingItems[0] as any).position + 1
      : 0;

  const { data, error } = await supabase
    .from('journal_items')
    .insert({ entry_id: entryId, type, content, position: nextPosition })
    .select()
    .single();

  if (error) throw error;
  return data as JournalItem;
}

export async function updateItem(
  itemId: string,
  content: string,
): Promise<JournalItem> {
  const { data, error } = await supabase
    .from('journal_items')
    .update({ content })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as JournalItem;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('journal_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

export async function reorderItems(
  entryId: string,
  orderedIds: string[],
): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('journal_items')
      .update({ position: index })
      .eq('id', id)
      .eq('entry_id', entryId),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
