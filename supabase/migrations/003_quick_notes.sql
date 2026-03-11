-- Quick notes table
CREATE TABLE public.quick_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quick_notes_user_id_idx ON public.quick_notes(user_id);
CREATE INDEX quick_notes_created_at_idx ON public.quick_notes(created_at DESC);

ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quick notes"
  ON public.quick_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick notes"
  ON public.quick_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick notes"
  ON public.quick_notes FOR DELETE
  USING (auth.uid() = user_id);
