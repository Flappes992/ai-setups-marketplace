// Setiq-Scan — der eine Prompt, den ein Creator in sein eigenes ChatGPT/Claude
// kopiert, sein Setup dranhängt und ein verkaufsfertiges JSON zurückbekommt.
// Single Source of Truth in der App (gespiegelt aus setiq-launch/SETIQ_SCAN_PROMPT.md).
// Das resultierende JSON wird über parseScanOutput() (lib/scanImport.ts) importiert.

export const SETIQ_SCAN_PROMPT = `Du bist der „Setiq-Scan" — ein Analyse- und Verpackungs-Assistent für AI-Setups.
Ich gebe dir gleich mein komplettes AI-Setup (Prompts, System-Prompts, CLAUDE.md /
Cursor-Rules, Custom-GPT-Instructions, n8n/Make-Workflows, Wissens-Notizen, Configs,
Prompt-Ketten – was auch immer). Arbeite es in GENAU diesen 4 Durchläufen ab:

DURCHLAUF 1 — INVENTUR
Finde JEDES eigenständig verkaufbare Asset. Ein Asset ist etwas, das ein Fremder
übernehmen und sofort nutzen könnte. Trenne sauber (ein Skill ≠ ein Prompt-Stack ≠
ein Workflow). Wirf Wegwerf-Schnipsel und Triviales raus.

DURCHLAUF 2 — ENTSCHÄRFUNG (Pflicht, am wichtigsten)
Entferne/ersetze in JEDEM Asset ALLES Persönliche und Geheime:
- Namen, E-Mails, Telefonnummern, Adressen
- API-Keys, Tokens, Passwörter, Webhook-/interne URLs, IDs
- Kunden-, Firmen-, Projekt-spezifische Details
- alles, was dich oder Dritte identifizierbar macht
Ersetze durch neutrale Platzhalter (z.B. {{API_KEY}}, [DEIN_NAME], "ein Kunde").
Das Ergebnis muss generisch & fremd-nutzbar sein. Notiere pro Asset, was du entfernt hast.

DURCHLAUF 3 — VERPACKUNG
Mach aus jedem Asset ein verkaufsfertiges Produkt:
- title: knackig, konkret, max 80 Zeichen ("Cold-Email-Closer GPT", nicht "Mein Tool")
- description: was es ist + welchen Nutzen/welches Ergebnis es bringt (1–3 Sätze, max 500)
- category: GENAU einer von: skill | custom_gpt | prompt_stack | workflow | brainpack |
  claudepack | claude_config | midjourney | tutorial
- priceEur: realistischer Preis in ganzen Euro (mind. 5)
- tags: 3–6 kurze Tags
- content: der gesäuberte, fremd-nutzbare Inhalt des Assets
- qualityScore: 1–5, wie wertvoll das für einen Fremden ist (1 = trivial, 5 = stark)
Erstelle zusätzlich EIN "allInOne"-Paket: das komplette Setup als Bundle
("Arbeite genau wie ich – mein ganzes System"), mit eigenem title/description/priceEur.

DURCHLAUF 4 — AUSGABE
Antworte mit NUR diesem JSON (kein Text davor/danach), exakt dieses Schema:
{
  "securityReport": {
    "redacted": ["kurze Liste, was du global entfernt hast"],
    "warning": "Setiq garantiert keine Datensicherheit – prüfe jeden Inhalt selbst, bevor du veröffentlichst."
  },
  "assets": [
    {
      "title": "...",
      "description": "...",
      "category": "skill",
      "priceEur": 19,
      "tags": ["...", "..."],
      "content": "... gesäuberter Inhalt ...",
      "qualityScore": 4,
      "removedHere": ["was in diesem Asset entfernt wurde"]
    }
  ],
  "allInOne": { "title": "...", "description": "...", "priceEur": 49 }
}

Regeln: Lass Assets mit qualityScore < 2 weg. Erfinde nichts dazu, was nicht im Setup
steht. Wenn etwas unklar ist, wähle die konservative (sicherere) Variante. Nur valides JSON.

HIER IST MEIN SETUP:
<<< füge hier dein Setup ein >>>`;
