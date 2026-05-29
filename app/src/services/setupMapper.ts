import { Setup, Creator } from '@/types/setup';
import { DbSetupWithCreator, DbProfile } from '@/types/database';

function mapCreator(db: DbProfile): Creator {
  return {
    id: db.id,
    username: db.username,
    displayName: db.display_name,
    avatarUrl: db.avatar_url ?? '',
    bio: db.bio ?? '',
    ratingAverage: db.rating_average,
    setupsCount: db.setups_count,
  };
}

export function mapDbSetupToSetup(db: DbSetupWithCreator): Setup {
  return {
    id: db.id,
    creator: mapCreator(db.creator),
    title: db.title,
    description: db.description,
    videoUrl: db.video_url ?? '',
    videoThumbnail: db.video_thumbnail,
    assetType: db.asset_type,
    priceCents: db.price_cents,
    currency: db.currency as 'EUR',
    tags: db.tags,
    ratingAverage: db.rating_average,
    ratingsCount: db.ratings_count,
    createdAt: db.created_at,
  };
}
