// Baut pro Setup-Typ einen „Install-Prompt", den der Käufer kopiert und seinem
// eigenen Claude/ChatGPT gibt. Ziel: der fremde Assistent richtet das gekaufte
// Setup vollständig, lauffähig und sicher in der Umgebung des Käufers ein.
//
// Designprinzip pro Prompt: Rolle setzen → exakte, typ-spezifische Installation
// → Verifikation → Sicherheitsregel (nichts ungefragt überschreiben).

import type { Setup } from '@/types/setup';
import type { ClaudeManifest, BrainManifest } from '@/types/database';

const FENCE = '```';

const TARGET_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code (CLI)',
  'claude-desktop': 'Claude Desktop',
  'claude-projects': 'Claude.ai Projects',
};

function header(setup: Setup): string {
  return [
    `Du bist mein Setup-Installer. Ich habe auf Setiq das Setup „${setup.title}" gekauft`,
    `und möchte, dass du es bei mir vollständig und lauffähig einrichtest.`,
    `Arbeite sorgfältig, Schritt für Schritt, und richte dich exakt nach dem Inhalt unten.`,
    ``,
    `Kurzbeschreibung des Setups: ${setup.description || '(keine Beschreibung)'}`,
  ].join('\n');
}

function footer(needsContentPlaceholder: boolean, sourceUrl?: string): string {
  const parts: string[] = [];
  parts.push(
    '',
    'NACH DER INSTALLATION:',
    '- Liste mir auf, welche Dateien/Einstellungen du angelegt oder geändert hast.',
    '- Mach einen kurzen Funktions-Check (z. B. einen Command/Agent testen) und sag mir, ob alles läuft.',
    '- Erklär mir in 2–3 Sätzen, wie ich das Setup ab jetzt benutze.',
    '',
    'WICHTIG (Sicherheit): Überschreibe keine bestehenden Dateien oder Konfigurationen ungefragt.',
    'Zeig mir vorher, was kollidiert, und frag nach. Lass meine vorhandenen API-Keys/Secrets unangetastet.',
  );
  if (needsContentPlaceholder) {
    parts.push(
      '',
      '———',
      'HIER DER INHALT / DIE DATEI DES SETUPS (habe ich aus Setiq geladen):',
      '<<< füge hier den Inhalt ein oder hänge die heruntergeladene Datei an >>>',
    );
    if (sourceUrl) parts.push(`Quelle/Download: ${sourceUrl}`);
  }
  return parts.join('\n');
}

function claudePackBody(m: ClaudeManifest): string {
  const targets =
    (m.target_envs ?? []).map((t) => TARGET_LABELS[t] ?? t).join(', ') || 'Claude Code';
  const lines: string[] = [];
  lines.push(
    '',
    `Typ: ClaudePack. Zielumgebung(en): ${targets}.`,
    '',
    'So installierst du die Bausteine:',
    '- In Claude Code: Personas/Regeln gehören in die CLAUDE.md (Projekt-Scope → ./CLAUDE.md, ',
    '  Global-Scope → ~/.claude/CLAUDE.md). Commands als Markdown-Dateien unter ~/.claude/commands/<name>.md ',
    '  (bzw. ./.claude/commands/). Subagents als ~/.claude/agents/<name>.md mit passendem Frontmatter.',
    '- In Claude Desktop / Claude.ai Projects: Personas als Projekt-Instructions hinterlegen, ',
    '  Commands und Agents als benannte, wiederverwendbare Prompts speichern.',
    '',
    'Übernimm die folgenden Bausteine 1:1 (Inhalt NICHT verändern):',
  );

  for (const p of m.personas ?? []) {
    lines.push('', `### Persona: ${p.title}  (Scope: ${p.scope})`, FENCE, p.body, FENCE);
  }
  for (const c of m.commands ?? []) {
    lines.push('', `### Command: ${c.trigger}  — ${c.summary}`, FENCE, c.body, FENCE);
  }
  for (const a of m.agents ?? []) {
    lines.push('', `### Subagent: ${a.name}  — ${a.summary}`, FENCE, a.body, FENCE);
  }
  return lines.join('\n');
}

