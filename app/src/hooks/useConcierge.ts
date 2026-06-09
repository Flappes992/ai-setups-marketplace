import { useCallback, useState } from 'react';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

export interface ConciergeMatch {
  setup: Setup;
  score: number;
  reasons: string[];
}

interface Result {
  matches: ConciergeMatch[];
  loading: boolean;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

const STOPWORDS = new Set([
  'ich',
  'du',
  'wir',
  'ein',
  'eine',
  'und',
  'oder',
  'der',
  'die',
  'das',
  'für',
  'mit',
  'auf',
  'in',
  'zu',
  'am',
  'ist',
  'sind',
  'was',
  'wie',
  'wo',
  'wer',
  'mehr',
  'auch',
  'noch',
  'will',
  'möchte',
  'brauche',
  'suche',
  'gerne',
  'about',
  'and',
  'or',
  'the',
  'for',
  'with',
  'looking',
  'need',
  'want',
  'something',
  'setup',
  'setups',
  'ai',
]);

const INTENT_BOOSTS: { keywords: string[]; tags: string[]; reason: string }[] = [
  { keywords: ['email', 'cold', 'outreach'], tags: ['cold-email', 'email', 'outreach', 'sales'], reason: 'Cold-Email-Intent erkannt' },
  { keywords: ['workflow', 'automat', 'n8n', 'zapier', 'make'], tags: ['n8n', 'zapier', 'workflow', 'automation', 'make'], reason: 'Automation-Workflow gesucht' },
  { keywords: ['video', 'youtube', 'shorts', 'reel'], tags: ['youtube', 'video', 'shorts'], reason: 'Video-Content-Intent' },
  { keywords: ['blog', 'artikel', 'seo', 'text'], tags: ['blog', 'seo', 'content', 'writing'], reason: 'Content-Writing-Intent' },
  { keywords: ['code', 'cursor', 'copilot', 'dev', 'programmier'], tags: ['cursor', 'copilot', 'code', 'dev', 'coding'], reason: 'Coding-Tool gesucht' },
  { keywords: ['midjourney', 'bild', 'image', 'art', 'design'], tags: ['midjourney', 'image', 'design', 'visual'], reason: 'Bild/Design-Intent' },
  { keywords: ['voice', 'audio', 'tts', 'sound', 'musik'], tags: ['voice', 'audio', 'tts', 'elevenlabs', 'suno'], reason: 'Audio/Voice-Intent' },
  { keywords: ['social', 'instagram', 'tiktok', 'x ', 'twitter'], tags: ['social', 'instagram', 'tiktok', 'twitter'], reason: 'Social-Media-Intent' },
  { keywords: ['business', 'agency', 'lead', 'verkauf', 'sales'], tags: ['business', 'agency', 'sales', 'lead', 'crm'], reason: 'Business/Sales-Intent' },
  { keywords: ['claude', 'anthropic'], tags: ['claude', 'anthropic'], reason: 'Claude-spezifisch' },
  { keywords: ['gpt', 'chatgpt', 'openai'], tags: ['gpt', 'chatgpt', 'openai'], reason: 'ChatGPT-spezifisch' },
  { keywords: ['gemini'], tags: ['gemini'], reason: 'Gemini-spezifisch' },
  { keywords: ['lerne', 'anfänger', 'beginner', 'einstieg', 'tutorial'], tags: ['tutorial', 'beginner', 'lernen'], reason: 'Lern-Intent erkannt' },
  { keywords: ['obsidian', 'vault', 'second brain', 'second-brain', 'brainpack', 'brain pack', 'zettelkasten', 'para', 'notizen', 'knowledge'], tags: ['brainpack', 'vault-obsidian', 'vault-logseq', 'vault-custom'], reason: 'BrainPack / Second-Brain gesucht' },
  { keywords: ['claudepack', 'claude pack', 'persona', 'slash command', 'slash-command', 'subagent', 'sub-agent', 'agents', 'claude code', 'claude config', 'claude.md'], tags: ['claudepack', 'claude', 'claude-code', 'claude-projects', 'claude-desktop'], reason: 'ClaudePack / Claude-Setup gesucht' },
  { keywords: ['günstig', 'kostenlos', 'free', 'cheap'], tags: [], reason: 'Preis-sensitiv (sortiert günstig zuerst)' },
];

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function useConcierge(): Result {
  const [matches, setMatches] = useState<ConciergeMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    setLoading(true);

    const tokens = tokenize(query);

    // Detect intents
    const activeIntents = INTENT_BOOSTS.filter((b) =>
      b.keywords.some((kw) => query.toLowerCase().includes(kw)),
    );
    const intentTags = new Set(activeIntents.flatMap((i) => i.tags));
    const intentReasons = activeIntents.map((i) => i.reason);
    const cheapBoost = activeIntents.some((i) =>
      ['kostenlos', 'free', 'günstig', 'cheap'].some((k) => i.keywords.includes(k)),
    );

    // Fetch all live setups (small enough for now)
    const { data } = await supabase
      .from('setups')
      .select('*, creator:profiles!setups_creator_id_fkey(*)')
      .eq('status', 'live');
    const all = (data as DbSetupWithCreator[] | null) ?? [];

    const scored: ConciergeMatch[] = [];
    for (const db of all) {
      const setup = mapDbSetupToSetup(db);
      const reasons: string[] = [];
      let score = 0;
      const haystack = [
        setup.title.toLowerCase(),
        setup.description.toLowerCase(),
        setup.tags.map((t) => t.toLowerCase()).join(' '),
      ].join(' ');

      for (const tok of tokens) {
        if (haystack.includes(tok)) {
          score += 5;
          if (setup.tags.some((t) => t.toLowerCase() === tok)) {
            score += 5;
            reasons.push(`Tag #${tok}`);
          } else if (setup.title.toLowerCase().includes(tok)) {
            score += 3;
            reasons.push(`„${tok}" im Titel`);
          }
        }
      }

      for (const tag of intentTags) {
        if (setup.tags.some((t) => t.toLowerCase() === tag)) {
          score += 8;
        }
      }

      if (cheapBoost) {
        score += Math.max(0, 10 - setup.priceCents / 100);
      }

      if (score > 0) {
        // unique reasons
        const dedup = [...new Set([...reasons, ...intentReasons])].slice(0, 3);
        scored.push({ setup, score, reasons: dedup });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    setMatches(scored.slice(0, 20));
    setLoading(false);
  }, []);

  const clear = useCallback(() => setMatches([]), []);

  return { matches, loading, search, clear };
}
