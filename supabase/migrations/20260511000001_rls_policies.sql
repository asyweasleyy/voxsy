-- Voxsy RLS policies

ALTER TABLE public.instruments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_videos   ENABLE ROW LEVEL SECURITY;

-- instruments: readable by all authenticated users
CREATE POLICY "instruments: select" ON public.instruments
  FOR SELECT TO authenticated USING (true);

-- user_instruments
CREATE POLICY "user_instruments: select own" ON public.user_instruments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_instruments: insert own" ON public.user_instruments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_instruments: delete own" ON public.user_instruments
  FOR DELETE USING (auth.uid() = user_id);

-- journal_entries
CREATE POLICY "journal_entries: select own" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "journal_entries: insert own" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries: update own" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "journal_entries: delete own" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- journal_items (access via entry ownership)
CREATE POLICY "journal_items: select own" ON public.journal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "journal_items: insert own" ON public.journal_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "journal_items: update own" ON public.journal_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "journal_items: delete own" ON public.journal_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

-- journal_videos (access via entry ownership)
CREATE POLICY "journal_videos: select own" ON public.journal_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "journal_videos: insert own" ON public.journal_videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "journal_videos: update own" ON public.journal_videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "journal_videos: delete own" ON public.journal_videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries e
      WHERE e.id = entry_id AND e.user_id = auth.uid()
    )
  );
