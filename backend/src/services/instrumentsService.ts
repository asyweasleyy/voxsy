import { supabase } from '../lib/supabase';
import type { Instrument } from '../types';

export const instrumentsService = {
  async getAll(): Promise<Instrument[]> {
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Instrument> {
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};
