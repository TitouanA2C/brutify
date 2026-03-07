"use client";

import { useState } from "react";

export function proxyImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export function SocialAvatar({
  src,
  initials,
  size = 80,
}: {
  src?: string | null;
  initials: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const proxied = proxyImg(src);

  if (proxied && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proxied}
        alt=""
        className="h-full w-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brutify-gold/20 to-brutify-gold-dark/20">
      <span
        className="font-display text-brutify-gold"
        style={{ fontSize: size * 0.3 }}
      >
        {initials}
      </span>
    </div>
  );
}
