-- Voxsy seed data: instruments
INSERT INTO public.instruments (name, emoji) VALUES
  ('Guitar',       '🎸'),
  ('Bass Guitar',  '🎸'),
  ('Piano',        '🎹'),
  ('Keyboard',     '🎹'),
  ('Drums',        '🥁'),
  ('Violin',       '🎻'),
  ('Cello',        '🎻'),
  ('Saxophone',    '🎷'),
  ('Trumpet',      '🎺'),
  ('Trombone',     '🎺'),
  ('Flute',        '🪈'),
  ('Ukulele',      '🪗'),
  ('Voice',        '🎤'),
  ('Synthesizer',  '🎛️'),
  ('Other',        '🎵')
ON CONFLICT DO NOTHING;
