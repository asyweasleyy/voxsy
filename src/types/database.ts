export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      instruments: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_instruments: {
        Row: {
          user_id: string;
          instrument_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          instrument_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          instrument_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_instruments_instrument_id_fkey';
            columns: ['instrument_id'];
            referencedRelation: 'instruments';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          instrument_id: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instrument_id: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instrument_id?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'journal_entries_instrument_id_fkey';
            columns: ['instrument_id'];
            referencedRelation: 'instruments';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_items: {
        Row: {
          id: string;
          entry_id: string;
          type: 'learned' | 'did' | 'todo';
          content: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          type: 'learned' | 'did' | 'todo';
          content: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          type?: 'learned' | 'did' | 'todo';
          content?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'journal_items_entry_id_fkey';
            columns: ['entry_id'];
            referencedRelation: 'journal_entries';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_videos: {
        Row: {
          id: string;
          entry_id: string;
          local_uri: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          local_uri: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          local_uri?: string;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'journal_videos_entry_id_fkey';
            columns: ['entry_id'];
            referencedRelation: 'journal_entries';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      journal_item_type: 'learned' | 'did' | 'todo';
    };
  };
}

// Convenience row types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Instrument = Tables<'instruments'>;
export type UserInstrument = Tables<'user_instruments'>;
export type JournalEntry = Tables<'journal_entries'>;
export type JournalItem = Tables<'journal_items'>;
export type JournalVideo = Tables<'journal_videos'>;

export type JournalItemType = 'learned' | 'did' | 'todo';

// Joined types used by the UI
export type JournalEntryWithItems = JournalEntry & {
  journal_items: JournalItem[];
  journal_videos: JournalVideo[];
  instruments: Instrument;
};
