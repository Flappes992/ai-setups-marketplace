# Phase 1: Foundation + Mock Feed on iPhone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sicci scrollt auf seinem iPhone via Expo Go durch einen vertikalen Feed aus Mock-Setups und kann per Right-Swipe zur Setup-Detail-Page navigieren. Kein Backend, keine echte Auth, keine Videos — reines UI-Skeleton mit Mock-Daten, das die zentrale Discovery-Experience auf echtem Gerät beweist.

**Architecture:** Monorepo-Struktur mit `app/` (Expo + React Native + TypeScript) als einzigem aktiven Workspace in Phase 1. `web-checkout/` und Backend kommen in späteren Phasen. Tests via Jest + React Native Testing Library. State über React Hooks (kein globaler Store nötig in Phase 1). Navigation via `@react-navigation/native` (Stack + Gesture-Handler).

**Tech Stack:**
- Node.js 20 LTS (Runtime)
- Expo SDK 51+ (managed workflow)
- React Native + TypeScript (strict mode)
- @react-navigation/native + native-stack
- react-native-gesture-handler + react-native-reanimated (für Swipe)
- Jest + @testing-library/react-native
- ESLint + Prettier
- Expo Go App auf iPhone (für Live-Testing)

**Phasen-Übersicht (zur Orientierung — nur Phase 1 wird hier ausgeführt):**

| Phase | Inhalt | Status |
|---|---|---|
| **1 (dieser Plan)** | **Setup, Mock Feed, Detail-Page auf iPhone** | **→ jetzt** |
| 2 | Supabase + Auth (Email/Google) + DB-Schema | später |
| 3 | Setup-Upload + Mux Video-Pipeline + echte Setups im Feed | später |
| 4 | Stripe Connect Onboarding + Web-Checkout (Next.js) + in-App-Browser-Flow + Asset-Delivery | später |
| 5 | Trust-Layer (Report + Rating + Manuelle Review) + Pre-Launch-Polish | später |

---

## File Structure (Phase 1)

```
/Users/Sicci/ai-setups-marketplace/
├── docs/                           # vorhanden
├── app/                            # NEU: Expo App
│   ├── src/
│   │   ├── screens/
│   │   │   ├── FeedScreen.tsx      # Vertikaler TikTok-Style Feed
│   │   │   └── SetupDetailScreen.tsx  # Setup-Detail nach Right-Swipe
│   │   ├── components/
│   │   │   └── SetupCard.tsx       # Einzelne Karte im Feed
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx   # Stack-Navigator mit Gesture
│   │   ├── types/
│   │   │   └── setup.ts            # Setup + Creator TypeScript-Interfaces
│   │   └── mocks/
│   │       └── setups.ts           # 5 Mock-Setups
│   ├── __tests__/
│   │   ├── FeedScreen.test.tsx
│   │   ├── SetupCard.test.tsx
│   │   └── SetupDetailScreen.test.tsx
│   ├── App.tsx                     # Root, wrapped in NavigationContainer
│   ├── app.json                    # Expo Config
│   ├── tsconfig.json
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── jest.config.js
│   └── package.json
├── README.md                       # NEU: Top-Level README
└── .gitignore                      # NEU
```

**Responsibility-Mapping:**
- `screens/` → ganze Screens, eine Datei pro Route
- `components/` → wiederverwendbare UI-Bausteine
- `navigation/` → React-Navigation-Setup, von App.tsx importiert
- `types/` → reine TypeScript-Definitions, kein Code
- `mocks/` → Mock-Daten fürs Development, später durch Supabase-Queries ersetzt
- Tests liegen in `__tests__/` parallel zur Quell-Datei (Standard Jest-Convention)

---

## Task 0: Environment-Check

**Files:** keine

- [ ] **Step 0.1: Node.js-Version prüfen**

Sicci öffnet Terminal und führt aus:

```bash
node --version
```

Expected: `v20.x.x` oder höher. Falls niedriger oder „command not found":

- [ ] **Step 0.2 (nur falls Node fehlt/zu alt): Node 20 LTS installieren**

Sicci installiert via Homebrew (falls vorhanden):

