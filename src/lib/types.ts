// Central domain types — replaces mock-data.ts type exports
// All actual data now comes from the API / Supabase.

export type Platform = "instagram" | "tiktok" | "youtube";

export type HookType =
  | "Contrarian"
  | "Secret"
  | "Douleur"
  | "Story"
  | "Expérience"
  | "Rupture"
  | "Chiffre choc"
  | "Question";

export type BrutBoardStatus =
  | "idea"
  | "draft"
  | "in_progress"
  | "scheduled"
  | "published";

export type ScriptStatus = "draft" | "saved";
export type IdeaType = "video" | "script" | "manual" | "ai";

// Re-export DTO types under their canonical names so components
// don't need to change their import paths.
export type { CreatorDTO as Creator, VideoDTO as Video } from "@/lib/api/helpers";

export interface HookTemplate {
  id: string;
  name: string;
  template: string;
  type: HookType;
  performanceScore: number;
}

export interface ScriptStructure {
  id: string;
  name: string;
  skeleton: string;
  description: string;
}

export interface BrutBoardItem {
  id: string;
  title: string;
  status: BrutBoardStatus;
  date: string;
  platform: Platform;
  scriptId?: string;
  sourceVideoId?: string;
  notes: string;
}

export interface Idea {
  id: string;
  type: IdeaType;
  content: string;
  source?: string;
  tags: string[];
  createdAt: string;
}
