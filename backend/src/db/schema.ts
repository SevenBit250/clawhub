import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  vector,
  pgSequence,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Auth tables (from @convex-dev/auth)
export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authAuthenticators = pgTable("auth_authenticators", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  credentialId: text("credential_id").notNull(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Core users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  image: text("image"),
  email: varchar("email", { length: 255 }),
  emailVerificationTime: timestamp("email_verification_time"),
  phone: varchar("phone", { length: 50 }),
  phoneVerificationTime: timestamp("phone_verification_time"),
  isAnonymous: boolean("is_anonymous").default(false),
  handle: varchar("handle", { length: 100 }),
  displayName: varchar("display_name", { length: 255 }),
  bio: text("bio"),
  role: varchar("role", { length: 20 }).$type<"admin" | "moderator" | "user">(),
  githubCreatedAt: timestamp("github_created_at"),
  githubFetchedAt: timestamp("github_fetched_at"),
  githubProfileSyncedAt: timestamp("github_profile_synced_at"),
  trustedPublisher: boolean("trusted_publisher").default(false),
  requiresModerationAt: timestamp("requires_moderation_at"),
  requiresModerationReason: text("requires_moderation_reason"),
  deactivatedAt: timestamp("deactivated_at"),
  purgedAt: timestamp("purged_at"),
  deletedAt: timestamp("deleted_at"),
  banReason: text("ban_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_phone_idx").on(table.phone),
  index("users_handle_idx").on(table.handle),
]);

// Skills table
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  summary: text("summary"),
  resourceId: text("resource_id"),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id),
  canonicalSkillId: uuid("canonical_skill_id"),
  forkOfSkillId: uuid("fork_of_skill_id"),
  forkOfKind: varchar("fork_of_kind", { length: 20 }).$type<"fork" | "duplicate">(),
  forkOfVersion: varchar("fork_of_version", { length: 50 }),
  forkOfAt: timestamp("fork_of_at"),
  latestVersionId: uuid("latest_version_id"),
  tags: text("tags").$type<Record<string, string>>(),
  softDeletedAt: timestamp("soft_deleted_at"),
  badges: text("badges").$type<{
    redactionApproved?: { byUserId: string; at: number };
    highlighted?: { byUserId: string; at: number };
    official?: { byUserId: string; at: number };
    deprecated?: { byUserId: string; at: number };
  }>(),
  moderationStatus: varchar("moderation_status", { length: 20 }).$type<"active" | "hidden" | "removed">(),
  moderationNotes: text("moderation_notes"),
  moderationReason: text("moderation_reason"),
  moderationVerdict: varchar("moderation_verdict", { length: 20 }).$type<"clean" | "suspicious" | "malicious">(),
  moderationReasonCodes: text("moderation_reason_codes").$type<string[]>(),
  moderationEvidence: text("moderation_evidence").$type<Array<{
    code: string;
    severity: "info" | "warn" | "critical";
    file: string;
    line: number;
    message: string;
    evidence: string;
  }>>(),
  moderationSummary: text("moderation_summary"),
  moderationEngineVersion: varchar("moderation_engine_version", { length: 50 }),
  moderationEvaluatedAt: timestamp("moderation_evaluated_at"),
  moderationSourceVersionId: uuid("moderation_source_version_id"),
  manualOverrideVerdict: varchar("manual_override_verdict", { length: 10 }).$type<"clean">(),
  manualOverrideNote: text("manual_override_note"),
  manualOverrideReviewerUserId: uuid("manual_override_reviewer_user_id"),
  manualOverrideUpdatedAt: timestamp("manual_override_updated_at"),
  qualityScore: integer("quality_score"),
  qualityDecision: varchar("quality_decision", { length: 20 }).$type<"pass" | "quarantine" | "reject">(),
  qualityTrustTier: varchar("quality_trust_tier", { length: 20 }).$type<"low" | "medium" | "trusted">(),
  qualitySimilarRecentCount: integer("quality_similar_recent_count"),
  qualityReason: text("quality_reason"),
  qualitySignals: text("quality_signals").$type<{
    bodyChars: number;
    bodyWords: number;
    uniqueWordRatio: number;
    headingCount: number;
    bulletCount: number;
    templateMarkerHits: number;
    genericSummary: boolean;
    cjkChars?: number;
  }>(),
  qualityEvaluatedAt: timestamp("quality_evaluated_at"),
  isSuspicious: boolean("is_suspicious"),
  moderationFlags: text("moderation_flags").$type<string[]>(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  scanLastCheckedAt: timestamp("scan_last_checked_at"),
  scanCheckCount: integer("scan_check_count"),
  hiddenAt: timestamp("hidden_at"),
  hiddenBy: uuid("hidden_by"),
  reportCount: integer("report_count").default(0),
  lastReportedAt: timestamp("last_reported_at"),
  batch: varchar("batch", { length: 100 }),
  statsDownloads: integer("stats_downloads").default(0),
  statsStars: integer("stats_stars").default(0),
  statsInstallsCurrent: integer("stats_installs_current").default(0),
  statsInstallsAllTime: integer("stats_installs_all_time").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("skills_by_slug_idx").on(table.slug),
  index("skills_by_owner_idx").on(table.ownerUserId),
  index("skills_by_updated_idx").on(table.updatedAt),
  index("skills_by_stats_downloads_idx").on(table.statsDownloads, table.updatedAt),
  index("skills_by_stats_stars_idx").on(table.statsStars, table.updatedAt),
  index("skills_by_stats_installs_current_idx").on(table.statsInstallsCurrent, table.updatedAt),
  index("skills_by_stats_installs_all_time_idx").on(table.statsInstallsAllTime, table.updatedAt),
  index("skills_by_batch_idx").on(table.batch),
  index("skills_by_active_updated_idx").on(table.softDeletedAt, table.updatedAt),
  index("skills_by_active_created_idx").on(table.softDeletedAt, table.createdAt),
  index("skills_by_active_name_idx").on(table.softDeletedAt, table.displayName),
  index("skills_by_canonical_idx").on(table.canonicalSkillId),
  index("skills_by_fork_of_idx").on(table.forkOfSkillId),
  index("skills_by_moderation_idx").on(table.moderationStatus, table.moderationReason),
]);

