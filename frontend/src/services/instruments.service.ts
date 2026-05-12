import { supabase } from '../lib/supabase';

export interface Instrument {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export async function getAllInstruments(): Promise<Instrument[]> {
  const { data, error } = await supabase
    .from('instruments')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data as Instrument[]) ?? [];
}

export async function getUserInstruments(userId: string): Promise<Instrument[]> {
  const { data, error } = await supabase
    .from('user_instruments')
    .select('instruments ( id, name, emoji, created_at )')
    .eq('user_id', userId);

  if (error) throw error;

  return ((data as any[]) ?? [])
    .map((row) => row.instruments as Instrument)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function setUserInstruments(
  userId: string,
  instrumentIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('user_instruments')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  if (instrumentIds.length === 0) return;

  const rows = instrumentIds.map((instrument_id) => ({
    user_id: userId,
    instrument_id,
  }));

  const { error: insertError } = await supabase
    .from('user_instruments')
    .insert(rows);

  if (insertError) throw insertError;
}
