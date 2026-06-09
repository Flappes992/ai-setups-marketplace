import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

export interface Bundle {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  discountPct: number;
  setups: Setup[];
  totalPriceCents: number;
  discountedPriceCents: number;
  createdAt: string;
}

interface UseBundlesResult {
  bundles: Bundle[];
  loading: boolean;
  refresh: () => Promise<void>;
}

function buildBundle(
  raw: {
    id: string;
    creator_id: string;
    title: string;
    description: string | null;
    discount_pct: number;
    created_at: string;
  },
  setups: Setup[],
): Bundle {
  const total = setups.reduce((s, x) => s + x.priceCents, 0);
  const discounted = Math.round(total * (1 - raw.discount_pct / 100));
  return {
    id: raw.id,
    creatorId: raw.creator_id,
    title: raw.title,
    description: raw.description,
    discountPct: raw.discount_pct,
    setups,
    totalPriceCents: total,
    discountedPriceCents: discounted,
    createdAt: raw.created_at,
  };
}

export function useBundles(creatorId?: string): UseBundlesResult {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('bundles')
      .select('id, creator_id, title, description, discount_pct, created_at')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(50);
    if (creatorId) q = q.eq('creator_id', creatorId);
    const { data: rawBundles } = await q;
    const bundlesArr =
      (rawBundles as
        | {
            id: string;
            creator_id: string;
            title: string;
            description: string | null;
            discount_pct: number;
            created_at: string;
          }[]
        | null) ?? [];
    if (bundlesArr.length === 0) {
      setBundles([]);
      setLoading(false);
      return;
    }

    const bundleIds = bundlesArr.map((b) => b.id);
    const { data: items } = await supabase
      .from('bundle_items')
      .select('bundle_id, setup_id, position')
      .in('bundle_id', bundleIds);
    const setupIds = [
      ...new Set(
        ((items as { bundle_id: string; setup_id: string; position: number }[] | null) ?? []).map(
          (i) => i.setup_id,
        ),
      ),
    ];
    const { data: setupRows } =
      setupIds.length > 0
        ? await supabase
            .from('setups')
            .select('*, creator:profiles!setups_creator_id_fkey(*)')
            .in('id', setupIds)
        : { data: [] };
    const setupMap = new Map<string, Setup>();
    for (const s of (setupRows as DbSetupWithCreator[] | null) ?? []) {
      setupMap.set(s.id, mapDbSetupToSetup(s));
    }

    const itemsByBundle = new Map<string, { setup_id: string; position: number }[]>();
    for (const it of (items as { bundle_id: string; setup_id: string; position: number }[] | null) ??
      []) {
      const arr = itemsByBundle.get(it.bundle_id) ?? [];
      arr.push({ setup_id: it.setup_id, position: it.position });
      itemsByBundle.set(it.bundle_id, arr);
    }

    setBundles(
      bundlesArr.map((b) => {
        const its = (itemsByBundle.get(b.id) ?? []).sort((a, c) => a.position - c.position);
        const ss = its.map((i) => setupMap.get(i.setup_id)).filter((s): s is Setup => !!s);
        return buildBundle(b, ss);
      }),
    );
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    load();
  }, [load]);

  return { bundles, loading, refresh: load };
}
