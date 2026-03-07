import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) return new NextResponse("Missing url", { status: 400 })

  // Validation SSRF : autoriser uniquement les domaines de confiance
  const allowedDomains = [
    "instagram.com",
    "cdninstagram.com",
    "fbcdn.net",
    "tiktokcdn.com",
    "tiktok.com",
    "ytimg.com",
    "youtube.com",
    "ggpht.com",
    "pravatar.cc",
  ];

  try {
    const decoded = decodeURIComponent(url)
    const urlObj = new URL(decoded)
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain))
    
    if (!isAllowed) {
      return new NextResponse("Domaine non autorisé", { status: 403 })
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
      // Don't follow Instagram redirects to login page
      redirect: "follow",
    })

    if (!res.ok) {
      return new NextResponse("Image fetch failed", { status: res.status })
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
    return new NextResponse("Proxy error", { status: 502 })
  }
}
