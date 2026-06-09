export type AssetType = 'clonable' | 'tutorial_bundle';
export type AssetSubtype =
  | 'brainpack'
  | 'claudepack'
  | 'persona'
  | 'skill'
  | 'subagent'
  | 'mcp_stack'
  | 'claude_config'
  | 'prompt_stack'
  | 'tutorial';
export type SetupStatus = 'draft' | 'review' | 'live' | 'removed';

export type BrainVaultType = 'obsidian' | 'logseq' | 'roam' | 'tana' | 'custom';
export type BrainStructure =
  | 'para'
  | 'zettelkasten'
  | 'gtd'
  | 'johnny_decimal'
  | 'evergreen'
  | 'custom';

export interface BrainPluginRef {
  id: string;
  name: string;
  install_url?: string;
}

export type ClaudeTargetEnv = 'claude-code' | 'claude-desktop' | 'claude-projects';

export interface ClaudePersona {
  title: string;
  scope: 'project' | 'global';
  body: string;
}

export interface ClaudeCommand {
  trigger: string;
  summary: string;
  body: string;
}

export interface ClaudeAgent {
  name: string;
  summary: string;
  body: string;
}

export interface ClaudeManifest {
  id: string;
  manifest_version: 1;
  target_envs: ClaudeTargetEnv[];
  personas: ClaudePersona[];
  commands: ClaudeCommand[];
  agents: ClaudeAgent[];
}

export interface BrainManifest {
  vault_type: BrainVaultType;
  structure: BrainStructure;
  note_count: number;
  core_plugins_used?: string[];
  community_plugins_required?: BrainPluginRef[];
  themes_included?: string[];
  ai_optimized_for?: string[];
  sample_query_examples?: string[];
  folder_tree_preview?: string[];
}

export interface DbProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  rating_average: number;
  setups_count: number;
  created_at: string;
}

export interface DbSetup {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  video_url: string | null;
  video_thumbnail: string;
  asset_type: AssetType;
  asset_url: string | null;
  price_cents: number;
  currency: string;
  tags: string[];
  rating_average: number;
  ratings_count: number;
  status: SetupStatus;
  created_at: string;
  roi_time_saved_minutes?: number | null;
  roi_use_frequency?: 'daily' | 'weekly' | 'monthly' | 'one_time' | null;
  version?: number;
  asset_subtype?: AssetSubtype | null;
  brain_manifest?: BrainManifest | null;
  claude_manifest?: ClaudeManifest | null;
}

/** Row shape returned by `setups` query with `creator:profiles(*)` join */
export interface DbSetupWithCreator extends DbSetup {
  creator: DbProfile;
}
