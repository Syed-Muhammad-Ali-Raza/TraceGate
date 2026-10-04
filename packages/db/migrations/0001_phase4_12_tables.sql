CREATE TABLE "eval_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eval_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"reasoning" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"judge_model" text NOT NULL,
	"criteria" text NOT NULL,
	"sample_rate" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid NOT NULL,
	"prompt_version_id" uuid NOT NULL,
	"traffic_pct" integer DEFAULT 50 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"api_key_id" uuid,
	"trace_id" text,
	"session_id" text,
	"user_ref" text,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status_code" integer NOT NULL,
	"error_type" text,
	"is_stream" boolean DEFAULT false NOT NULL,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"cached_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"latency_ms" integer,
	"ttft_ms" integer,
	"prompt_version_id" uuid,
	"experiment_variant" text,
	"request_body" jsonb,
	"response_body" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_per_1m" numeric(12, 6) NOT NULL,
	"output_per_1m" numeric(12, 6) NOT NULL,
	"cached_input_per_1m" numeric(12, 6),
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"iv" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"model" text NOT NULL,
	"day" timestamp with time zone NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(14, 6) DEFAULT '0' NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"p50" integer,
	"p95" integer
);
--> statement-breakpoint
CREATE TABLE "usage_hourly" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"model" text NOT NULL,
	"hour" timestamp with time zone NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(14, 6) DEFAULT '0' NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"p50" integer,
	"p95" integer
);
--> statement-breakpoint
ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_eval_id_evals_id_fk" FOREIGN KEY ("eval_id") REFERENCES "public"."evals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evals" ADD CONSTRAINT "evals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_requests" ADD CONSTRAINT "llm_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_requests" ADD CONSTRAINT "llm_requests_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_requests" ADD CONSTRAINT "llm_requests_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_keys" ADD CONSTRAINT "provider_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_daily" ADD CONSTRAINT "usage_daily_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_hourly" ADD CONSTRAINT "usage_hourly_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;