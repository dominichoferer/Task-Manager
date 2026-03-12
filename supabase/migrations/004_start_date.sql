-- Add start_date for task period planning (Zeitraumplanung)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date timestamptz;
