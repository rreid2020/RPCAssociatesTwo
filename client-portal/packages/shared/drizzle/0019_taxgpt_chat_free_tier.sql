ALTER TABLE taxgpt.chat_sessions
  ADD COLUMN IF NOT EXISTS workspace_id uuid,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamp NOT NULL DEFAULT now();

ALTER TABLE taxgpt.chat_messages
  ADD COLUMN IF NOT EXISTS model_used text,
  ADD COLUMN IF NOT EXISTS input_tokens integer,
  ADD COLUMN IF NOT EXISTS output_tokens integer,
  ADD COLUMN IF NOT EXISTS total_tokens integer,
  ADD COLUMN IF NOT EXISTS message_content text;

CREATE TABLE IF NOT EXISTS taxgpt.citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES taxgpt.chat_messages(id) ON DELETE CASCADE,
  source_chunk_id uuid REFERENCES taxgpt.chunks(id) ON DELETE SET NULL,
  excerpt text NOT NULL,
  confidence_score numeric(6, 5),
  source_type varchar(32),
  source_title text,
  section_reference text,
  source_url text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  message_id uuid NOT NULL REFERENCES taxgpt.chat_messages(id) ON DELETE CASCADE,
  feedback_type varchar(32) NOT NULL,
  comments text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.retrieval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  conversation_id uuid REFERENCES taxgpt.chat_sessions(id) ON DELETE SET NULL,
  message_id uuid REFERENCES taxgpt.chat_messages(id) ON DELETE SET NULL,
  query text NOT NULL,
  retrieved_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  similarity_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  response_time_ms integer,
  model_used text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  prompt_count integer NOT NULL DEFAULT 1,
  token_usage integer NOT NULL DEFAULT 0,
  recorded_at timestamp NOT NULL DEFAULT now(),
  plan_type varchar(32) NOT NULL DEFAULT 'FREE',
  date_bucket date NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS chat_sessions_user_updated_idx
  ON taxgpt.chat_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS chat_sessions_workspace_updated_idx
  ON taxgpt.chat_sessions (workspace_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
  ON taxgpt.chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS citations_message_idx
  ON taxgpt.citations (message_id);

CREATE INDEX IF NOT EXISTS feedback_user_created_idx
  ON taxgpt.feedback (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS retrieval_logs_user_created_idx
  ON taxgpt.retrieval_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS usage_tracking_user_date_idx
  ON taxgpt.usage_tracking (user_id, date_bucket);