// Skill slug aliases
export const skillSlugAliases = pgTable("skill_slug_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("skill_slug_aliases_by_slug_idx").on(table.slug),
  index("skill_slug_aliases_by_skill_idx").on(table.skillId),
  index("skill_slug_aliases_by_owner_idx").on(table.ownerUserId),
]);

// Souls table (like skills but for souls)
export const souls = pgTable("souls", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  summary: text("summary"),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id),
  latestVersionId: uuid("latest_version_id"),
  tags: text("tags").$type<Record<string, string>>(),
  softDeletedAt: timestamp("soft_deleted_at"),
  statsDownloads: integer("stats_downloads").default(0),
  statsStars: integer("stats_stars").default(0),
  statsVersions: integer("stats_versions").default(0),
  statsComments: integer("stats_comments").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("souls_by_slug_idx").on(table.slug),
  index("souls_by_owner_idx").on(table.ownerUserId),
  index("souls_by_updated_idx").on(table.updatedAt),
]);

// Skill versions
export const skillVersions = pgTable("skill_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  version: varchar("version", { length: 50 }).notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }),
  changelog: text("changelog").notNull(),
  changelogSource: varchar("changelog_source", { length: 10 }).$type<"auto" | "user">(),
  files: text("files").notNull(),
  frontmatter: text("frontmatter"),
  metadata: text("metadata"),
  clawdis: text("clawdis"),
  moltbot: text("moltbot"),
  license: varchar("license", { length: 20 }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  softDeletedAt: timestamp("soft_deleted_at"),
  sha256hash: varchar("sha256hash", { length: 64 }),
  vtAnalysis: text("vt_analysis"),
  llmAnalysis: text("llm_analysis"),
  staticScan: text("static_scan"),
}, (table) => [
  index("skill_versions_by_skill_idx").on(table.skillId),
  index("skill_versions_by_skill_version_idx").on(table.skillId, table.version),
  index("skill_versions_by_sha256hash_idx").on(table.sha256hash),
]);

