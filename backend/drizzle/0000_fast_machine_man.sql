CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" varchar(100) NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" varchar(100) NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_authenticators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"report_count" integer DEFAULT 0,
	"last_reported_at" timestamp,
	"scam_scan_verdict" varchar(20),
	"scam_scan_confidence" varchar(10),
	"scam_scan_explanation" text,
	"scam_scan_evidence" text,
	"scam_scan_model" varchar(100),
	"scam_scan_checked_at" timestamp,
	"scam_ban_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"soft_deleted_at" timestamp,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "download_dedupes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"identity_hash" varchar(128) NOT NULL,
	"hour_start" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding_skill_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"embedding_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_backup_sync_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"cursor" text,
	"prune_cursor" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_backup_sync_state_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "global_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"active_skills_count" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "global_stats_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 0,
	"limit" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reserved_slugs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"original_owner_user_id" uuid NOT NULL,
	"deleted_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"reason" text,
	"released_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skill_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"kind" varchar(30) NOT NULL,
	"by_user_id" uuid NOT NULL,
	"at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"downloads" integer DEFAULT 0,
	"installs" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"is_latest" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"visibility" varchar(20) DEFAULT 'latest',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_leaderboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(50) NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"range_start_day" integer NOT NULL,
	"range_end_day" integer NOT NULL,
	"items" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_ownership_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"message" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_search_digest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"slug" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"summary" text,
	"owner_user_id" uuid NOT NULL,
	"owner_handle" varchar(100),
	"owner_name" varchar(255),
	"owner_display_name" varchar(255),
	"owner_image" text,
	"canonical_skill_id" uuid,
	"fork_of_skill_id" uuid,
	"fork_of_kind" varchar(20),
	"fork_of_version" varchar(50),
	"fork_of_at" timestamp,
	"latest_version_id" uuid,
	"latest_version_summary" text,
	"tags" text,
	"badges" text,
	"stats_downloads" integer DEFAULT 0,
	"stats_stars" integer DEFAULT 0,
	"stats_installs_current" integer DEFAULT 0,
	"stats_installs_all_time" integer DEFAULT 0,
	"soft_deleted_at" timestamp,
	"moderation_status" varchar(20),
	"moderation_flags" text,
	"moderation_reason" text,
	"is_suspicious" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_slug_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"skill_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_stat_backfill_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"cursor" text,
	"done_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_stat_backfill_state_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "skill_stat_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"kind" varchar(30) NOT NULL,
	"delta_all_time" integer,
	"delta_current" integer,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skill_stat_update_cursors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"cursor_creation_time" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_stat_update_cursors_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "skill_version_fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"fingerprint" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"fingerprint" varchar(64),
	"changelog" text NOT NULL,
	"changelog_source" varchar(10),
	"files" text NOT NULL,
	"frontmatter" text,
	"metadata" text,
	"clawdis" text,
	"moltbot" text,
	"license" varchar(20),
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"soft_deleted_at" timestamp,
	"sha256hash" varchar(64),
	"vt_analysis" text,
	"llm_analysis" text,
	"static_scan" text
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"summary" text,
	"resource_id" text,
	"owner_user_id" uuid NOT NULL,
	"canonical_skill_id" uuid,
	"fork_of_skill_id" uuid,
	"fork_of_kind" varchar(20),
	"fork_of_version" varchar(50),
	"fork_of_at" timestamp,
	"latest_version_id" uuid,
	"tags" text,
	"soft_deleted_at" timestamp,
	"badges" text,
	"moderation_status" varchar(20),
	"moderation_notes" text,
	"moderation_reason" text,
	"moderation_verdict" varchar(20),
	"moderation_reason_codes" text,
	"moderation_evidence" text,
	"moderation_summary" text,
	"moderation_engine_version" varchar(50),
	"moderation_evaluated_at" timestamp,
	"moderation_source_version_id" uuid,
	"manual_override_verdict" varchar(10),
	"manual_override_note" text,
	"manual_override_reviewer_user_id" uuid,
	"manual_override_updated_at" timestamp,
	"quality_score" integer,
	"quality_decision" varchar(20),
	"quality_trust_tier" varchar(20),
	"quality_similar_recent_count" integer,
	"quality_reason" text,
	"quality_signals" text,
	"quality_evaluated_at" timestamp,
	"is_suspicious" boolean,
	"moderation_flags" text,
	"last_reviewed_at" timestamp,
	"scan_last_checked_at" timestamp,
	"scan_check_count" integer,
	"hidden_at" timestamp,
	"hidden_by" uuid,
	"report_count" integer DEFAULT 0,
	"last_reported_at" timestamp,
	"batch" varchar(100),
	"stats_downloads" integer DEFAULT 0,
	"stats_stars" integer DEFAULT 0,
	"stats_installs_current" integer DEFAULT 0,
	"stats_installs_all_time" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soul_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soul_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"soft_deleted_at" timestamp,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "soul_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soul_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"is_latest" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"visibility" varchar(20) DEFAULT 'latest',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soul_stars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soul_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soul_version_fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soul_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"fingerprint" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soul_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soul_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"fingerprint" varchar(64),
	"changelog" text NOT NULL,
	"changelog_source" varchar(10),
	"files" text NOT NULL,
	"frontmatter" text,
	"metadata" text,
	"clawdis" text,
	"moltbot" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"soft_deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "souls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"summary" text,
	"owner_user_id" uuid NOT NULL,
	"latest_version_id" uuid,
	"tags" text,
	"soft_deleted_at" timestamp,
	"stats_downloads" integer DEFAULT 0,
	"stats_stars" integer DEFAULT 0,
	"stats_versions" integer DEFAULT 0,
	"stats_comments" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill_installs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"active_roots" integer DEFAULT 0,
	"last_version" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "user_skill_root_installs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"root_id" varchar(500) NOT NULL,
	"skill_id" uuid NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_version" varchar(50),
	"removed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_sync_roots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"root_id" varchar(500) NOT NULL,
	"label" varchar(255) NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"expired_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"image" text,
	"email" varchar(255),
	"email_verification_time" timestamp,
	"phone" varchar(50),
	"phone_verification_time" timestamp,
	"is_anonymous" boolean DEFAULT false,
	"handle" varchar(100),
	"display_name" varchar(255),
	"bio" text,
	"role" varchar(20),
	"github_created_at" timestamp,
	"github_fetched_at" timestamp,
	"github_profile_synced_at" timestamp,
	"trusted_publisher" boolean DEFAULT false,
	"requires_moderation_at" timestamp,
	"requires_moderation_reason" text,
	"deactivated_at" timestamp,
	"purged_at" timestamp,
	"deleted_at" timestamp,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vt_scan_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(30) NOT NULL,
	"total" integer DEFAULT 0,
	"updated" integer DEFAULT 0,
	"unchanged" integer DEFAULT 0,
	"errors" integer DEFAULT 0,
	"flagged_skills" text,
	"duration_ms" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_dedupes" ADD CONSTRAINT "download_dedupes_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding_skill_map" ADD CONSTRAINT "embedding_skill_map_embedding_id_skill_embeddings_id_fk" FOREIGN KEY ("embedding_id") REFERENCES "public"."skill_embeddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding_skill_map" ADD CONSTRAINT "embedding_skill_map_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserved_slugs" ADD CONSTRAINT "reserved_slugs_original_owner_user_id_users_id_fk" FOREIGN KEY ("original_owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_by_user_id_users_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_daily_stats" ADD CONSTRAINT "skill_daily_stats_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_embeddings" ADD CONSTRAINT "skill_embeddings_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_embeddings" ADD CONSTRAINT "skill_embeddings_version_id_skill_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."skill_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_embeddings" ADD CONSTRAINT "skill_embeddings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_ownership_transfers" ADD CONSTRAINT "skill_ownership_transfers_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_ownership_transfers" ADD CONSTRAINT "skill_ownership_transfers_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_ownership_transfers" ADD CONSTRAINT "skill_ownership_transfers_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_reports" ADD CONSTRAINT "skill_reports_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_reports" ADD CONSTRAINT "skill_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_search_digest" ADD CONSTRAINT "skill_search_digest_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_search_digest" ADD CONSTRAINT "skill_search_digest_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_slug_aliases" ADD CONSTRAINT "skill_slug_aliases_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_slug_aliases" ADD CONSTRAINT "skill_slug_aliases_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_stat_events" ADD CONSTRAINT "skill_stat_events_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_version_fingerprints" ADD CONSTRAINT "skill_version_fingerprints_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_version_fingerprints" ADD CONSTRAINT "skill_version_fingerprints_version_id_skill_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."skill_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_comments" ADD CONSTRAINT "soul_comments_soul_id_souls_id_fk" FOREIGN KEY ("soul_id") REFERENCES "public"."souls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_comments" ADD CONSTRAINT "soul_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_embeddings" ADD CONSTRAINT "soul_embeddings_soul_id_souls_id_fk" FOREIGN KEY ("soul_id") REFERENCES "public"."souls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_embeddings" ADD CONSTRAINT "soul_embeddings_version_id_soul_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."soul_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_embeddings" ADD CONSTRAINT "soul_embeddings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_stars" ADD CONSTRAINT "soul_stars_soul_id_souls_id_fk" FOREIGN KEY ("soul_id") REFERENCES "public"."souls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_stars" ADD CONSTRAINT "soul_stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_version_fingerprints" ADD CONSTRAINT "soul_version_fingerprints_soul_id_souls_id_fk" FOREIGN KEY ("soul_id") REFERENCES "public"."souls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_version_fingerprints" ADD CONSTRAINT "soul_version_fingerprints_version_id_soul_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."soul_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_versions" ADD CONSTRAINT "soul_versions_soul_id_souls_id_fk" FOREIGN KEY ("soul_id") REFERENCES "public"."souls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soul_versions" ADD CONSTRAINT "soul_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "souls" ADD CONSTRAINT "souls_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stars" ADD CONSTRAINT "stars_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stars" ADD CONSTRAINT "stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_installs" ADD CONSTRAINT "user_skill_installs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_installs" ADD CONSTRAINT "user_skill_installs_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_root_installs" ADD CONSTRAINT "user_skill_root_installs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_root_installs" ADD CONSTRAINT "user_skill_root_installs_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sync_roots" ADD CONSTRAINT "user_sync_roots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_tokens_by_user_idx" ON "api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_tokens_by_hash_idx" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "audit_logs_by_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_by_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_logs_by_target_created_at_idx" ON "audit_logs" USING btree ("target_type","target_id","created_at");--> statement-breakpoint
