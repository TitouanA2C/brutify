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
  "pravatar.cc",
]

// 1x1 transparent PNG placeholder (89 bytes)
const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==",
  "base64"
)

function placeholderResponse() {
  return new NextResponse(TRANSPARENT_PIXEL, {
    headers: {
      "Content-Type": "image/png",
      // Short cache so fresh URLs picked up quickly after cron re-scrape
      "Cache-Control": "public, max-age=300, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) return placeholderResponse()

  try {
    const decoded = decodeURIComponent(url)
    const requireHttps = process.env.NODE_ENV === "production"
    if (!isAllowedProxyHostname(decoded, ALLOWED_DOMAINS, requireHttps)) {
      return placeholderResponse()
    }

    const res = await fetch(decoded, {
      headers: {
        // Mimic a browser visit to Instagram — avoids CDN blocks
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.instagram.com/",
        "sec-fetch-dest": "image",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "cross-site",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    })

    // Expired/invalid URL — return placeholder instead of error
    if (!res.ok) {
      return placeholderResponse()
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache 1 hour on CDN, 24h in browser
        "Cache-Control": "public, max-age=86400, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    // Network error / timeout — return placeholder
    return placeholderResponse()
  }
}