```bash
brew install node@20
brew link --overwrite --force node@20
```

Falls kein Homebrew: lade Installer von https://nodejs.org/de/download (LTS-Version).

Re-check:

```bash
node --version
npm --version
```

Expected: Node v20.x.x, npm v10.x.x.

- [ ] **Step 0.3: Expo CLI testen**

```bash
npx expo --version
```

Expected: `0.x.x` (irgendeine Version, npx lädt aktuell). Falls Fehler kommt: `npm install -g expo-cli` ist NICHT nötig — wir nutzen `npx`.

- [ ] **Step 0.4: Expo Go auf iPhone bestätigen**

Sicci öffnet auf seinem iPhone die App **Expo Go** (App Store: https://apps.apple.com/app/expo-go/id982107779). Login mit beliebigem Expo-Account erstellen (kostenlos, Email + Passwort). Falls Sicci kein Account hat:

1. Auf https://expo.dev/signup registrieren
2. In Expo Go auf iPhone einloggen
3. Bestätigung: leere „Projects"-Tab wird angezeigt

---

## Task 1: Expo-Projekt initialisieren

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/app/` (komplettes Verzeichnis via CLI)
- Create: `/Users/Sicci/ai-setups-marketplace/.gitignore`
- Create: `/Users/Sicci/ai-setups-marketplace/README.md`

- [ ] **Step 1.1: Expo-Projekt mit TypeScript erstellen**

Im Terminal in `/Users/Sicci/ai-setups-marketplace/`:

```bash
cd /Users/Sicci/ai-setups-marketplace
npx create-expo-app@latest app --template blank-typescript
```

CLI fragt evtl. nach Confirmation — mit Enter bestätigen. Dauert 1-3 Min (lädt npm-Packages).

Expected output endet mit:
```
✅ Your project is ready!
...
To run your project, navigate to the directory:
  cd app
```

- [ ] **Step 1.2: In das App-Verzeichnis wechseln und Projekt starten**

```bash
cd app
npx expo start
```

Expected: QR-Code im Terminal, dazu URL `exp://192.168.x.x:8081`.

- [ ] **Step 1.3: Auf iPhone testen**

Sicci öffnet Expo Go auf iPhone → tippt auf das Kamera-Icon (oben rechts) → scannt QR-Code im Terminal.

Expected: Innerhalb 30 Sek lädt App, zeigt: „Open up App.tsx to start working on your app!". Erfolgreich? → weiter.

Falls Fehler: Mac und iPhone müssen im **gleichen WiFi-Netzwerk** sein. Falls Firewall-Issue, in Expo-Terminal `s` drücken → wechselt auf „Tunnel"-Modus (langsamer aber funktioniert immer).

- [ ] **Step 1.4: Expo-Server stoppen**

Im Terminal `Ctrl+C` drücken.

- [ ] **Step 1.5: Top-Level Git-Repo initialisieren**

```bash
cd /Users/Sicci/ai-setups-marketplace
git init
```

- [ ] **Step 1.6: Top-Level .gitignore schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/.gitignore` mit Inhalt:

```
# Dependencies
node_modules/
*/node_modules/

# Build outputs
*/dist/
*/build/
*/.next/
*/.expo/
*/web-build/

# Environment
.env
.env.local
.env.*.local
*/.env
*/.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
*/coverage/

# Expo
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
```

- [ ] **Step 1.7: Top-Level README schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/README.md`:

```markdown
# AI-Setups Marketplace

TikTok-Style Discovery-Plattform für AI-Setups. Käufer entdecken im Feed,
Creator monetarisieren, Plattform verdient Provision.

## Repo-Struktur

- `app/` — Expo / React Native Mobile App
- `web-checkout/` — (Phase 4) Next.js Web-Checkout für Stripe
- `docs/` — Spec, Plans, Architektur-Doku

## Phase 1 Setup

Siehe `docs/superpowers/plans/2026-05-29-phase1-foundation-mock-feed.md`

## Tech Stack

- Expo / React Native + TypeScript
- Supabase (ab Phase 2)
- Stripe Connect (ab Phase 4)
- Mux Video (ab Phase 3)
```

- [ ] **Step 1.8: Erster Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add .gitignore README.md app/
git commit -m "chore: initialize monorepo with Expo app scaffold"
```

Expected: Commit erstellt, `git log` zeigt 1 Commit.

---

## Task 2: TypeScript strict + ESLint + Prettier

**Files:**
- Modify: `/Users/Sicci/ai-setups-marketplace/app/tsconfig.json`
- Create: `/Users/Sicci/ai-setups-marketplace/app/.eslintrc.js`
- Create: `/Users/Sicci/ai-setups-marketplace/app/.prettierrc`
- Create: `/Users/Sicci/ai-setups-marketplace/app/.prettierignore`
- Modify: `/Users/Sicci/ai-setups-marketplace/app/package.json` (scripts hinzufügen)

- [ ] **Step 2.1: TypeScript strict aktivieren**

Modify `/Users/Sicci/ai-setups-marketplace/app/tsconfig.json`. Die Datei sollte nach Init etwa so aussehen:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

Ergänze zu:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 2.2: ESLint + Prettier installieren**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npx expo install eslint eslint-config-expo prettier eslint-plugin-prettier eslint-config-prettier --dev
```

Expected: Packages installiert, `package.json` zeigt sie unter devDependencies.

- [ ] **Step 2.3: ESLint-Config erstellen**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/.eslintrc.js`:

```javascript
module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

- [ ] **Step 2.4: Prettier-Config erstellen**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Erstelle `/Users/Sicci/ai-setups-marketplace/app/.prettierignore`:

```
node_modules
dist
build
.expo
*.log
```

- [ ] **Step 2.5: NPM Scripts hinzufügen**

Modify `/Users/Sicci/ai-setups-marketplace/app/package.json`. Im `"scripts"` Block ergänze:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2.6: Lint und Typecheck testen**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm run lint
npm run typecheck
```

Expected: Beide laufen ohne Fehler durch (es gibt nur App.tsx, da sollten keine Issues sein).

- [ ] **Step 2.7: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "chore: add TypeScript strict mode, ESLint, Prettier"
```

---

## Task 3: Test-Framework (Jest + React Native Testing Library)

**Files:**
- Modify: `/Users/Sicci/ai-setups-marketplace/app/package.json`
- Create: `/Users/Sicci/ai-setups-marketplace/app/jest.config.js`
- Create: `/Users/Sicci/ai-setups-marketplace/app/jest-setup.ts`

- [ ] **Step 3.1: Jest + RNTL installieren**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npx expo install --dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest react-test-renderer
```

- [ ] **Step 3.2: Jest-Config erstellen**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/jest-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**',
  ],
};
```

- [ ] **Step 3.3: Jest-Setup-Datei erstellen**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/jest-setup.ts`:

```typescript
import '@testing-library/jest-native/extend-expect';
```

- [ ] **Step 3.4: Test-Script hinzufügen**

Modify `/Users/Sicci/ai-setups-marketplace/app/package.json`, ergänze im `"scripts"` Block:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

(neben den bestehenden Scripts aus Task 2)

- [ ] **Step 3.5: Smoke-Test schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/__tests__/smoke.test.ts`:

```typescript
describe('Jest Setup', () => {
  it('runs basic tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3.6: Smoke-Test laufen lassen**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm test
```

Expected:
```
PASS  __tests__/smoke.test.ts
  Jest Setup
    ✓ runs basic tests (X ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

- [ ] **Step 3.7: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "chore: add Jest + React Native Testing Library"
```

---

## Task 4: Projekt-Struktur + TypeScript-Types

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/app/src/types/setup.ts`
- Create: `/Users/Sicci/ai-setups-marketplace/app/src/mocks/setups.ts`

- [ ] **Step 4.1: src-Verzeichnis-Struktur anlegen**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
mkdir -p src/screens src/components src/navigation src/types src/mocks
```

- [ ] **Step 4.2: Setup + Creator Types schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/src/types/setup.ts`:

```typescript
export type AssetType = 'clonable' | 'tutorial_bundle';

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
  /** Preis in Cents */
  priceCents: number;
  currency: 'EUR';
  tags: string[];
  ratingAverage: number;
  ratingsCount: number;
  createdAt: string;
}
```

- [ ] **Step 4.3: Mock-Daten schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/src/mocks/setups.ts`:

