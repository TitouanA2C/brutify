import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { toVideoDTO, toCreatorDTO } from "@/lib/api/helpers"
import { isValidUuid } from "@/lib/security"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isValidUuid(params.id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !video) {
    return NextResponse.json({ error: "Vidéo non trouvée" }, { status: 404 })
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", video.creator_id)
    .single()

  const { data: watchlistRow } = creator
    ? await supabase
        .from("watchlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("creator_id", creator.id)
        .maybeSingle()
    : { data: null }

  const inWatchlist = !!watchlistRow

  const { data: transcription } = inWatchlist
    ? await supabase
        .from("transcriptions")
        .select("id, content, language, created_at")
        .eq("video_id", params.id)
        .maybeSingle()
    : { data: null }

  const { data: analysis } = inWatchlist
    ? await supabase
        .from("video_analyses")
        .select("id, hook_type, hook_analysis, structure_type, structure_analysis, style_analysis, created_at")
        .eq("video_id", params.id)
        .maybeSingle()
    : { data: null }

  return NextResponse.json({
    video: toVideoDTO(video),
    creator: creator
      ? toCreatorDTO(creator, { isInWatchlist: inWatchlist })
      : null,
    transcription,
    analysis,
  })
}
