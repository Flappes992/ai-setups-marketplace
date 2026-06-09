import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { Setup } from '@/types/setup';

const PREFERENCE_TO_TAGS: Record<string, string[]> = {
  // interests
  custom_gpts: ['gpt', 'chatgpt', 'custom-gpt', 'gpts', 'customgpt'],
  prompt_stacks: ['prompt', 'prompts', 'prompt-stack', 'promptstack'],
  workflows: ['n8n', 'zapier', 'make', 'workflow', 'automation'],
  coding: ['cursor', 'copilot', 'code', 'dev', 'coding', 'github'],
  marketing: ['marketing', 'sales', 'cold-email', 'coldemail', 'funnel', 'ads'],
  content: ['content', 'youtube', 'blog', 'social', 'instagram', 'tiktok'],
  visual: ['midjourney', 'dalle', 'sora', 'image', 'video', 'design'],
  voice: ['elevenlabs', 'suno', 'voice', 'audio', 'tts', 'music'],
  tutorials: ['tutorial', 'beginner', 'lernen', 'lerne', 'kurs'],
  business: ['business', 'agency', 'b2b', 'finance', 'startup'],

  // ai_tools direct mapping
  chatgpt: ['chatgpt', 'gpt', 'openai'],
  claude: ['claude', 'anthropic'],
  gemini: ['gemini', 'google'],
  perplexity: ['perplexity'],
  midjourney: ['midjourney', 'mj'],
  dalle: ['dalle', 'sora', 'openai'],
  cursor: ['cursor', 'copilot'],
  notion_ai: ['notion'],
  app_builders: ['lovable', 'v0', 'bolt', 'replit'],
  automation: ['n8n', 'zapier', 'make'],
  voice_tools: ['elevenlabs', 'suno'],
  local: ['ollama', 'lm-studio', 'local-llm', 'llama'],
};

const GOAL_TO_BOOST_TAGS: Record<string, string[]> = {
  money: ['money', 'business', 'cashflow', 'sales', 'monetize', 'revenue'],
  quality: ['quality', 'pro', 'advanced', 'expert'],
  learn: ['tutorial', 'beginner', 'lernen', 'kurs', 'guide'],
  time: ['automation', 'workflow', 'time-save', 'productivity'],
};

interface Preferences {
  ai_frequency?: string;
  ai_tools?: string[];
  interests?: string[];
  goal?: string;
  discovery?: string;
}

interface Result {
  preferences: Preferences | null;
  loading: boolean;
  scoreSetup: (s: Setup) => number;
}

export function useFeedPersonalization(): Result {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', myId)
      .single();
    setPreferences((data as { preferences?: Preferences } | null)?.preferences ?? null);
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  // Build the set of preferred tags from user's answers
  const prefTagSet = useMemo(() => {
    if (!preferences) return new Set<string>();
    const tags = new Set<string>();
    const collectFor = (key: string) => {
      const mapped = PREFERENCE_TO_TAGS[key];
      if (mapped) mapped.forEach((t) => tags.add(t.toLowerCase()));
    };
    (preferences.interests ?? []).forEach(collectFor);
    (preferences.ai_tools ?? []).forEach(collectFor);
    return tags;
  }, [preferences]);

  const goalBoostSet = useMemo(() => {
    if (!preferences?.goal) return new Set<string>();
    const mapped = GOAL_TO_BOOST_TAGS[preferences.goal] ?? [];
    return new Set(mapped.map((t) => t.toLowerCase()));
  }, [preferences?.goal]);

  const scoreSetup = useCallback(
    (setup: Setup): number => {
      if (prefTagSet.size === 0 && goalBoostSet.size === 0) return 0;
      const setupTags = setup.tags.map((t) => t.toLowerCase());
      let score = 0;
      for (const t of setupTags) {
        if (prefTagSet.has(t)) score += 10;
        if (goalBoostSet.has(t)) score += 4;
      }
      // Beginner-Boost: starting user → tutorial-Tag bekommt extra boost
      if (preferences?.ai_frequency === 'starting') {
        for (const t of setupTags) {
          if (t.includes('tutorial') || t.includes('beginner') || t.includes('lernen')) {
            score += 6;
          }
        }
      }
      return score;
    },
    [prefTagSet, goalBoostSet, preferences?.ai_frequency],
  );

  return { preferences, loading, scoreSetup };
}