```typescript
import { Setup } from '@/types/setup';

const creatorA: Setup['creator'] = {
  id: 'c1',
  username: 'lukas_ai',
  displayName: 'Lukas',
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  bio: 'ChatGPT-Setups für Solopreneure. 3 Jahre Prompt-Engineering.',
  ratingAverage: 4.8,
  setupsCount: 14,
};

const creatorB: Setup['creator'] = {
  id: 'c2',
  username: 'maya_workflows',
  displayName: 'Maya',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  bio: 'Automationen mit n8n und Claude. Spare 10h/Woche.',
  ratingAverage: 4.6,
  setupsCount: 8,
};

const creatorC: Setup['creator'] = {
  id: 'c3',
  username: 'finn_codes',
  displayName: 'Finn',
  avatarUrl: 'https://i.pravatar.cc/150?img=33',
  bio: 'Custom GPTs für Studenten und Lerner.',
  ratingAverage: 4.9,
  setupsCount: 22,
};

export const mockSetups: Setup[] = [
  {
    id: 's1',
    creator: creatorA,
    title: 'Cold-Email Automation mit Claude',
    description:
      'Komplettes Setup für personalisierte Cold-Outreach. Custom GPT + n8n-Workflow + Notion-CRM. 50 Mails/Tag automatisiert.',
    videoUrl: 'https://placeholder-video.com/v1.mp4',
    videoThumbnail: 'https://picsum.photos/seed/s1/800/1200',
    assetType: 'clonable',
    priceCents: 2900,
    currency: 'EUR',
    tags: ['n8n', 'claude', 'sales', 'automation'],
    ratingAverage: 4.7,
    ratingsCount: 28,
    createdAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 's2',
    creator: creatorB,
    title: 'Daily-Standup-Bot für Discord',
    description:
      'Async Standup automatisiert. Discord-Bot fragt täglich um 9 Uhr nach, sammelt Antworten in Notion, schickt Summary an PM.',
    videoUrl: 'https://placeholder-video.com/v2.mp4',
    videoThumbnail: 'https://picsum.photos/seed/s2/800/1200',
    assetType: 'tutorial_bundle',
    priceCents: 1500,
    currency: 'EUR',
    tags: ['discord', 'notion', 'team', 'productivity'],
    ratingAverage: 4.4,
    ratingsCount: 12,
    createdAt: '2026-05-18T14:30:00Z',
  },
  {
    id: 's3',
    creator: creatorC,
    title: 'Uni-Notizen Custom GPT',
    description:
      'GPT der Vorlesungs-Audios transkribiert, Karteikarten erstellt und Lernpläne generiert. Mit System-Prompt-Pack.',
    videoUrl: 'https://placeholder-video.com/v3.mp4',
    videoThumbnail: 'https://picsum.photos/seed/s3/800/1200',
    assetType: 'clonable',
    priceCents: 990,
    currency: 'EUR',
    tags: ['chatgpt', 'lernen', 'studium'],
    ratingAverage: 4.9,
    ratingsCount: 67,
    createdAt: '2026-05-22T09:15:00Z',
  },
  {
    id: 's4',
    creator: creatorA,
    title: 'Content-Engine für LinkedIn',
    description:
      'Multi-Step-Workflow der aus 1 Idee 5 LinkedIn-Posts macht, mit personalisierter Voice. Inkl. Notion-Template + Claude-Prompts.',
    videoUrl: 'https://placeholder-video.com/v4.mp4',
    videoThumbnail: 'https://picsum.photos/seed/s4/800/1200',
    assetType: 'tutorial_bundle',
    priceCents: 3900,
    currency: 'EUR',
    tags: ['content', 'linkedin', 'claude', 'notion'],
    ratingAverage: 4.5,
    ratingsCount: 19,
    createdAt: '2026-05-15T08:00:00Z',
  },
  {
    id: 's5',
    creator: creatorB,
    title: 'Receipt-Scanner für Steuerberater',
    description:
      'Fotografieren → GPT-4o-Vision extrahiert → Buchungssatz vorschlagen → DATEV-Export. Sparte mir 4h/Woche.',
    videoUrl: 'https://placeholder-video.com/v5.mp4',
    videoThumbnail: 'https://picsum.photos/seed/s5/800/1200',
    assetType: 'clonable',
    priceCents: 4900,
    currency: 'EUR',
    tags: ['vision', 'gpt-4', 'finance', 'datev'],
    ratingAverage: 4.8,
    ratingsCount: 9,
    createdAt: '2026-05-19T16:45:00Z',
  },
];
```

