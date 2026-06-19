// Typ-spezifische „Export-Prompts" für den Create/Upload-Screen. Ein Verkäufer, der
// GENAU weiß, was er verkauft (Skill / BrainPack / ClaudePack / Standard), kopiert den
// passenden Prompt, gibt ihn seinem eigenen Claude/ChatGPT mit dem Artefakt und bekommt
// JSON im SELBEN Schema wie der Setiq-Scan zurück → fließt durch parseScanOutput()
// (lib/scanImport.ts) und füllt den Upload-Screen vor.
//
// Unterschied zum universellen Setiq-Scan: der Scan zerlegt ein ganzes Chaos-Setup in
// VIELE Assets; diese Prompts verpacken gezielt EINEN Typ sauber.

export type ExportMode = 'standard' | 'skill' | 'brainpack' | 'claudepack';

const FENCE = '```';

const SECURITY_BLOCK = [
  'ENTSCHÄRFUNG (Pflicht): Entferne/ersetze ALLES Persönliche und Geheime —',
  'Namen, E-Mails, Telefonnummern, Adressen, API-Keys, Tokens, Passwörter,',
  'Webhook-/interne URLs, IDs, kunden-/firmen-/projektspezifische Details. Ersetze',
  'durch neutrale Platzhalter (z. B. {{API_KEY}}, [DEIN_NAME]). Das Ergebnis muss',
  'generisch und fremd-nutzbar sein. Notiere pro Asset unter "removedHere", was du entfernt hast.',
].join('\n');

interface ModeSpec {
  artefact: string;
  category: string;
  inventory: string;
  packaging: string;
}

const SPECS: Record<ExportMode, ModeSpec> = {
  skill: {
    artefact: 'einen Claude-/Agent-Skill (z. B. SKILL.md + zugehörige Anweisungen/Dateien)',
    category: 'skill',
    inventory:
      'Erfasse den Skill als EIN verkaufbares Asset: Name, was er kann, wann er automatisch greift (Trigger), und die vollständigen Anweisungen.',
    packaging:
      'Schreibe in "content" den kompletten, fremd-nutzbaren Skill (inkl. Trigger/Beschreibung), so dass ein Käufer ihn 1:1 als Skill anlegen kann.',
  },
  brainpack: {
    artefact: 'einen Knowledge-Vault (Obsidian / Logseq / Roam / Tana / …)',
    category: 'brainpack',
    inventory:
      'Erfasse den Vault als EIN Asset. Ermittle: Vault-Typ, ungefähre Notizen-Anzahl, Struktur/Methode (PARA, Zettelkasten, GTD …), benötigte Community-Plugins und einen Überblick der Ordnerstruktur.',
    packaging:
      'Schreibe in "content" eine klare Beschreibung des Aufbaus: Vault-Typ, Notizen-Anzahl, Struktur, benötigte Plugins (mit Namen) und einen kompakten Ordnerbaum. KEINE privaten Notizinhalte einfügen — nur Struktur & Konzept.',
  },
  claudepack: {
    artefact: 'eine Claude-Konfiguration (Personas, Slash-Commands, Subagents)',
    category: 'claudepack',
    inventory:
      'Erfasse das Pack als EIN Asset. Liste JEDE Persona, JEDEN Slash-Command und JEDEN Subagent einzeln auf.',
    packaging:
      'Schreibe in "content" alle Bausteine klar gegliedert und vollständig: ' +
      'pro Persona „PERSONA: <Titel> (project/global)" + Body; pro Command „COMMAND: /<trigger> — <summary>" + Body; ' +
      'pro Subagent „SUBAGENT: <name> — <summary>" + Body. Wortlaut der Bodies unverändert übernehmen.',
  },
  standard: {
    artefact: 'ein einzelnes Setup (Custom GPT, Prompt-Stack, n8n/Make-Workflow oder Tutorial)',
    category: 'prompt_stack',
    inventory:
      'Erfasse es als EIN verkaufbares Asset und bestimme die passende category: custom_gpt | prompt_stack | workflow | tutorial.',
    packaging:
      'Schreibe in "content" den vollständigen, fremd-nutzbaren Inhalt (z. B. die GPT-Instructions, die Prompt-Kette, die Workflow-Beschreibung).',
  },
};

/**
 * Baut den Export-Prompt für einen Upload-Modus. Output ist JSON im Setiq-Scan-Schema
 * mit GENAU einem Asset, das danach über „Setiq-Scan importieren" eingelesen wird.
 */
export function buildExportPrompt(mode: ExportMode): string {
  const spec = SPECS[mode];
  return [
    `Du bist der „Setiq-Export". Ich gebe dir gleich ${spec.artefact} und du verpackst es`,
    'verkaufsfertig für den Marktplatz Setiq. Arbeite in 3 Schritten:',
    '',
    `1) INVENTUR — ${spec.inventory}`,
    '',
    `2) ${SECURITY_BLOCK}`,
    '',
    `3) VERPACKUNG — ${spec.packaging}`,
    '   Zusätzlich: title (knackig, max 80 Zeichen), description (Nutzen in 1–3 Sätzen, max 500),',
    '   priceEur (realistisch, ganze Euro, mind. 5), 3–6 tags, qualityScore 1–5.',
    '',
    'AUSGABE — antworte mit NUR diesem JSON (kein Text davor/danach), exakt dieses Schema:',
    FENCE,
    '{',
    '  "securityReport": {',
    '    "redacted": ["kurze Liste, was du global entfernt hast"],',
    '    "warning": "Setiq garantiert keine Datensicherheit – prüfe jeden Inhalt selbst, bevor du veröffentlichst."',
    '  },',
    '  "assets": [',
    '    {',
    '      "title": "...",',
    '      "description": "...",',
    `      "category": "${spec.category}",`,
    '      "priceEur": 19,',
    '      "tags": ["...", "..."],',
    '      "content": "... gesäuberter, fremd-nutzbarer Inhalt ...",',
    '      "qualityScore": 4,',
    '      "removedHere": ["was du entfernt hast"]',
    '    }',
    '  ],',
    '  "allInOne": null',
    '}',
    FENCE,
    '',
    'Regeln: Genau EIN Asset in "assets". Erfinde nichts dazu, was nicht im Artefakt steht.',
    'Wenn etwas unklar ist, wähle die konservative (sicherere) Variante. Nur valides JSON.',
    '',
    `HIER IST MEIN ${mode.toUpperCase()}:`,
    '<<< füge hier dein Artefakt ein (oder hänge die Datei/den Vault-Export an) >>>',
  ].join('\n');
}

export const EXPORT_MODE_LABEL: Record<ExportMode, string> = {
  standard: 'Setup',
  skill: 'Skill',
  brainpack: 'BrainPack',
  claudepack: 'ClaudePack',
};
