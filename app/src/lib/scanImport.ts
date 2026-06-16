// Setiq-Scan: parst die JSON-Ausgabe des „Setiq-Scan"-Prompts (siehe
// setiq-launch/SETIQ_SCAN_PROMPT.md) und mappt sie auf den Upload-Screen.

export type ScanCategory =
  | 'skill'
  | 'custom_gpt'
  | 'prompt_stack'
  | 'workflow'
  | 'brainpack'
  | 'claudepack'
  | 'claude_config'
  | 'midjourney'
  | 'tutorial';

export interface ScanAsset {
  title: string;
  description: string;
  category: string;
  priceEur: number;
  tags: string[];
  content: string;
  qualityScore: number;
  removedHere: string[];
}

export interface ScanResult {
  securityReport: { redacted: string[]; warning: string };
  assets: ScanAsset[];
  allInOne: { title: string; description: string; priceEur: number } | null;
}

export type UploadMode = 'standard' | 'skill' | 'brainpack' | 'claudepack';

export interface ScanPrefill {
  title: string;
  description: string;
  tags: string[];
  priceEur: number;
  mode: UploadMode;
  content: string;
}

export function categoryToMode(cat: string): UploadMode {
  switch (cat) {
    case 'skill':
      return 'skill';
    case 'brainpack':
      return 'brainpack';
    case 'claudepack':
    case 'claude_config':
      return 'claudepack';
    default:
      return 'standard';
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  skill: '🧩 Skill',
  custom_gpt: '🤖 Custom GPT',
  prompt_stack: '📝 Prompt-Stack',
  workflow: '⚙️ Workflow',
  brainpack: '🧠 BrainPack',
  claudepack: '🪐 ClaudePack',
  claude_config: '🪐 Claude-Config',
  midjourney: '🎨 Midjourney',
  tutorial: '📚 Tutorial',
};

export function categoryLabel(cat: string): string {
  return CATEGORY_LABEL[cat] ?? cat;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter((x) => x.length > 0);
}

// Holt das JSON aus der LLM-Antwort raus, auch wenn ```json-Fences oder
// erklärender Text drumherum stehen.
function extractJson(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

export function parseScanOutput(
  raw: string,
): { ok: true; result: ScanResult } | { ok: false; error: string } {
  if (!raw.trim()) return { ok: false, error: 'Leer — füg die JSON-Ausgabe des Setiq-Scans ein.' };
  let data: any;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    return { ok: false, error: 'Das ist kein gültiges JSON. Kopier die komplette Antwort des Setiq-Scans.' };
  }
  if (!data || !Array.isArray(data.assets) || data.assets.length === 0) {
    return { ok: false, error: 'Keine „assets" gefunden. Stimmt das mit der Setiq-Scan-Ausgabe?' };
  }

  const assets: ScanAsset[] = data.assets
    .map((a: any) => ({
      title: String(a?.title ?? '').trim().slice(0, 80),
      description: String(a?.description ?? '').trim().slice(0, 500),
      category: String(a?.category ?? 'prompt_stack').trim(),
      priceEur: Math.max(0, Math.round(num(a?.priceEur, 9))),
      tags: strArray(a?.tags).slice(0, 8),
      content: String(a?.content ?? '').trim(),
      qualityScore: Math.min(5, Math.max(1, Math.round(num(a?.qualityScore, 3)))),
      removedHere: strArray(a?.removedHere),
    }))
    .filter((a: ScanAsset) => a.title.length > 0);

  if (assets.length === 0) {
    return { ok: false, error: 'Alle Assets ohne Titel — die Ausgabe sieht unvollständig aus.' };
  }

  const sr = data.securityReport ?? {};
  const aio = data.allInOne;

  return {
    ok: true,
    result: {
      securityReport: {
        redacted: strArray(sr.redacted),
        warning:
          String(sr.warning ?? '').trim() ||
          'Prüfe jeden Inhalt selbst, bevor du veröffentlichst — eine 100% Datensicherheit gibt es nicht.',
      },
      assets,
      allInOne:
        aio && typeof aio === 'object'
          ? {
              title: String(aio.title ?? '').trim().slice(0, 80),
              description: String(aio.description ?? '').trim().slice(0, 500),
              priceEur: Math.max(0, Math.round(num(aio.priceEur, 49))),
            }
          : null,
    },
  };
}

export function assetToPrefill(a: ScanAsset): ScanPrefill {
  return {
    title: a.title,
    description: a.description,
    tags: a.tags,
    priceEur: a.priceEur,
    mode: categoryToMode(a.category),
    content: a.content,
  };
}

export function allInOnePrefill(
  aio: NonNullable<ScanResult['allInOne']>,
  assets: ScanAsset[],
): ScanPrefill {
  const tags = Array.from(new Set(assets.flatMap((a) => a.tags))).slice(0, 8);
  const content = assets
    .map((a, i) => `### ${i + 1}. ${a.title}\n${a.content}`)
    .join('\n\n———\n\n');
  return {
    title: aio.title,
    description: aio.description,
    tags,
    priceEur: aio.priceEur,
    mode: 'standard',
    content,
  };
}
