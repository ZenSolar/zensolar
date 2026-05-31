ALTER TABLE public.deason_documents
  ADD COLUMN IF NOT EXISTS financing_type text
    CHECK (financing_type IN ('cash','loan','ppa','lease','other','unsure'));

COMMENT ON COLUMN public.deason_documents.financing_type IS
  'User-confirmed installation financing type for contract/PPA/loan documents. Used by Deason to ground analysis (e.g. "based on your PPA…").';