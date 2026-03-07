import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Vidéos du propre compte
  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select(
      "id, title, description, url, thumbnail_url, views, likes, comments, outlier_score, posted_at, duration, platform_video_id"
    )
    .eq("owner_user_id", user.id)
    .order("posted_at", { ascending: false })
    .limit(50)

  if (videosError) {
    return NextResponse.json({ error: videosError.message }, { status: 500 })
  }

  if (!videos?.length) {
    return NextResponse.json({ videos: [] })
  }

  // Scripts liés à ces vidéos
  const videoIds = videos.map((v) => v.id)
  const { data: scripts } = await supabase
    .from("scripts")
    .select("id, title, hook_type, structure_type, published_video_id, published_at")
    .in("published_video_id", videoIds)
    .eq("user_id", user.id)

  const scriptByVideoId = Object.fromEntries(
    (scripts ?? []).map((s) => [s.published_video_id, s])
  )

  // Transcriptions disponibles
  const { data: transcriptions } = await supabase
    .from("transcriptions")
    .select("video_id, id")
    .in("video_id", videoIds)

  const transcribedSet = new Set((transcriptions ?? []).map((t) => t.video_id))

  return NextResponse.json({
    videos: videos.map((v) => ({
      ...v,
      linkedScript: scriptByVideoId[v.id] ?? null,
      hasTranscription: transcribedSet.has(v.id),
    })),
  })
}