function brainPackBody(m: BrainManifest, assetUrl: string): string {
  const lines: string[] = [];
  lines.push(
    '',
    `Typ: BrainPack — ein ${m.vault_type}-Vault (${m.note_count} Notizen, Struktur: ${m.structure}).`,
    `Ich habe die ZIP-Datei aus Setiq heruntergeladen${assetUrl ? ` (Download: ${assetUrl})` : ''}.`,
    '',
    'So richtest du es ein:',
    `1. Entpacke die ZIP in einen neuen Ordner und öffne ihn als ${m.vault_type}-Vault.`,
  );
  if (m.community_plugins_required && m.community_plugins_required.length > 0) {
    lines.push(
      '2. Installiere/aktiviere diese Community-Plugins:',
      ...m.community_plugins_required.map(
        (p) => `   - ${p.name}${p.install_url ? ` (${p.install_url})` : ''}`,
      ),
    );
  }
  if (m.themes_included && m.themes_included.length > 0) {
    lines.push(`3. Optionale Themes: ${m.themes_included.join(', ')}.`);
  }
  if (m.folder_tree_preview && m.folder_tree_preview.length > 0) {
    lines.push('', 'Erwartete Ordnerstruktur:', FENCE, ...m.folder_tree_preview, FENCE);
  }
  if (m.sample_query_examples && m.sample_query_examples.length > 0) {
    lines.push(
      '',
      'Zeig mir danach, wie ich es nutze — z. B. mit diesen Beispiel-Abfragen:',
      ...m.sample_query_examples.map((q) => `   - ${q}`),
    );
  }
  return lines.join('\n');
}

const GENERIC_BODY: Record<string, string> = {
  skill: [
    '',
    'Typ: Skill (Claude/Agent-Skill).',
    'Lege ihn als Skill an (z. B. ~/.claude/skills/<name>/SKILL.md) gemäß dem Inhalt unten.',
    'Übernimm Name, Trigger/Beschreibung und Anweisungen exakt, damit der Skill automatisch greift.',
  ].join('\n'),
  mcp_stack: [
    '',
    'Typ: MCP-Server-Stack.',
    'Richte die MCP-Server in meiner Claude-Konfiguration ein (~/.claude/.mcp.json bzw. ',
    'claude_desktop_config.json). Installiere nötige Pakete/Runtimes, trage die Server-Einträge ein ',
    'und verifiziere am Ende, dass die Verbindung steht. Frag mich nach Keys, die ich selbst setzen muss ',
    '(setze keine erfundenen Werte ein).',
  ].join('\n'),
  persona: [
    '',
    'Typ: Persona / System-Prompt.',
    'Hinterlege sie als wiederverwendbare Persona — in Claude Code in der CLAUDE.md, in Claude.ai als ',
    'Projekt-Instructions. Übernimm den Wortlaut unverändert.',
  ].join('\n'),
  subagent: [
    '',
    'Typ: Subagent.',
    'Lege ihn als Subagent-Definition an (in Claude Code: ~/.claude/agents/<name>.md mit Frontmatter ',
    'für name/description/tools). Übernimm Rolle und Anweisungen exakt.',
  ].join('\n'),
  claude_config: [
    '',
    'Typ: Claude-Konfiguration.',
    'Übernimm die Einstellungen in meine ~/.claude-Konfiguration. WICHTIG: merge sie mit meiner ',
    'bestehenden Config, statt sie zu ersetzen — meine vorhandenen Keys/Permissions dürfen nicht verloren gehen.',
  ].join('\n'),
  prompt_stack: [
    '',
    'Typ: Prompt-Stack (mehrere zusammengehörige Prompts).',
    'Lege sie als benannte, wiederverwendbare Prompts/Snippets ab und erklär mir kurz, wann ich welchen nutze.',
  ].join('\n'),
  tutorial: [
    '',
    'Typ: Tutorial-Bundle.',
    'Lies bzw. strukturiere das Tutorial und führe mich Schritt für Schritt durch die Umsetzung. ',
    'Biete an, die beschriebenen Schritte direkt für mich auszuführen, wo möglich.',
  ].join('\n'),
};

const STANDARD_BODY = [
  '',
  'Erkenne selbst, um welche Art Setup es sich handelt (Prompt, Skill, Config, Workflow …), ',
  'und richte es passend und lauffähig in meiner Umgebung ein.',
].join('\n');

/**
 * Baut den vollständigen Install-Prompt für ein gekauftes Setup.
 * Für ClaudePacks ist der Inhalt vollständig eingebettet; für alle anderen Typen
 * referenziert der Prompt den heruntergeladenen Inhalt/die Datei (Platzhalter am Ende).
 */
export function buildInstallPrompt(setup: Setup): string {
  const sub = setup.assetSubtype ?? null;

  if (sub === 'claudepack' && setup.claudeManifest) {
    return [header(setup), claudePackBody(setup.claudeManifest), footer(false)].join('\n');
  }

  if (sub === 'brainpack' && setup.brainManifest) {
    return [header(setup), brainPackBody(setup.brainManifest, setup.assetUrl), footer(false)].join(
      '\n',
    );
  }

  const body = (sub && GENERIC_BODY[sub]) || STANDARD_BODY;
  return [header(setup), body, footer(true, setup.assetUrl || undefined)].join('\n');
}
