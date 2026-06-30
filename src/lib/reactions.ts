// The curated reaction set — single source of truth for the client palette
// (reactions.tsx) AND the API allowlist (api/reactions/route.ts), so they can't
// drift. Free-text column in the DB; this list is the only validation.
// (A bespoke kizu-designed icon set is a deferred future polish.)
export const REACTIONS = ["🔥", "🫶", "😂", "🤯", "👀", "😭"] as const;
