import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { toVideoDTO, type VideoFeedItemDTO } from "@/lib/api/helpers"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const creatorId = sp.get("creator_id")
  const period = parseInt(sp.get("period") ?? "30", 10)
  const minOutlier = parseFloat(sp.get("min_outlier") ?? "0")
  const platform = sp.get("platform")
  const sort = sp.get("sort") ?? "outlier_score"
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10))
  const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)))
  const offset = (page - 1) * limit

  let query = supabase
    .from("videos")
    .select("*, creators!inner(*)", { count: "exact" })

  if (creatorId) {
    query = query.eq("creator_id", creatorId)
  } else {
    const { data: watchlistRows } = await supabase
      .from("watchlists")
      .select("creator_id")
      .eq("user_id", user.id)

    const watchlistCreatorIds = watchlistRows?.map((w) => w.creator_id) ?? []

    if (watchlistCreatorIds.length > 0) {
      query = query.in("creator_id", watchlistCreatorIds)
    }
  }

  if (period > 0) {
    const since = new Date(Date.now() - period * 86_400_000).toISOString()
    query = query.gte("posted_at", since)
  }

  if (minOutlier > 0) {
    query = query.gte("outlier_score", minOutlier)
  }

  if (platform && ["instagram", "tiktok", "youtube"].includes(platform)) {
    query = query.eq("platform", platform)
  }

  const validSorts: Record<string, string> = {
    outlier_score: "outlier_score",
    views: "views",
    likes: "likes",
    comments: "comments",
    posted_at: "posted_at",
  }
  const sortColumn = validSorts[sort] ?? "outlier_score"
  query = query.order(sortColumn, { ascending: false })

  query = query.range(offset, offset + limit - 1)

  const { data: rows, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const videos: VideoFeedItemDTO[] = (rows ?? []).map((row) => {
    const creatorRow = row.creators as Record<string, unknown> | null
    const videoBase = toVideoDTO(row)

    return {
      ...videoBase,
      creator: creatorRow
        ? {
            id: creatorRow.id as string,
            name: (creatorRow.name as string) ?? (creatorRow.handle as string),
            handle: (creatorRow.handle as string)?.startsWith("@")
              ? (creatorRow.handle as string)
              : `@${creatorRow.handle as string}`,
            avatarUrl:
              (creatorRow.avatar_url as string) ??
              `https://ui-avatars.com/api/?name=${encodeURIComponent((creatorRow.name as string) ?? "")}&background=FFAB00&color=000&bold=true&size=128`,
            platform: creatorRow.platform as string,
          }
        : null,
    }
  })

  return NextResponse.json({
    videos,
    page,
    limit,
    total: count ?? 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
  })
}
