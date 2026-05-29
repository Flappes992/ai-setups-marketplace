export type AssetType = 'clonable' | 'tutorial_bundle';
export type SetupStatus = 'draft' | 'review' | 'live' | 'removed';

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
}

/** Row shape returned by `setups` query with `creator:profiles(*)` join */
export interface DbSetupWithCreator extends DbSetup {
  creator: DbProfile;
}
