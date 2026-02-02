-- Enable pgvector extension (must be in public schema)
CREATE EXTENSION IF NOT EXISTS vector;

-- Set search path to taxgpt schema
SET search_path TO taxgpt, public;

-- Create sources table
CREATE TABLE IF NOT EXISTS "taxgpt"."sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"source_type" varchar(10) NOT NULL,
	"category" varchar(20) NOT NULL,
	"jurisdiction_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"last_crawled_at" timestamp,
	"last_ingested_at" timestamp,
	"ingest_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"content_hash" text,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "sources_url_unique" UNIQUE("url")
);

-- Create documents table
CREATE TABLE IF NOT EXISTS "taxgpt"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"user_id" text,
	"content_hash" text NOT NULL,
	"retrieved_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Create chunks table
CREATE TABLE IF NOT EXISTS "taxgpt"."chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"section_heading" text,
	"page_number" integer,
	"chunk_index" integer NOT NULL,
	"metadata" jsonb
);

-- Create embeddings table
CREATE TABLE IF NOT EXISTS "taxgpt"."embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_id" uuid NOT NULL,
	"embedding" vector(1536),
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "embeddings_chunk_id_unique" UNIQUE("chunk_id")
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS "taxgpt"."chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS "taxgpt"."chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb,
	"risk_level" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS "taxgpt"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);

-- Add foreign keys
DO $$ BEGIN
 ALTER TABLE "taxgpt"."documents" ADD CONSTRAINT "documents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "taxgpt"."sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "taxgpt"."chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "taxgpt"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "taxgpt"."embeddings" ADD CONSTRAINT "embeddings_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "taxgpt"."chunks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "taxgpt"."chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "taxgpt"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "sources_url_idx" ON "taxgpt"."sources" ("url");
CREATE INDEX IF NOT EXISTS "sources_ingest_status_idx" ON "taxgpt"."sources" ("ingest_status");
CREATE INDEX IF NOT EXISTS "sources_category_idx" ON "taxgpt"."sources" ("category");
CREATE INDEX IF NOT EXISTS "documents_source_id_idx" ON "taxgpt"."documents" ("source_id");
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "taxgpt"."documents" ("user_id");
CREATE INDEX IF NOT EXISTS "chunks_document_id_idx" ON "taxgpt"."chunks" ("document_id");
CREATE INDEX IF NOT EXISTS "embeddings_chunk_id_idx" ON "taxgpt"."embeddings" ("chunk_id");
CREATE INDEX IF NOT EXISTS "chat_messages_session_id_idx" ON "taxgpt"."chat_messages" ("session_id");
CREATE INDEX IF NOT EXISTS "chat_sessions_user_id_idx" ON "taxgpt"."chat_sessions" ("user_id");

-- Create vector similarity search index (HNSW for better performance)
CREATE INDEX IF NOT EXISTS "embeddings_embedding_idx" ON "taxgpt"."embeddings" USING hnsw ("embedding" vector_cosine_ops);





