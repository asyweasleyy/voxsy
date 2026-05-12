-- Voxsy initial schema

-- instruments
CREATE TABLE IF NOT EXISTS public.instruments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_instruments
CREATE TABLE IF NOT EXISTS public.user_instruments (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, instrument_id)
);

-- journal_entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE RESTRICT,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, instrument_id, date)
);

CREATE INDEX idx_journal_entries_user_date ON public.journal_entries (user_id, date DESC);

-- journal_items
CREATE TABLE IF NOT EXISTS public.journal_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('learned', 'did', 'todo')),
  content    TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_items_entry ON public.journal_items (entry_id, position);

-- journal_videos
CREATE TABLE IF NOT EXISTS public.journal_videos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  local_uri  TEXT NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_videos_entry ON public.journal_videos (entry_id);
