import { NextResponse } from "next/server"
import { isAllowedProxyHostname } from "@/lib/security"

const ALLOWED_DOMAINS = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "tiktokcdn.com",
  "tiktok.com",
  "ytimg.com",
  "youtube.com",
  "ggpht.com",
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) return new NextResponse("Missing url", { status: 400 })

  try {
    const decoded = decodeURIComponent(url)
    const requireHttps = process.env.NODE_ENV === "production"
    if (!isAllowedProxyHostname(decoded, ALLOWED_DOMAINS, requireHttps)) {
      return new NextResponse("Domaine non autorisé", { status: 403 })
    }

    const rangeHeader = request.headers.get("range")
    const headers: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "video/webm,video/mp4,video/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.instagram.com/",
    }
    if (rangeHeader) headers["Range"] = rangeHeader

    const res = await fetch(decoded, {
      headers,
      redirect: "follow",
    })

    if (!res.ok) {
      return new NextResponse("Video fetch failed", { status: res.status })
    }

    const contentType =
      res.headers.get("content-type") ?? "video/mp4"
    const contentLength = res.headers.get("content-length")
    const contentRange = res.headers.get("content-range")
    const acceptRanges = res.headers.get("accept-ranges")

    const responseHeaders: HeadersInit = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    }
    if (contentLength) responseHeaders["Content-Length"] = contentLength
    if (contentRange) responseHeaders["Content-Range"] = contentRange
    if (acceptRanges) responseHeaders["Accept-Ranges"] = acceptRanges

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    })
  } catch {
    return new NextResponse("Proxy error", { status: 502 })
  }
}
