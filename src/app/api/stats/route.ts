import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Récupère les creator_ids de la watchlist
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)

  const watchedCreatorIds = (watchlist ?? []).map((w) => w.creator_id)

  const [watchlistRes, outlierRes, scriptsRes, topOutlierRes, boardRes] =
    await Promise.all([
      supabase
        .from("watchlists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // Outliers seulement des créateurs suivis
      watchedCreatorIds.length > 0
        ? supabase
            .from("videos")
            .select("id", { count: "exact", head: true })
            .gte("outlier_score", 5)
            .in("creator_id", watchedCreatorIds)
        : { count: 0 },
      supabase
        .from("scripts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // Top outlier seulement des créateurs suivis
      watchedCreatorIds.length > 0
        ? supabase
            .from("videos")
            .select("outlier_score, title, creators!inner(handle)")
            .in("creator_id", watchedCreatorIds)
            .order("outlier_score", { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null },
      supabase
        .from("board_items")
        .select("id, title, status, scheduled_date")
        .eq("user_id", user.id)
        .neq("status", "published")
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(4),
    ])

  const totalCreators = watchlistRes.count ?? 0
  const totalOutliers = outlierRes.count ?? 0
  const totalScripts = scriptsRes.count ?? 0

  const topOutlier = topOutlierRes.data
  const topRatio = topOutlier?.outlier_score
    ? `${Number(topOutlier.outlier_score).toFixed(1)}x`
    : "—"
  const topHandle = (topOutlier?.creators as unknown as { handle: string })?.handle ?? null

  const upcomingBoard = (boardRes.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    date: item.scheduled_date
      ? new Date(item.scheduled_date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })
      : "Non planifié",
  }))

  return NextResponse.json({
    totalCreators,
    totalOutliers,
    totalScripts,
    topRatio,
    topHandle,
    upcomingBoard,
  })
}
