"use client"

import useSWR from "swr"

export interface AppNotification {
  id: string
  type: "scrape_done" | "outlier" | "growth" | "script" | "credits" | string
  title: string
  description: string | null
  read: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useNotifications() {
  const { data, error, mutate } = useSWR<{ notifications: AppNotification[] }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30_000 } // poll every 30s
  )

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = async (ids?: string[]) => {
    // Optimistic update
    mutate(
      {
        notifications: notifications.map((n) =>
          !ids || ids.includes(n.id) ? { ...n, read: true } : n
        ),
      },
      false
    )
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    })
    mutate()
  }

  const markAllRead = () => markRead()

  return {
    notifications,
    unreadCount,
    loading: !data && !error,
    markRead,
    markAllRead,
    mutate,
  }
}
