import OpenAI, { toFile } from "openai"

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB — Whisper limit

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY non configurée")
  return new OpenAI({ apiKey })
}

export async function transcribeVideo(videoUrl: string): Promise<string> {
  const client = getClient()

  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error(
      `Impossible de télécharger la vidéo (${response.status}: ${response.statusText})`
    )
  }

  const contentLength = Number(response.headers.get("content-length") || 0)
  if (contentLength > MAX_FILE_SIZE) {
    throw new Error(
      `Vidéo trop volumineuse (${Math.round(contentLength / 1024 / 1024)}MB). Limite : 25MB.`
    )
  }

  const buffer = await response.arrayBuffer()

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(
      `Vidéo trop volumineuse (${Math.round(buffer.byteLength / 1024 / 1024)}MB). Limite : 25MB.`
    )
  }

  const ext = guessExtension(videoUrl, response.headers.get("content-type"))
  const filename = `audio.${ext}`

  const file = await toFile(Buffer.from(buffer), filename)

  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "fr",
    response_format: "text",
  })

  return typeof transcription === "string"
    ? transcription
    : String(transcription)
}

function guessExtension(
  url: string,
  contentType: string | null
): string {
  if (contentType?.includes("mp4") || url.includes(".mp4")) return "mp4"
  if (contentType?.includes("webm") || url.includes(".webm")) return "webm"
  if (contentType?.includes("mpeg") || url.includes(".mp3")) return "mp3"
  if (contentType?.includes("wav") || url.includes(".wav")) return "wav"
  if (contentType?.includes("m4a") || url.includes(".m4a")) return "m4a"
  return "mp4"
}
