export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: "creator" | "growth" | "scale"
          credits: number
          borrowed_credits: number
          rollover_credits: number
          free_transcripts_used: number
          free_transcripts_reset_at: string | null
          activation_bonuses: Record<string, boolean> | null
          monthly_credits_reset_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          niche: string | null
          tone_of_voice: string | null
          writing_style: string | null
          instagram_handle: string | null
          tiktok_handle: string | null
          youtube_handle: string | null
          free_analyses_used: number
          free_analyses_reset_at: string | null
          onboarding_completed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: "creator" | "growth" | "scale"
          credits?: number
          borrowed_credits?: number
          rollover_credits?: number
          free_transcripts_used?: number
          free_transcripts_reset_at?: string | null
          activation_bonuses?: Record<string, boolean> | null
          monthly_credits_reset_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          niche?: string | null
          tone_of_voice?: string | null
          writing_style?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          youtube_handle?: string | null
          free_analyses_used?: number
          free_analyses_reset_at?: string | null
          onboarding_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: "creator" | "growth" | "scale"
          credits?: number
          borrowed_credits?: number
          rollover_credits?: number
          free_transcripts_used?: number
          free_transcripts_reset_at?: string | null
          activation_bonuses?: Record<string, boolean> | null
          monthly_credits_reset_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          niche?: string | null
          tone_of_voice?: string | null
          writing_style?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          youtube_handle?: string | null
          free_analyses_used?: number
          free_analyses_reset_at?: string | null
          onboarding_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      creator_analyses: {
        Row: {
          id: string
          creator_id: string
          user_id: string
          analysis: Record<string, unknown>
          videos_analyzed: number
          tokens_used: number | null
          cost_bp: number
          status: "pending" | "processing" | "completed" | "failed"
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          user_id: string
          analysis?: Record<string, unknown>
          videos_analyzed?: number
          tokens_used?: number | null
          cost_bp?: number
          status?: "pending" | "processing" | "completed" | "failed"
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          user_id?: string
          analysis?: Record<string, unknown>
          videos_analyzed?: number
          tokens_used?: number | null
          cost_bp?: number
          status?: "pending" | "processing" | "completed" | "failed"
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_analyses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          action: string
          reference_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          action: string
          reference_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          action?: string
          reference_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          id: string
          platform: string
          platform_id: string
          handle: string
          name: string | null
          avatar_url: string | null
          bio: string | null
          followers: number | null
          avg_views: number | null
          engagement_rate: number | null
          growth_rate: number | null
          posts_count: number | null
          niche: string | null
          last_scraped_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          platform: string
          platform_id: string
          handle: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          followers?: number | null
          avg_views?: number | null
          engagement_rate?: number | null
          growth_rate?: number | null
          posts_count?: number | null
          niche?: string | null
          last_scraped_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          platform?: string
          platform_id?: string
          handle?: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          followers?: number | null
          avg_views?: number | null
          engagement_rate?: number | null
          growth_rate?: number | null
          posts_count?: number | null
          niche?: string | null
          last_scraped_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          added_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          added_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          creator_id?: string
          added_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          id: string
          creator_id: string
          platform: string
          platform_video_id: string
          title: string | null
          description: string | null
          url: string | null
          thumbnail_url: string | null
          duration: number | null
          views: number | null
          likes: number | null
          comments: number | null
          shares: number | null
          outlier_score: number | null
          posted_at: string | null
          scraped_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          platform: string
          platform_video_id: string
          title?: string | null
          description?: string | null
          url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          views?: number | null
          likes?: number | null
          comments?: number | null
          shares?: number | null
          outlier_score?: number | null
          posted_at?: string | null
          scraped_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          platform?: string
          platform_video_id?: string
          title?: string | null
          description?: string | null
          url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          views?: number | null
          likes?: number | null
          comments?: number | null
          shares?: number | null
          outlier_score?: number | null
          posted_at?: string | null
          scraped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          id: string
          video_id: string
          user_id: string
          content: string
          language: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          content: string
          language?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          content?: string
          language?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_analyses: {
        Row: {
          id: string
          video_id: string
          user_id: string
          hook_type: string | null
          hook_analysis: string | null
          structure_type: string | null
          structure_analysis: string | null
          style_analysis: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          hook_type?: string | null
          hook_analysis?: string | null
          structure_type?: string | null
          structure_analysis?: string | null
          style_analysis?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          hook_type?: string | null
          hook_analysis?: string | null
          structure_type?: string | null
          structure_analysis?: string | null
          style_analysis?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_analyses_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          id: string
          user_id: string
          title: string | null
          subject: string | null
          initial_draft: string | null
          hook_type: string | null
          hook_text: string | null
          structure_type: string | null
          body: string | null
          cta: string | null
          ai_notes: string | null
          tone: string | null
          niche: string | null
          source_video_id: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          subject?: string | null
          initial_draft?: string | null
          hook_type?: string | null
          hook_text?: string | null
          structure_type?: string | null
          body?: string | null
          cta?: string | null
          ai_notes?: string | null
          tone?: string | null
          niche?: string | null
          source_video_id?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          subject?: string | null
          initial_draft?: string | null
          hook_type?: string | null
          hook_text?: string | null
          structure_type?: string | null
          body?: string | null
          cta?: string | null
          ai_notes?: string | null
          tone?: string | null
          niche?: string | null
          source_video_id?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_items: {
        Row: {
          id: string
          user_id: string
          title: string
          status: string
          scheduled_date: string | null
          platform: string | null
          script_id: string | null
          source_video_id: string | null
          notes: string | null
          position: number | null
          shoot_date: string | null
          edit_date: string | null
          publish_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          status?: string
          scheduled_date?: string | null
          platform?: string | null
          script_id?: string | null
          source_video_id?: string | null
          notes?: string | null
          position?: number | null
          shoot_date?: string | null
          edit_date?: string | null
          publish_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          status?: string
          scheduled_date?: string | null
          platform?: string | null
          script_id?: string | null
          source_video_id?: string | null
          notes?: string | null
          position?: number | null
          shoot_date?: string | null
          edit_date?: string | null
          publish_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_templates: {
        Row: {
          id: string
          user_id: string
          kind: string
          name: string
          template: string
          hook_type: string | null
          skeleton: string | null
          description: string | null
          source: string
          source_id: string | null
          performance_score: number | null
          use_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          kind: string
          name: string
          template: string
          hook_type?: string | null
          skeleton?: string | null
          description?: string | null
          source: string
          source_id?: string | null
          performance_score?: number | null
          use_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          name?: string
          template?: string
          hook_type?: string | null
          skeleton?: string | null
          description?: string | null
          source?: string
          source_id?: string | null
          performance_score?: number | null
          use_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string
          source_handle: string | null
          source_video_id: string | null
          source_script_id: string | null
          tags: string[] | null
          metadata: Record<string, unknown> | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content: string
          source_handle?: string | null
          source_video_id?: string | null
          source_script_id?: string | null
          tags?: string[] | null
          metadata?: Record<string, unknown> | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string
          source_handle?: string | null
          source_video_id?: string | null
          source_script_id?: string | null
          tags?: string[] | null
          metadata?: Record<string, unknown> | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hook_templates: {
        Row: {
          id: string
          name: string
          type: string
          template: string
          description: string | null
          performance_score: number | null
          position: number | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          template: string
          description?: string | null
          performance_score?: number | null
          position?: number | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          template?: string
          description?: string | null
          performance_score?: number | null
          position?: number | null
        }
        Relationships: []
      }
      script_structures: {
        Row: {
          id: string
          name: string
          skeleton: string
          description: string | null
          position: number | null
        }
        Insert: {
          id?: string
          name: string
          skeleton: string
          description?: string | null
          position?: number | null
        }
        Update: {
          id?: string
          name?: string
          skeleton?: string
          description?: string | null
          position?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_action: string
          p_reference_id?: string | null
        }
        Returns: boolean
      }
      calculate_outlier_score: {
        Args: {
          p_video_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