// Soul versions
export const soulVersions = pgTable("soul_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  soulId: uuid("soul_id").notNull().references(() => souls.id),
  version: varchar("version", { length: 50 }).notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }),
  changelog: text("changelog").notNull(),
  changelogSource: varchar("changelog_source", { length: 10 }).$type<"auto" | "user">(),
  files: text("files").notNull(),
  frontmatter: text("frontmatter"),
  metadata: text("metadata"),
  clawdis: text("clawdis"),
  moltbot: text("moltbot"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  softDeletedAt: timestamp("soft_deleted_at"),
}, (table) => [
  index("soul_versions_by_soul_idx").on(table.soulId),
  index("soul_versions_by_soul_version_idx").on(table.soulId, table.version),
]);

// Skill version fingerprints
export const skillVersionFingerprints = pgTable("skill_version_fingerprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  versionId: uuid("version_id").notNull().references(() => skillVersions.id),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("skill_version_fingerprints_by_version_idx").on(table.versionId),
  index("skill_version_fingerprints_by_fingerprint_idx").on(table.fingerprint),
  index("skill_version_fingerprints_by_skill_fingerprint_idx").on(table.skillId, table.fingerprint),
]);

// Soul version fingerprints
export const soulVersionFingerprints = pgTable("soul_version_fingerprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  soulId: uuid("soul_id").notNull().references(() => souls.id),
  versionId: uuid("version_id").notNull().references(() => soulVersions.id),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("soul_version_fingerprints_by_version_idx").on(table.versionId),
  index("soul_version_fingerprints_by_fingerprint_idx").on(table.fingerprint),
  index("soul_version_fingerprints_by_soul_fingerprint_idx").on(table.soulId, table.fingerprint),
]);

// Skill badges
export const skillBadges = pgTable("skill_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  kind: varchar("kind", { length: 30 }).notNull().$type<"highlighted" | "official" | "deprecated" | "redactionApproved">(),
  byUserId: uuid("by_user_id").notNull().references(() => users.id),
  at: timestamp("at").notNull(),
}, (table) => [
  index("skill_badges_by_skill_idx").on(table.skillId),
  index("skill_badges_by_skill_kind_idx").on(table.skillId, table.kind),
  index("skill_badges_by_kind_at_idx").on(table.kind, table.at),
]);

// Skill embeddings (for vector search)
export const skillEmbeddings = pgTable("skill_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  versionId: uuid("version_id").notNull().references(() => skillVersions.id),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  isLatest: boolean("is_latest").default(false),
  isApproved: boolean("is_approved").default(false),
  visibility: varchar("visibility", { length: 20 }).default("latest"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("skill_embeddings_by_skill_idx").on(table.skillId),
  index("skill_embeddings_by_version_idx").on(table.versionId),
]);

// Soul embeddings
export const soulEmbeddings = pgTable("soul_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  soulId: uuid("soul_id").notNull().references(() => souls.id),
  versionId: uuid("version_id").notNull().references(() => soulVersions.id),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  isLatest: boolean("is_latest").default(false),
  isApproved: boolean("is_approved").default(false),
  visibility: varchar("visibility", { length: 20 }).default("latest"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("soul_embeddings_by_soul_idx").on(table.soulId),
  index("soul_embeddings_by_version_idx").on(table.versionId),
]);

// Embedding skill map (lightweight lookup)
export const embeddingSkillMap = pgTable("embedding_skill_map", {
  id: uuid("id").primaryKey().defaultRandom(),
  embeddingId: uuid("embedding_id").notNull().references(() => skillEmbeddings.id),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
}, (table) => [
  index("embedding_skill_map_by_embedding_idx").on(table.embeddingId),
]);

