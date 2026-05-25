-- Engagement workflow foundations (Phase 2): due dates, review flow state, deliverables.

ALTER TABLE taxgpt.accounting_engagements
  ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE taxgpt.accounting_engagements
  ADD COLUMN IF NOT EXISTS review_flow_status VARCHAR(24);

UPDATE taxgpt.accounting_engagements
SET review_flow_status = 'not_started'
WHERE review_flow_status IS NULL;

ALTER TABLE taxgpt.accounting_engagements
  ALTER COLUMN review_flow_status SET DEFAULT 'not_started';

ALTER TABLE taxgpt.accounting_engagements
  ALTER COLUMN review_flow_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_engagements_review_flow_status_chk'
  ) THEN
    ALTER TABLE taxgpt.accounting_engagements
      ADD CONSTRAINT accounting_engagements_review_flow_status_chk
      CHECK (review_flow_status IN ('not_started', 'preparer_in_progress', 'reviewer_in_progress', 'review_notes_open', 'approved'));
  END IF;
END $$;

ALTER TABLE taxgpt.accounting_engagements
  ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

UPDATE taxgpt.accounting_engagements
SET deliverables = '[]'::jsonb
WHERE deliverables IS NULL;

ALTER TABLE taxgpt.accounting_engagements
  ALTER COLUMN deliverables SET DEFAULT '[]'::jsonb;

ALTER TABLE taxgpt.accounting_engagements
  ALTER COLUMN deliverables SET NOT NULL;