- [ ] **Step 4.4: Lint + Typecheck**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm run lint
npm run typecheck
```

Expected: ohne Fehler.

- [ ] **Step 4.5: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "feat: add Setup + Creator types and mock data"
```

---

## Task 5: SetupCard-Komponente (TDD)

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/app/src/components/SetupCard.tsx`
- Create: `/Users/Sicci/ai-setups-marketplace/app/__tests__/SetupCard.test.tsx`

- [ ] **Step 5.1: Failing Test schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/__tests__/SetupCard.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';

describe('SetupCard', () => {
  it('renders setup title', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders creator display name', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('Lukas')).toBeTruthy();
  });

  it('renders formatted price', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('29,00 €')).toBeTruthy();
  });
});
```

- [ ] **Step 5.2: Test laufen lassen, sollte fehlschlagen**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm test -- SetupCard
```

Expected: `FAIL` mit Fehler „Cannot find module '@/components/SetupCard'".

- [ ] **Step 5.3: SetupCard implementieren**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/src/components/SetupCard.tsx`:

```typescript
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Setup } from '@/types/setup';

const { width, height } = Dimensions.get('window');

interface SetupCardProps {
  setup: Setup;
}

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function SetupCard({ setup }: SetupCardProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: setup.videoThumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.creatorRow}>
          <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
          <Text style={styles.creatorName}>{setup.creator.displayName}</Text>
        </View>
        <Text style={styles.title}>{setup.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {setup.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPriceEur(setup.priceCents)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: '#000',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#444',
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    backgroundColor: '#fff',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    fontWeight: '700',
    fontSize: 14,
    overflow: 'hidden',
  },
});
```

