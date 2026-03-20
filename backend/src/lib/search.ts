import { db } from "../db/index.js";
import { skills, users } from "../db/schema.js";
import { sql, desc, like, or, and, isNull, eq } from "drizzle-orm";
import { tokenize } from "./searchText.js";

const SLUG_EXACT_BOOST = 1.4;
const SLUG_PREFIX_BOOST = 0.8;
const NAME_EXACT_BOOST = 1.1;
const NAME_PREFIX_BOOST = 0.6;
const POPULARITY_WEIGHT = 0.08;

export interface SearchResult {
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  ownerHandle: string | null;
  ownerName: string | null;
  ownerImage: string | null;
  statsStars: number;
  statsDownloads: number;
  score: number;
}

function getLexicalBoost(queryTokens: string[], displayName: string, slug: string): number {
  const slugTokens = tokenize(slug);
  const nameTokens = tokenize(displayName);

  let boost = 0;

  const allSlugExact = queryTokens.every(qt => slugTokens.some(st => st === qt));
  const allSlugPrefix = queryTokens.every(qt => slugTokens.some(st => st.startsWith(qt)));
  const allNameExact = queryTokens.every(qt => nameTokens.some(nt => nt === qt));
  const allNamePrefix = queryTokens.every(qt => nameTokens.some(nt => nt.startsWith(qt)));

  if (allSlugExact) boost += SLUG_EXACT_BOOST;
  else if (allSlugPrefix) boost += SLUG_PREFIX_BOOST;

  if (allNameExact) boost += NAME_EXACT_BOOST;
  else if (allNamePrefix) boost += NAME_PREFIX_BOOST;

  return boost;
}

function scoreSkill(
  lexicalBoost: number,
  downloads: number,
): number {
  const popularityBoost = Math.log1p(Math.max(downloads, 0)) * POPULARITY_WEIGHT;
  return lexicalBoost + popularityBoost;
}

export async function searchSkills(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    highlightedOnly?: boolean;
    nonSuspiciousOnly?: boolean;
  } = {}
) {
  const { limit = 20, offset = 0 } = options;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const results = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      displayName: skills.displayName,
      summary: skills.summary,
      statsDownloads: skills.statsDownloads,
      statsStars: skills.statsStars,
      ownerUserId: skills.ownerUserId,
    })
    .from(skills)
    .where(isNull(skills.softDeletedAt))
    .limit(500);

  const withOwners = await Promise.all(
    results.map(async (skill) => {
      const [owner] = await db
        .select({ handle: users.handle, displayName: users.displayName, image: users.image })
        .from(users)
        .where(eq(users.id, skill.ownerUserId))
        .limit(1);
      return { ...skill, owner };
    })
  );

  const scored = withOwners
    .map((skill) => {
      const lexicalBoost = getLexicalBoost(
        queryTokens,
        skill.displayName,
        skill.slug,
      );
      const finalScore = scoreSkill(lexicalBoost, skill.statsDownloads || 0);
      return { ...skill, score: finalScore };
    })
    .filter((skill) => skill.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(offset, offset + limit);

  return scored.map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    displayName: skill.displayName,
    summary: skill.summary,
    ownerHandle: skill.owner?.handle || null,
    ownerName: skill.owner?.displayName || null,
    ownerImage: skill.owner?.image || null,
    statsStars: skill.statsStars || 0,
    statsDownloads: skill.statsDownloads || 0,
    score: skill.score,
  }));
}
