export interface Instrument {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface UserInstrument {
  user_id: string;
  instrument_id: string;
  created_at: string;
  instrument?: Instrument;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  instrument_id: string;
  date: string;
  created_at: string;
  instrument?: Instrument;
  items?: JournalItem[];
  videos?: JournalVideo[];
}

export type JournalItemType = 'learned' | 'did' | 'todo';

export interface JournalItem {
  id: string;
  entry_id: string;
  type: JournalItemType;
  content: string;
  position: number;
  created_at: string;
}

export interface JournalVideo {
  id: string;
  entry_id: string;
  local_uri: string;
  title: string | null;
  created_at: string;
}
