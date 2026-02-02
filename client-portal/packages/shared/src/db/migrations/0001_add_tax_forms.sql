-- Migration: Add tax forms tables

CREATE TABLE IF NOT EXISTS "taxgpt"."tax_forms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "form_code" varchar(30) NOT NULL,
  "form_name" text NOT NULL,
  "jurisdiction" varchar(20) DEFAULT 'federal' NOT NULL,
  "category" text NOT NULL,
  "summary" text NOT NULL,
  "who_must_file" text NOT NULL,
  "when_required" text NOT NULL,
  "documents_that_feed_into" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "common_mistakes" text,
  "affects" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "related_form_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "tax_years_supported" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "risk_level" varchar(10) DEFAULT 'low' NOT NULL,
  "last_reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tax_forms_form_code_unique" UNIQUE("form_code")
);

CREATE TABLE IF NOT EXISTS "taxgpt"."tax_form_source_refs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tax_form_id" uuid NOT NULL,
  "source_type" varchar(20) NOT NULL,
  "internal_document_id" uuid,
  "external_url" text,
  "title" text NOT NULL,
  "snippet" text,
  "authority" varchar(20) DEFAULT 'cra' NOT NULL,
  "last_verified_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "taxgpt"."tax_form_aliases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tax_form_id" uuid NOT NULL,
  "alias" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "taxgpt"."tax_form_source_refs"
  ADD CONSTRAINT "tax_form_source_refs_tax_form_id_tax_forms_id_fk"
  FOREIGN KEY ("tax_form_id") REFERENCES "taxgpt"."tax_forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "taxgpt"."tax_form_source_refs"
  ADD CONSTRAINT "tax_form_source_refs_internal_document_id_documents_id_fk"
  FOREIGN KEY ("internal_document_id") REFERENCES "taxgpt"."documents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "taxgpt"."tax_form_aliases"
  ADD CONSTRAINT "tax_form_aliases_tax_form_id_tax_forms_id_fk"
  FOREIGN KEY ("tax_form_id") REFERENCES "taxgpt"."tax_forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "tax_forms_form_code_idx" ON "taxgpt"."tax_forms" ("form_code");
CREATE INDEX IF NOT EXISTS "tax_forms_category_idx" ON "taxgpt"."tax_forms" ("category");
CREATE INDEX IF NOT EXISTS "tax_form_source_refs_tax_form_id_idx" ON "taxgpt"."tax_form_source_refs" ("tax_form_id");
CREATE INDEX IF NOT EXISTS "tax_form_aliases_tax_form_id_idx" ON "taxgpt"."tax_form_aliases" ("tax_form_id");