// Skill search digest (lightweight projection for search)
export const skillSearchDigest = pgTable("skill_search_digest", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  slug: varchar("slug", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  summary: text("summary"),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id),
  ownerHandle: varchar("owner_handle", { length: 100 }),
  ownerName: varchar("owner_name", { length: 255 }),
  ownerDisplayName: varchar("owner_display_name", { length: 255 }),
  ownerImage: text("owner_image"),
  canonicalSkillId: uuid("canonical_skill_id"),
  forkOfSkillId: uuid("fork_of_skill_id"),
  forkOfKind: varchar("fork_of_kind", { length: 20 }).$type<"fork" | "duplicate">(),
  forkOfVersion: varchar("fork_of_version", { length: 50 }),
  forkOfAt: timestamp("fork_of_at"),
  latestVersionId: uuid("latest_version_id"),
  latestVersionSummary: text("latest_version_summary").$type<{
    version: string;
    createdAt: number;
    changelog: string;
    changelogSource?: "auto" | "user";
    clawdis?: unknown;
  }>(),
  tags: text("tags").$type<Record<string, string>>(),
  badges: text("badges").$type<{
    redactionApproved?: { byUserId: string; at: number };
    highlighted?: { byUserId: string; at: number };
    official?: { byUserId: string; at: number };
    deprecated?: { byUserId: string; at: number };
  }>(),
  statsDownloads: integer("stats_downloads").default(0),
  statsStars: integer("stats_stars").default(0),
  statsInstallsCurrent: integer("stats_installs_current").default(0),
  statsInstallsAllTime: integer("stats_installs_all_time").default(0),
  softDeletedAt: timestamp("soft_deleted_at"),
  moderationStatus: varchar("moderation_status", { length: 20 }).$type<"active" | "hidden" | "removed">(),
  moderationFlags: text("moderation_flags").$type<string[]>(),
  moderationReason: text("moderation_reason"),
  isSuspicious: boolean("is_suspicious"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("skill_search_digest_by_skill_idx").on(table.skillId),
  index("skill_search_digest_by_active_updated_idx").on(table.softDeletedAt, table.updatedAt),
  index("skill_search_digest_by_active_created_idx").on(table.softDeletedAt, table.createdAt),
  index("skill_search_digest_by_active_name_idx").on(table.softDeletedAt, table.displayName),
  index("skill_search_digest_by_active_stats_downloads_idx").on(table.softDeletedAt, table.statsDownloads, table.updatedAt),
  index("skill_search_digest_by_active_stats_stars_idx").on(table.softDeletedAt, table.statsStars, table.updatedAt),
  index("skill_search_digest_by_active_stats_installs_all_time_idx").on(table.softDeletedAt, table.statsInstallsAllTime, table.updatedAt),
]);

// Skill daily stats
export const skillDailyStats = pgTable("skill_daily_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  day: integer("day").notNull(),
  downloads: integer("downloads").default(0),
  installs: integer("installs").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("skill_daily_stats_by_skill_day_idx").on(table.skillId, table.day),
  index("skill_daily_stats_by_day_idx").on(table.day),
]);

// Skill leaderboards
export const skillLeaderboards = pgTable("skill_leaderboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: varchar("kind", { length: 50 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  rangeStartDay: integer("range_start_day").notNull(),
  rangeEndDay: integer("range_end_day").notNull(),
  items: text("items").$type<Array<{
    skillId: string;
    score: number;
    installs: number;
    downloads: number;
  }>>().notNull(),
}, (table) => [
  index("skill_leaderboards_by_kind_idx").on(table.kind, table.generatedAt),
]);