- [ ] **Step 5.4: Tests sollten jetzt grün sein**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm test -- SetupCard
```

Expected: `PASS` mit allen 3 Tests grün.

- [ ] **Step 5.5: Lint + Typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: keine Fehler.

- [ ] **Step 5.6: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "feat: add SetupCard component with title/creator/price"
```

---

## Task 6: FeedScreen mit vertikalem Snap-Scrolling (TDD)

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/app/src/screens/FeedScreen.tsx`
- Create: `/Users/Sicci/ai-setups-marketplace/app/__tests__/FeedScreen.test.tsx`

- [ ] **Step 6.1: Failing Test schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/__tests__/FeedScreen.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FeedScreen } from '@/screens/FeedScreen';

describe('FeedScreen', () => {
  it('renders at least one setup from mock data', () => {
    render(<FeedScreen />);
    // Erstes Mock-Setup ist "Cold-Email Automation mit Claude"
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders multiple setups', () => {
    render(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
    expect(screen.getByText('Daily-Standup-Bot für Discord')).toBeTruthy();
  });
});
```

- [ ] **Step 6.2: Test laufen lassen, sollte fehlschlagen**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm test -- FeedScreen
```

Expected: `FAIL` mit „Cannot find module".

- [ ] **Step 6.3: FeedScreen implementieren**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/src/screens/FeedScreen.tsx`:

```typescript
import React from 'react';
import { View, FlatList, Dimensions, StatusBar } from 'react-native';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';
import { Setup } from '@/types/setup';

const { height } = Dimensions.get('window');

export function FeedScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <FlatList<Setup>
        data={mockSetups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SetupCard setup={item} />}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
```

- [ ] **Step 6.4: Tests sollten jetzt grün sein**

```bash
npm test -- FeedScreen
```

Expected: PASS für beide Tests.

- [ ] **Step 6.5: Lint + Typecheck**

