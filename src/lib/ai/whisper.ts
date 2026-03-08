import OpenAI, { toFile } from "openai"

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB — Whisper limit

/** Formats acceptés par l'API Whisper */
const WHISPER_FORMATS = ["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "wav", "webm"] as const

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY non configurée")
  return new OpenAI({ apiKey })
}

/**
 * Détecte le format du fichier à partir des magic bytes.
 * Retourne une extension supportée par Whisper ou null.
 */
function detectFormatFromBuffer(buffer: ArrayBuffer): (typeof WHISPER_FORMATS)[number] | null {
  const arr = new Uint8Array(buffer)
  if (arr.length < 12) return null

  // WebM: EBML header
  if (arr[0] === 0x1a && arr[1] === 0x45 && arr[2] === 0xdf && arr[3] === 0xa3) return "webm"

  // MP3: ID3 ou frame sync
  if ((arr[0] === 0x49 && arr[1] === 0x44 && arr[2] === 0x33) || (arr[0] === 0xff && (arr[1] & 0xe0) === 0xe0))
    return "mp3"

  // WAV: RIFF....WAVE
  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 && arr[8] === 0x57 && arr[9] === 0x41 && arr[10] === 0x56)
    return "wav"

  // Ogg
  if (arr[0] === 0x4f && arr[1] === 0x67 && arr[2] === 0x67 && arr[3] === 0x53) return "ogg"

  // FLAC
  if (arr[0] === 0x66 && arr[1] === 0x4c && arr[2] === 0x61 && arr[3] === 0x43) return "flac"

  // MP4 / M4A / MOV: ftyp à l'offset 4
  if (arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70) {
    // M4A souvent identifié par "M4A " ou "mp42" / "isom"
    const brand = String.fromCharCode(arr[8], arr[9], arr[10], arr[11])
    if (brand === "M4A " || brand === "m4a ") return "m4a"
    return "mp4"
  }

  return null
}

function guessExtension(url: string, contentType: string | null): (typeof WHISPER_FORMATS)[number] {
  if (contentType) {
    const ct = contentType.toLowerCase().split(";")[0].trim()
    if (ct.includes("mp4") || ct.includes("x-mp4")) return "mp4"
    if (ct.includes("webm")) return "webm"
    if (ct.includes("mpeg") || ct.includes("mp3")) return "mp3"
    if (ct.includes("wav")) return "wav"
    if (ct.includes("m4a") || ct.includes("x-m4a")) return "m4a"
    if (ct.includes("quicktime") || ct.includes("x-quicktime")) return "mp4"
    if (ct.includes("ogg")) return "ogg"
    if (ct.includes("flac")) return "flac"
  }
  if (url.includes(".mp4") || url.includes(".m4v")) return "mp4"
  if (url.includes(".webm")) return "webm"
  if (url.includes(".mp3")) return "mp3"
  if (url.includes(".wav")) return "wav"
  if (url.includes(".m4a")) return "m4a"
  if (url.includes(".ogg")) return "ogg"
  return "mp4"
}

export async function transcribeVideo(videoUrl: string): Promise<string> {
  const client = getClient()

  const response = await fetch(videoUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  })
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

  // Détection par magic bytes en priorité, sinon Content-Type + URL
  const detectedExt = detectFormatFromBuffer(buffer)
  const contentType = response.headers.get("content-type")
  const ext = detectedExt ?? guessExtension(videoUrl, contentType)

  // Rejeter les contenus qui ne sont clairement pas de l'audio/vidéo
  if (buffer.byteLength >= 4) {
    const arr = new Uint8Array(buffer)
    const start = String.fromCharCode(arr[0], arr[1], arr[2], arr[3])
    if (start === "<!DO" || start === "<htm" || start === "#EXT") {
      throw new Error(
        "Format non supporté : le fichier semble être une page HTML ou une playlist (m3u8). Utilisez une URL pointant directement vers un fichier audio/vidéo (mp4, webm, m4a, mp3, etc.)."
      )
    }
  }

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