// Skill stat backfill state
export const skillStatBackfillState = pgTable("skill_stat_backfill_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  cursor: text("cursor"),
  doneAt: timestamp("done_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Global stats
export const globalStats = pgTable("global_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  activeSkillsCount: integer("active_skills_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Skill stat events (event sourcing pattern)
export const skillStatEvents = pgTable("skill_stat_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  kind: varchar("kind", { length: 30 }).notNull().$type<"download" | "star" | "unstar" | "comment" | "uncomment" | "install_new" | "install_reactivate" | "install_deactivate" | "install_clear">(),
  deltaAllTime: integer("delta_all_time"),
  deltaCurrent: integer("delta_current"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("skill_stat_events_by_unprocessed_idx").on(table.processedAt),
  index("skill_stat_events_by_skill_idx").on(table.skillId),
]);

// Skill stat update cursors
export const skillStatUpdateCursors = pgTable("skill_stat_update_cursors", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  cursorCreationTime: timestamp("cursor_creation_time"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  reportCount: integer("report_count").default(0),
  lastReportedAt: timestamp("last_reported_at"),
  scamScanVerdict: varchar("scam_scan_verdict", { length: 20 }).$type<"not_scam" | "likely_scam" | "certain_scam">(),
  scamScanConfidence: varchar("scam_scan_confidence", { length: 10 }).$type<"low" | "medium" | "high">(),
  scamScanExplanation: text("scam_scan_explanation"),
  scamScanEvidence: text("scam_scan_evidence").$type<string[]>(),
  scamScanModel: varchar("scam_scan_model", { length: 100 }),
  scamScanCheckedAt: timestamp("scam_scan_checked_at"),
  scamBanTriggeredAt: timestamp("scam_ban_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  softDeletedAt: timestamp("soft_deleted_at"),
  deletedBy: uuid("deleted_by"),
}, (table) => [
  index("comments_by_skill_idx").on(table.skillId),
  index("comments_by_user_idx").on(table.userId),
  index("comments_by_scam_scan_checked_idx").on(table.scamScanCheckedAt),
]);

// Comment reports
export const commentReports = pgTable("comment_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => comments.id),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("comment_reports_by_comment_idx").on(table.commentId),
  index("comment_reports_by_comment_created_at_idx").on(table.commentId, table.createdAt),
  index("comment_reports_by_skill_idx").on(table.skillId),
  index("comment_reports_by_user_idx").on(table.userId),
  index("comment_reports_by_comment_user_idx").on(table.commentId, table.userId),
]);

// Skill reports
export const skillReports = pgTable("skill_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("skill_reports_by_skill_idx").on(table.skillId),
  index("skill_reports_by_skill_created_at_idx").on(table.skillId, table.createdAt),
  index("skill_reports_by_user_idx").on(table.userId),
  index("skill_reports_by_skill_user_idx").on(table.skillId, table.userId),
]);

// Soul comments
export const soulComments = pgTable("soul_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  soulId: uuid("soul_id").notNull().references(() => souls.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  softDeletedAt: timestamp("soft_deleted_at"),
  deletedBy: uuid("deleted_by"),
}, (table) => [
  index("soul_comments_by_soul_idx").on(table.soulId),
  index("soul_comments_by_user_idx").on(table.userId),
]);

// Stars
export const stars = pgTable("stars", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("stars_by_skill_idx").on(table.skillId),
  index("stars_by_user_idx").on(table.userId),
  uniqueIndex("stars_by_skill_user_idx").on(table.skillId, table.userId),
]);

// Soul stars
export const soulStars = pgTable("soul_stars", {
  id: uuid("id").primaryKey().defaultRandom(),
  soulId: uuid("soul_id").notNull().references(() => souls.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("soul_stars_by_soul_idx").on(table.soulId),
  index("soul_stars_by_user_idx").on(table.userId),
  uniqueIndex("soul_stars_by_soul_user_idx").on(table.soulId, table.userId),
]);

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: varchar("target_id", { length: 100 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_by_actor_idx").on(table.actorUserId),
  index("audit_logs_by_target_idx").on(table.targetType, table.targetId),
  index("audit_logs_by_target_created_at_idx").on(table.targetType, table.targetId, table.createdAt),
]);

// VT scan logs
export const vtScanLogs = pgTable("vt_scan_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 30 }).notNull().$type<"daily_rescan" | "backfill" | "pending_poll">(),
  total: integer("total").default(0),
  updated: integer("updated").default(0),
  unchanged: integer("unchanged").default(0),
  errors: integer("errors").default(0),
  flaggedSkills: text("flagged_skills").$type<Array<{ slug: string; status: string }>>(),
  durationMs: integer("duration_ms").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("vt_scan_logs_by_type_date_idx").on(table.type, table.createdAt),
]);

// API tokens
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  label: varchar("label", { length: 100 }).notNull(),
  prefix: varchar("prefix", { length: 10 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("api_tokens_by_user_idx").on(table.userId),
  index("api_tokens_by_hash_idx").on(table.tokenHash),
]);

// Rate limits
export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull(),
  windowStart: timestamp("window_start").notNull(),
  count: integer("count").default(0),
  limit: integer("limit").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("rate_limits_by_key_window_idx").on(table.key, table.windowStart),
  index("rate_limits_by_key_idx").on(table.key),
]);

// Download deduplication
export const downloadDedupes = pgTable("download_dedupes", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  identityHash: varchar("identity_hash", { length: 128 }).notNull(),
  hourStart: integer("hour_start").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("download_dedupes_by_skill_identity_hour_idx").on(table.skillId, table.identityHash, table.hourStart),
  index("download_dedupes_by_hour_idx").on(table.hourStart),
]);

