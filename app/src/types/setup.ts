import { AssetType } from '@/types/database';
export type { AssetType };

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  ratingAverage: number;
  setupsCount: number;
}

export interface Setup {
  id: string;
  creator: Creator;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: string;
  assetType: AssetType;
  assetUrl: string;
  /** Preis in Cents */
  priceCents: number;
  currency: 'EUR';
  tags: string[];
  ratingAverage: number;
  ratingsCount: number;
  createdAt: string;
}