```bash
npm run lint
npm run typecheck
```

- [ ] **Step 6.6: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "feat: add FeedScreen with vertical snap-scrolling"
```

---

## Task 7: SetupDetailScreen (TDD)

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/app/src/screens/SetupDetailScreen.tsx`
- Create: `/Users/Sicci/ai-setups-marketplace/app/__tests__/SetupDetailScreen.test.tsx`

- [ ] **Step 7.1: Failing Test schreiben**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/__tests__/SetupDetailScreen.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SetupDetailScreen } from '@/screens/SetupDetailScreen';
import { mockSetups } from '@/mocks/setups';

describe('SetupDetailScreen', () => {
  const setup = mockSetups[0];

  it('renders setup full description', () => {
    render(<SetupDetailScreen setup={setup} />);
    expect(screen.getByText(setup.description)).toBeTruthy();
  });

  it('renders price button text', () => {
    render(<SetupDetailScreen setup={setup} />);
    expect(screen.getByText(/29,00 €/)).toBeTruthy();
  });

  it('renders creator bio', () => {
    render(<SetupDetailScreen setup={setup} />);
    expect(screen.getByText(setup.creator.bio)).toBeTruthy();
  });

  it('renders tags', () => {
    render(<SetupDetailScreen setup={setup} />);
    setup.tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 7.2: Test laufen lassen, sollte fehlschlagen**

```bash
npm test -- SetupDetailScreen
```

Expected: FAIL.

- [ ] **Step 7.3: SetupDetailScreen implementieren**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/src/screens/SetupDetailScreen.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Setup } from '@/types/setup';

interface SetupDetailScreenProps {
  setup: Setup;
}

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function SetupDetailScreen({ setup }: SetupDetailScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: setup.videoThumbnail }} style={styles.hero} resizeMode="cover" />

        <View style={styles.body}>
          <Text style={styles.title}>{setup.title}</Text>

          <View style={styles.creatorRow}>
            <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.creatorName}>{setup.creator.displayName}</Text>
              <Text style={styles.creatorMeta}>
                ★ {setup.creator.ratingAverage.toFixed(1)} · {setup.creator.setupsCount} Setups
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Über das Setup</Text>
          <Text style={styles.description}>{setup.description}</Text>

          <Text style={styles.sectionTitle}>Über {setup.creator.displayName}</Text>
          <Text style={styles.description}>{setup.creator.bio}</Text>

          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {setup.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Asset-Typ</Text>
          <Text style={styles.description}>
            {setup.assetType === 'clonable'
              ? 'Klonbares Template — sofort verfügbar nach Kauf'
              : 'PDF + Video-Tutorial Bundle'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.purchaseBar}>
        <TouchableOpacity style={styles.purchaseButton} activeOpacity={0.85}>
          <Text style={styles.purchaseButtonText}>
            Setup holen · {formatPriceEur(setup.priceCents)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    width: '100%',
    height: 300,
    backgroundColor: '#222',
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  creatorMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 13,
    color: '#444',
  },
  purchaseBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  purchaseButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

- [ ] **Step 7.4: Tests sollten jetzt grün sein**

```bash
npm test -- SetupDetailScreen
```

Expected: PASS für alle 4 Tests.

- [ ] **Step 7.5: Lint + Typecheck**

```bash
npm run lint
npm run typecheck
```

- [ ] **Step 7.6: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "feat: add SetupDetailScreen with creator + tags + purchase button"
```

---

## Task 8: Navigation Setup (Stack mit Right-Swipe-Gesture)

**Files:**
- Create: `/Users/Sicci/ai-setups-marketplace/app/src/navigation/RootNavigator.tsx`
- Modify: `/Users/Sicci/ai-setups-marketplace/app/App.tsx`
- Modify: `/Users/Sicci/ai-setups-marketplace/app/src/screens/FeedScreen.tsx`
- Modify: `/Users/Sicci/ai-setups-marketplace/app/src/screens/SetupDetailScreen.tsx`

- [ ] **Step 8.1: Navigation-Pakete installieren**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
```

- [ ] **Step 8.2: RootNavigator definieren**

Erstelle `/Users/Sicci/ai-setups-marketplace/app/src/navigation/RootNavigator.tsx`:

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '@/screens/FeedScreen';
import { SetupDetailScreen } from '@/screens/SetupDetailScreen';
import { Setup } from '@/types/setup';

export type RootStackParamList = {
  Feed: undefined;
  SetupDetail: { setup: Setup };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="SetupDetail" component={SetupDetailScreenWrapper} />
    </Stack.Navigator>
  );
}

// Wrapper damit Detail-Screen seine setup-prop aus route.params bekommt
function SetupDetailScreenWrapper({
  route,
}: {
  route: { params: { setup: Setup } };
}) {
  return <SetupDetailScreen setup={route.params.setup} />;
}
```

- [ ] **Step 8.3: App.tsx aktualisieren**

Modify `/Users/Sicci/ai-setups-marketplace/app/App.tsx`. Ersetze den kompletten Inhalt mit:

```typescript
import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 8.4: FeedScreen so anpassen, dass Tap auf Card navigiert**

Modify `/Users/Sicci/ai-setups-marketplace/app/src/screens/FeedScreen.tsx`. Ersetze kompletten Inhalt:

```typescript
import React from 'react';
import { View, FlatList, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';
import { Setup } from '@/types/setup';
import { RootStackParamList } from '@/navigation/RootNavigator';

const { height } = Dimensions.get('window');

type FeedNav = NativeStackNavigationProp<RootStackParamList, 'Feed'>;

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <FlatList<Setup>
        data={mockSetups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SetupDetail', { setup: item })}
            accessibilityRole="button"
            accessibilityLabel={`Setup öffnen: ${item.title}`}
          >
            <SetupCard setup={item} />
          </TouchableOpacity>
        )}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
```

> **Hinweis:** Sicci hat in der Spec spezifisch „Right-Swipe → Detail Page" beschrieben. Native-Stack's Default-Gestik ist Edge-Swipe-Left zum Zurück, was nach Detail-Page-Öffnung greift. Für „From Feed: Swipe-Right öffnet Detail" nutzen wir Tap als V1 — Custom-Gesture im Feed (Swipe-Right öffnet Detail) wird in Phase 2 nachgezogen, weil das mit FlatList + Reanimated nicht-trivial ist und V1-Tap-Navigation reicht für die Discovery-Story.

- [ ] **Step 8.5: Tests anpassen — FeedScreen braucht NavigationContainer**

Modify `/Users/Sicci/ai-setups-marketplace/app/__tests__/FeedScreen.test.tsx`. Ersetze kompletten Inhalt:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { FeedScreen } from '@/screens/FeedScreen';

function renderWithNav(component: React.ReactElement) {
  return render(<NavigationContainer>{component}</NavigationContainer>);
}

describe('FeedScreen', () => {
  it('renders at least one setup from mock data', () => {
    renderWithNav(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders multiple setups', () => {
    renderWithNav(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
    expect(screen.getByText('Daily-Standup-Bot für Discord')).toBeTruthy();
  });
});
```

- [ ] **Step 8.6: Alle Tests laufen lassen**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npm test
```

Expected: alle Tests (smoke, SetupCard, FeedScreen, SetupDetailScreen) PASS.

- [ ] **Step 8.7: Lint + Typecheck**

```bash
npm run lint
npm run typecheck
```

- [ ] **Step 8.8: Commit**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/
git commit -m "feat: add React Navigation stack with Feed → SetupDetail flow"
```

---

## Task 9: End-to-End auf iPhone testen

**Files:** keine Änderungen

- [ ] **Step 9.1: Expo-Dev-Server starten**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npx expo start --clear
```

`--clear` löscht den Metro-Cache. Wichtig nach Architektur-Änderungen wie neuen Navigations-Paketen.

Expected: QR-Code erscheint im Terminal.

- [ ] **Step 9.2: QR-Code auf iPhone scannen via Expo Go**

App lädt auf iPhone. Erwartet:
- Schwarzer Bildschirm
- Erstes Mock-Setup („Cold-Email Automation mit Claude") sichtbar mit Thumbnail-Bild
- Creator-Name „Lukas" + Preis „29,00 €" auf der Karte

- [ ] **Step 9.3: Vertikales Snap-Scrolling testen**

Auf iPhone hoch-/runter-swipen. Erwartet:
- Snap zu jeder Karte (TikTok-Verhalten)
- 5 Setups durchscrollbar
- Smooth, kein Ruckler

Falls Ruckler: Performance ist mit `placeholder-video` (kein echtes Video) eigentlich kein Issue. Falls doch: Reanimated-Setup checken (`babel.config.js` muss `react-native-reanimated/plugin` enthalten — siehe Task 8.4 Note unten).

- [ ] **Step 9.4: Tap auf Karte → Detail-Page**

Auf eine Karte tippen. Erwartet:
- Slide-Animation von rechts nach links
- Detail-Page erscheint: Hero-Bild oben, Title, Creator-Bio, Tags, Purchase-Button („Setup holen · 29,00 €")

- [ ] **Step 9.5: Back-Gesture testen**

Vom linken Rand nach rechts swipen (Standard-iOS-Back-Gesture). Erwartet:
- Detail-Page wischt nach rechts weg
- Zurück im Feed an gleicher Position

- [ ] **Step 9.6: Manuelles Smoke-Test-Protokoll abhaken**

Sicci geht durch und bestätigt:
- [ ] Alle 5 Mock-Setups sichtbar im Feed
- [ ] Scroll-Snap funktioniert sauber
- [ ] Tap auf jedes Setup öffnet korrekte Detail-Page
- [ ] Detail-Page zeigt korrekte Daten (Title, Description, Creator, Tags, Preis)
- [ ] Back-Gesture funktioniert
- [ ] StatusBar ist hell (weiß) auf schwarzem Feed-Background

- [ ] **Step 9.7: Reanimated-Babel-Plugin verifizieren**

Modify `/Users/Sicci/ai-setups-marketplace/app/babel.config.js` falls noch nicht vorhanden. Datei sollte am Ende so aussehen:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

`react-native-reanimated/plugin` MUSS das letzte Plugin in der Liste sein.

Wenn Änderung nötig war:

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npx expo start --clear
```

und nochmal auf iPhone testen.

- [ ] **Step 9.8: Final Commit + Phase-1 Done**

```bash
cd /Users/Sicci/ai-setups-marketplace
git add app/babel.config.js
git commit -m "chore: ensure reanimated babel plugin is configured" --allow-empty
git log --oneline
```

Expected: `git log` zeigt mind. 9 Commits aus Phase 1.

---

## Phase-1 Abschluss-Check

- [ ] App läuft auf Sicci's iPhone via Expo Go
- [ ] 5 Mock-Setups sind im vertikalen Feed scrollbar
- [ ] Tap auf eine Karte führt zur Detail-Page
- [ ] Detail-Page zeigt vollständige Setup-Info + Purchase-Button (noch ohne Action)
- [ ] Alle Tests grün (smoke + SetupCard + FeedScreen + SetupDetailScreen)
- [ ] `npm run lint` und `npm run typecheck` ohne Fehler
- [ ] Git-History sauber, ~8-10 Commits

**Was funktioniert noch NICHT (bewusst, kommt in späteren Phasen):**
- Kein Login, kein Account
- Keine echten Videos (nur Thumbnail-Bilder)
- Kein Setup-Upload-Flow
- Kein Stripe / kein Kauf
- Kein Backend (alles Mock-Data)
- Native iOS-Build nicht erstellt (Expo Go reicht)

---

## Nach Phase 1 — Was als Nächstes

Sobald Phase 1 läuft, brauchen wir einen **Phase-2-Plan** mit folgendem Scope:

- Supabase-Setup (Projekt, DB-Schema gemäß Spec Section 4)
- Auth-Flow (Email + Google OAuth)
- Echte Daten statt Mock-Daten im Feed
- Profile-Screen für eingeloggte User
- Logout-Flow

Den Phase-2-Plan schreibe ich erst, wenn Phase 1 abgeschlossen und auf deinem iPhone bestätigt ist. Vorher würden Annahmen unklar sein.
