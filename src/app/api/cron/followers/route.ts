import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { scrapeInstagramProfile } from "@/lib/scraping/instagram"
import { scrapeTiktokProfile } from "@/lib/scraping/tiktok"
import { scrapeYoutubeProfile } from "@/lib/scraping/youtube"
import { recordFollowersSnapshot } from "@/lib/followers"

// How many creators to process per cron run (Vercel functions have a 10s timeout on hobby)
const BATCH_SIZE = 15
// Minimum days between two snapshots for the same creator
const MIN_INTERVAL_DAYS = 6

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // ── 1. All distinct creators currently in at least one watchlist ─────────
  const { data: watchlistRows } = await supabase
    .from("watchlists")
    .select("creator_id")

  if (!watchlistRows?.length) {
    return NextResponse.json({ scraped: 0, message: "No creators in watchlists" })
  }

  const allIds = [...new Set(watchlistRows.map((r) => r.creator_id))]

  // ── 2. Filter out creators snapshotted recently ──────────────────────────
  const cutoff = new Date(Date.now() - MIN_INTERVAL_DAYS * 86_400_000).toISOString()

  const { data: recentSnaps } = await supabase
    .from("followers_history")
    .select("creator_id")
    .in("creator_id", allIds)
    .gte("scraped_at", cutoff)

  const recentIds = new Set((recentSnaps ?? []).map((s) => s.creator_id))
  const toScrape = allIds.filter((id) => !recentIds.has(id)).slice(0, BATCH_SIZE)

  if (toScrape.length === 0) {
    return NextResponse.json({ scraped: 0, message: "All creators are up to date" })
  }

  // ── 3. Fetch creator details ─────────────────────────────────────────────
  const { data: creators } = await supabase
    .from("creators")
    .select("id, handle, platform, followers")
    .in("id", toScrape)

  // ── 4. Scrape & record ───────────────────────────────────────────────────
  let scraped = 0
  const errors: string[] = []

  for (const creator of creators ?? []) {
    try {
      let followers: number | null = null

      if (creator.platform === "instagram") {
        const p = await scrapeInstagramProfile(creator.handle)
        followers = p.followers
      } else if (creator.platform === "tiktok") {
        const p = await scrapeTiktokProfile(creator.handle)
        followers = p.followers
      } else if (creator.platform === "youtube") {
        const p = await scrapeYoutubeProfile(creator.handle)
        followers = p.followers
      }

      if (followers !== null) {
        // Update creator's current follower count
        await supabase
          .from("creators")
          .update({ followers, updated_at: new Date().toISOString() })
          .eq("id", creator.id)

        // Record snapshot
        await recordFollowersSnapshot(supabase, creator.id, followers)
        scraped++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error"
      errors.push(`${creator.handle} (${creator.platform}): ${msg}`)
      console.error(`[Cron/Followers] @${creator.handle}:`, msg)
    }
  }

  return NextResponse.json({
    scraped,
    errors,
    remaining: allIds.length - recentIds.size - scraped,
  })
}
