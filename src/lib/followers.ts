import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// ── Record a snapshot ─────────────────────────────────────────────────────────

/**
 * Inserts a follower count snapshot for a creator.
 * Called every time a profile is scraped (manually or via cron).
 * Skips if a snapshot already exists within the last 6 hours (dedup).
 */
export async function recordFollowersSnapshot(
  supabase: SupabaseClient<Database>,
  creatorId: string,
  followers: number
): Promise<void> {
  const sixHoursAgo = new Date(Date.now() - 6 * 3_600_000).toISOString()

  const { data: recent } = await supabase
    .from("followers_history")
    .select("id")
    .eq("creator_id", creatorId)
    .gte("scraped_at", sixHoursAgo)
    .limit(1)

  if (recent && recent.length > 0) return // already snapshotted recently

  await supabase.from("followers_history").insert({
    creator_id: creatorId,
    followers,
    scraped_at: new Date().toISOString(),
  })
}

// ── Compute delta ─────────────────────────────────────────────────────────────

export interface FollowersDelta {
  current: number
  previous: number | null
  delta: number          // absolute difference
  deltaPercent: number   // percentage, 2 decimal places
  periodDays: number     // how many days between first and last snapshot
  snapshots: { followers: number; scraped_at: string }[]
}

/**
 * Returns the follower growth delta for a creator based on their snapshot history.
 * Compares the latest snapshot vs the oldest available (up to 30 days).
 */
export async function getFollowersDelta(
  supabase: SupabaseClient<Database>,
  creatorId: string,
  currentFollowers: number
): Promise<FollowersDelta> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data: snapshots } = await supabase
    .from("followers_history")
    .select("followers, scraped_at")
    .eq("creator_id", creatorId)
    .gte("scraped_at", thirtyDaysAgo)
    .order("scraped_at", { ascending: true })

  if (!snapshots || snapshots.length < 2) {
    return {
      current: currentFollowers,
      previous: null,
      delta: 0,
      deltaPercent: 0,
      periodDays: 0,
      snapshots: snapshots ?? [],
    }
  }

  const oldest = snapshots[0]
  const latest = snapshots[snapshots.length - 1]

  const periodMs = new Date(latest.scraped_at).getTime() - new Date(oldest.scraped_at).getTime()
  const periodDays = Math.max(1, Math.round(periodMs / 86_400_000))

  const delta = latest.followers - oldest.followers
  const deltaPercent =
    oldest.followers > 0
      ? Math.round((delta / oldest.followers) * 10000) / 100
      : 0

  return {
    current: latest.followers,
    previous: oldest.followers,
    delta,
    deltaPercent,
    periodDays,
    snapshots,
  }
}
