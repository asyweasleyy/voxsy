import { supabase } from '../lib/supabase';
import type { UserInstrument } from '../types';

export const userInstrumentsService = {
  async getForUser(userId: string): Promise<UserInstrument[]> {
    const { data, error } = await supabase
      .from('user_instruments')
      .select('*, instrument:instruments(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async add(userId: string, instrumentId: string): Promise<UserInstrument> {
    const { data, error } = await supabase
      .from('user_instruments')
      .insert({ user_id: userId, instrument_id: instrumentId })
      .select('*, instrument:instruments(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async remove(userId: string, instrumentId: string): Promise<void> {
    const { error } = await supabase
      .from('user_instruments')
      .delete()
      .eq('user_id', userId)
      .eq('instrument_id', instrumentId);
    if (error) throw error;
  },
};
