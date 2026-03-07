import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST — lier un script à une vidéo publiée
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { video_id } = body as { video_id?: string }

  // Vérifier que le script appartient à l'utilisateur
  const { data: script } = await supabase
    .from("scripts")
    .select("id, status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!script) {
    return NextResponse.json({ error: "Script non trouvé" }, { status: 404 })
  }

  // Si video_id fourni, vérifier que c'est bien une vidéo du propre compte
  if (video_id) {
    const { data: video } = await supabase
      .from("videos")
      .select("id")
      .eq("id", video_id)
      .eq("owner_user_id", user.id)
      .single()

    if (!video) {
      return NextResponse.json({ error: "Vidéo non trouvée sur votre compte" }, { status: 404 })
    }
  }

  const { data: updated, error } = await supabase
    .from("scripts")
    .update({
      published_video_id: video_id ?? null,
      published_at: video_id ? new Date().toISOString() : null,
      status: video_id ? "published" : "saved",
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, status, published_video_id, published_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ script: updated })
}

// DELETE — délier la vidéo du script
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: updated, error } = await supabase
    .from("scripts")
    .update({
      published_video_id: null,
      published_at: null,
      status: "saved",
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, status, published_video_id, published_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ script: updated })
}
