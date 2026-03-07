import { createServiceClient } from "@/lib/supabase/server"

export type NotificationType =
  | "scrape_done"
  | "outlier"
  | "growth"
  | "script"
  | "credits"

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  description?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = createServiceClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    metadata: input.metadata ?? null,
    read: false,
  })

  if (error) {
    console.error("[createNotification]", error.message)
  }
}