// Reserved slugs
export const reservedSlugs = pgTable("reserved_slugs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull(),
  originalOwnerUserId: uuid("original_owner_user_id").notNull().references(() => users.id),
  deletedAt: timestamp("deleted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  reason: text("reason"),
  releasedAt: timestamp("released_at"),
}, (table) => [
  index("reserved_slugs_by_slug_idx").on(table.slug),
  index("reserved_slugs_by_slug_active_deleted_at_idx").on(table.slug, table.releasedAt, table.deletedAt),
  index("reserved_slugs_by_owner_idx").on(table.originalOwnerUserId),
  index("reserved_slugs_by_expiry_idx").on(table.expiresAt),
]);

// GitHub backup sync state
export const githubBackupSyncState = pgTable("github_backup_sync_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  cursor: text("cursor"),
  pruneCursor: text("prune_cursor"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User sync roots
export const userSyncRoots = pgTable("user_sync_roots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  rootId: varchar("root_id", { length: 500 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  expiredAt: timestamp("expired_at"),
}, (table) => [
  index("user_sync_roots_by_user_idx").on(table.userId),
  index("user_sync_roots_by_user_root_idx").on(table.userId, table.rootId),
]);

// User skill installs
export const userSkillInstalls = pgTable("user_skill_installs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  activeRoots: integer("active_roots").default(0),
  lastVersion: varchar("last_version", { length: 50 }),
}, (table) => [
  index("user_skill_installs_by_user_idx").on(table.userId),
  index("user_skill_installs_by_user_skill_idx").on(table.userId, table.skillId),
  index("user_skill_installs_by_skill_idx").on(table.skillId),
]);

// User skill root installs
export const userSkillRootInstalls = pgTable("user_skill_root_installs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  rootId: varchar("root_id", { length: 500 }).notNull(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  lastVersion: varchar("last_version", { length: 50 }),
  removedAt: timestamp("removed_at"),
}, (table) => [
  index("user_skill_root_installs_by_user_idx").on(table.userId),
  index("user_skill_root_installs_by_user_root_idx").on(table.userId, table.rootId),
  index("user_skill_root_installs_by_user_root_skill_idx").on(table.userId, table.rootId, table.skillId),
  index("user_skill_root_installs_by_user_skill_idx").on(table.userId, table.skillId),
  index("user_skill_root_installs_by_skill_idx").on(table.skillId),
]);

// Skill ownership transfers
export const skillOwnershipTransfers = pgTable("skill_ownership_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  fromUserId: uuid("from_user_id").notNull().references(() => users.id),
  toUserId: uuid("to_user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().$type<"pending" | "accepted" | "rejected" | "cancelled" | "expired">(),
  message: text("message"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index("skill_ownership_transfers_by_skill_idx").on(table.skillId),
  index("skill_ownership_transfers_by_from_user_idx").on(table.fromUserId),
  index("skill_ownership_transfers_by_to_user_idx").on(table.toUserId),
  index("skill_ownership_transfers_by_to_user_status_idx").on(table.toUserId, table.status),
  index("skill_ownership_transfers_by_from_user_status_idx").on(table.fromUserId, table.status),
  index("skill_ownership_transfers_by_skill_status_idx").on(table.skillId, table.status),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  skills: many(skills),
  ownedSkills: many(skills),
  comments: many(comments),
  stars: many(stars),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  owner: one(users, {
    fields: [skills.ownerUserId],
    references: [users.id],
  }),
  versions: many(skillVersions),
  canonicalSkill: one(skills, {
    fields: [skills.canonicalSkillId],
    references: [skills.id],
  }),
}));

export const skillVersionsRelations = relations(skillVersions, ({ one }) => ({
  skill: one(skills, {
    fields: [skillVersions.skillId],
    references: [skills.id],
  }),
  createdByUser: one(users, {
    fields: [skillVersions.createdBy],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [comments.skillId],
    references: [skills.id],
  }),
}));

export const starsRelations = relations(stars, ({ one }) => ({
  user: one(users, {
    fields: [stars.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [stars.skillId],
    references: [skills.id],
  }),
}));
