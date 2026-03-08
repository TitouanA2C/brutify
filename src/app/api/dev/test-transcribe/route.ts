import { NextResponse } from "next/server"
import { transcribeVideo } from "@/lib/ai/whisper"

/**
 * Route de test pour valider le scraping/transcription avant l'analyse concurrentielle.
 * À appeler avec une URL directe vers un fichier audio/vidéo (mp4, webm, m4a, mp3, etc.).
 *
 * En dev uniquement : POST /api/dev/test-transcribe
 * Body: { "url": "https://..." }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Disponible uniquement en développement" },
      { status: 404 }
    )
  }

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide. Attendu: { \"url\": \"https://...\" }" },
      { status: 400 }
    )
  }

  const url = body?.url?.trim()
  if (!url) {
    return NextResponse.json(
      { error: "Champ 'url' requis. Exemple: { \"url\": \"https://exemple.com/video.mp4\" }" },
      { status: 400 }
    )
  }

  try {
    const transcript = await transcribeVideo(url)
    return NextResponse.json({
      ok: true,
      transcript,
      length: transcript.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    )
  }
}
