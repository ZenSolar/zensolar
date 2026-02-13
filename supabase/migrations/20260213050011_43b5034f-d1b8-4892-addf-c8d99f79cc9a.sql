
-- Snapshot table for daily schema state tracking
CREATE TABLE public.work_journal_snapshots_schema (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date date NOT NULL UNIQUE,
  tables_snapshot jsonb NOT NULL DEFAULT '[]',
  columns_snapshot jsonb NOT NULL DEFAULT '[]',
  policies_snapshot jsonb NOT NULL DEFAULT '[]',
  functions_snapshot jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.work_journal_snapshots_schema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.work_journal_snapshots_schema FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RPC function to return current public schema state as JSONB
CREATE OR REPLACE FUNCTION public.get_schema_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'tables', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('table_name', table_name) ORDER BY table_name)
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ), '[]'::jsonb),
    'columns', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'table_name', table_name,
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable
      ) ORDER BY table_name, ordinal_position)
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    ), '[]'::jsonb),
    'policies', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'table_name', tablename,
        'policy_name', policyname,
        'cmd', cmd,
        'permissive', permissive
      ) ORDER BY tablename, policyname)
      FROM pg_policies 
      WHERE schemaname = 'public'
    ), '[]'::jsonb),
    'functions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'function_name', routine_name,
        'return_type', data_type
      ) ORDER BY routine_name)
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    ), '[]'::jsonb)
  );
$$;
