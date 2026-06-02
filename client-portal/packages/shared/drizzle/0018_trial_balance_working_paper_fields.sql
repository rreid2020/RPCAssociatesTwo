-- Per-account working paper fields on imported trial balance rows
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS adjustment_debit NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS adjustment_credit NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS review_status VARCHAR(24) NOT NULL DEFAULT 'needs_work';
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS workpaper_note TEXT;