CREATE INDEX "comment_reports_by_comment_idx" ON "comment_reports" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_reports_by_comment_created_at_idx" ON "comment_reports" USING btree ("comment_id","created_at");--> statement-breakpoint
CREATE INDEX "comment_reports_by_skill_idx" ON "comment_reports" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "comment_reports_by_user_idx" ON "comment_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comment_reports_by_comment_user_idx" ON "comment_reports" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "comments_by_skill_idx" ON "comments" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "comments_by_user_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comments_by_scam_scan_checked_idx" ON "comments" USING btree ("scam_scan_checked_at");--> statement-breakpoint
CREATE INDEX "download_dedupes_by_skill_identity_hour_idx" ON "download_dedupes" USING btree ("skill_id","identity_hash","hour_start");--> statement-breakpoint
CREATE INDEX "download_dedupes_by_hour_idx" ON "download_dedupes" USING btree ("hour_start");--> statement-breakpoint
CREATE INDEX "embedding_skill_map_by_embedding_idx" ON "embedding_skill_map" USING btree ("embedding_id");--> statement-breakpoint
CREATE INDEX "rate_limits_by_key_window_idx" ON "rate_limits" USING btree ("key","window_start");--> statement-breakpoint
CREATE INDEX "rate_limits_by_key_idx" ON "rate_limits" USING btree ("key");--> statement-breakpoint
CREATE INDEX "reserved_slugs_by_slug_idx" ON "reserved_slugs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "reserved_slugs_by_slug_active_deleted_at_idx" ON "reserved_slugs" USING btree ("slug","released_at","deleted_at");--> statement-breakpoint
CREATE INDEX "reserved_slugs_by_owner_idx" ON "reserved_slugs" USING btree ("original_owner_user_id");--> statement-breakpoint
CREATE INDEX "reserved_slugs_by_expiry_idx" ON "reserved_slugs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "skill_badges_by_skill_idx" ON "skill_badges" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_badges_by_skill_kind_idx" ON "skill_badges" USING btree ("skill_id","kind");--> statement-breakpoint
CREATE INDEX "skill_badges_by_kind_at_idx" ON "skill_badges" USING btree ("kind","at");--> statement-breakpoint
CREATE INDEX "skill_daily_stats_by_skill_day_idx" ON "skill_daily_stats" USING btree ("skill_id","day");--> statement-breakpoint
CREATE INDEX "skill_daily_stats_by_day_idx" ON "skill_daily_stats" USING btree ("day");--> statement-breakpoint
CREATE INDEX "skill_embeddings_by_skill_idx" ON "skill_embeddings" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_embeddings_by_version_idx" ON "skill_embeddings" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "skill_leaderboards_by_kind_idx" ON "skill_leaderboards" USING btree ("kind","generated_at");--> statement-breakpoint
CREATE INDEX "skill_ownership_transfers_by_skill_idx" ON "skill_ownership_transfers" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_ownership_transfers_by_from_user_idx" ON "skill_ownership_transfers" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "skill_ownership_transfers_by_to_user_idx" ON "skill_ownership_transfers" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "skill_ownership_transfers_by_to_user_status_idx" ON "skill_ownership_transfers" USING btree ("to_user_id","status");--> statement-breakpoint
CREATE INDEX "skill_ownership_transfers_by_from_user_status_idx" ON "skill_ownership_transfers" USING btree ("from_user_id","status");--> statement-breakpoint
CREATE INDEX "skill_ownership_transfers_by_skill_status_idx" ON "skill_ownership_transfers" USING btree ("skill_id","status");--> statement-breakpoint
CREATE INDEX "skill_reports_by_skill_idx" ON "skill_reports" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_reports_by_skill_created_at_idx" ON "skill_reports" USING btree ("skill_id","created_at");--> statement-breakpoint
CREATE INDEX "skill_reports_by_user_idx" ON "skill_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skill_reports_by_skill_user_idx" ON "skill_reports" USING btree ("skill_id","user_id");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_skill_idx" ON "skill_search_digest" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_active_updated_idx" ON "skill_search_digest" USING btree ("soft_deleted_at","updated_at");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_active_created_idx" ON "skill_search_digest" USING btree ("soft_deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_active_name_idx" ON "skill_search_digest" USING btree ("soft_deleted_at","display_name");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_active_stats_downloads_idx" ON "skill_search_digest" USING btree ("soft_deleted_at","stats_downloads","updated_at");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_active_stats_stars_idx" ON "skill_search_digest" USING btree ("soft_deleted_at","stats_stars","updated_at");--> statement-breakpoint
CREATE INDEX "skill_search_digest_by_active_stats_installs_all_time_idx" ON "skill_search_digest" USING btree ("soft_deleted_at","stats_installs_all_time","updated_at");--> statement-breakpoint
CREATE INDEX "skill_slug_aliases_by_slug_idx" ON "skill_slug_aliases" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skill_slug_aliases_by_skill_idx" ON "skill_slug_aliases" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_slug_aliases_by_owner_idx" ON "skill_slug_aliases" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "skill_stat_events_by_unprocessed_idx" ON "skill_stat_events" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "skill_stat_events_by_skill_idx" ON "skill_stat_events" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_version_fingerprints_by_version_idx" ON "skill_version_fingerprints" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "skill_version_fingerprints_by_fingerprint_idx" ON "skill_version_fingerprints" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "skill_version_fingerprints_by_skill_fingerprint_idx" ON "skill_version_fingerprints" USING btree ("skill_id","fingerprint");--> statement-breakpoint
CREATE INDEX "skill_versions_by_skill_idx" ON "skill_versions" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_versions_by_skill_version_idx" ON "skill_versions" USING btree ("skill_id","version");--> statement-breakpoint
CREATE INDEX "skill_versions_by_sha256hash_idx" ON "skill_versions" USING btree ("sha256hash");--> statement-breakpoint
CREATE INDEX "skills_by_slug_idx" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skills_by_owner_idx" ON "skills" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "skills_by_updated_idx" ON "skills" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "skills_by_stats_downloads_idx" ON "skills" USING btree ("stats_downloads","updated_at");--> statement-breakpoint
CREATE INDEX "skills_by_stats_stars_idx" ON "skills" USING btree ("stats_stars","updated_at");--> statement-breakpoint
CREATE INDEX "skills_by_stats_installs_current_idx" ON "skills" USING btree ("stats_installs_current","updated_at");--> statement-breakpoint
CREATE INDEX "skills_by_stats_installs_all_time_idx" ON "skills" USING btree ("stats_installs_all_time","updated_at");--> statement-breakpoint
CREATE INDEX "skills_by_batch_idx" ON "skills" USING btree ("batch");--> statement-breakpoint
CREATE INDEX "skills_by_active_updated_idx" ON "skills" USING btree ("soft_deleted_at","updated_at");--> statement-breakpoint
CREATE INDEX "skills_by_active_created_idx" ON "skills" USING btree ("soft_deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "skills_by_active_name_idx" ON "skills" USING btree ("soft_deleted_at","display_name");--> statement-breakpoint
CREATE INDEX "skills_by_canonical_idx" ON "skills" USING btree ("canonical_skill_id");--> statement-breakpoint
CREATE INDEX "skills_by_fork_of_idx" ON "skills" USING btree ("fork_of_skill_id");--> statement-breakpoint
CREATE INDEX "skills_by_moderation_idx" ON "skills" USING btree ("moderation_status","moderation_reason");--> statement-breakpoint
CREATE INDEX "soul_comments_by_soul_idx" ON "soul_comments" USING btree ("soul_id");--> statement-breakpoint
CREATE INDEX "soul_comments_by_user_idx" ON "soul_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "soul_embeddings_by_soul_idx" ON "soul_embeddings" USING btree ("soul_id");--> statement-breakpoint
CREATE INDEX "soul_embeddings_by_version_idx" ON "soul_embeddings" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "soul_stars_by_soul_idx" ON "soul_stars" USING btree ("soul_id");--> statement-breakpoint
CREATE INDEX "soul_stars_by_user_idx" ON "soul_stars" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "soul_stars_by_soul_user_idx" ON "soul_stars" USING btree ("soul_id","user_id");--> statement-breakpoint
CREATE INDEX "soul_version_fingerprints_by_version_idx" ON "soul_version_fingerprints" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "soul_version_fingerprints_by_fingerprint_idx" ON "soul_version_fingerprints" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "soul_version_fingerprints_by_soul_fingerprint_idx" ON "soul_version_fingerprints" USING btree ("soul_id","fingerprint");--> statement-breakpoint
CREATE INDEX "soul_versions_by_soul_idx" ON "soul_versions" USING btree ("soul_id");--> statement-breakpoint
CREATE INDEX "soul_versions_by_soul_version_idx" ON "soul_versions" USING btree ("soul_id","version");--> statement-breakpoint
CREATE INDEX "souls_by_slug_idx" ON "souls" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "souls_by_owner_idx" ON "souls" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "souls_by_updated_idx" ON "souls" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "stars_by_skill_idx" ON "stars" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "stars_by_user_idx" ON "stars" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stars_by_skill_user_idx" ON "stars" USING btree ("skill_id","user_id");--> statement-breakpoint
CREATE INDEX "user_skill_installs_by_user_idx" ON "user_skill_installs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_skill_installs_by_user_skill_idx" ON "user_skill_installs" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skill_installs_by_skill_idx" ON "user_skill_installs" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "user_skill_root_installs_by_user_idx" ON "user_skill_root_installs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_skill_root_installs_by_user_root_idx" ON "user_skill_root_installs" USING btree ("user_id","root_id");--> statement-breakpoint
CREATE INDEX "user_skill_root_installs_by_user_root_skill_idx" ON "user_skill_root_installs" USING btree ("user_id","root_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skill_root_installs_by_user_skill_idx" ON "user_skill_root_installs" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skill_root_installs_by_skill_idx" ON "user_skill_root_installs" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "user_sync_roots_by_user_idx" ON "user_sync_roots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sync_roots_by_user_root_idx" ON "user_sync_roots" USING btree ("user_id","root_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_handle_idx" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "vt_scan_logs_by_type_date_idx" ON "vt_scan_logs" USING btree ("type","created_at");