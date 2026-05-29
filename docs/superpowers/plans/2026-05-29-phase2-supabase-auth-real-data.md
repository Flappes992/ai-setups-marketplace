# Phase 2: Supabase + Auth + Real Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sicci kann sich auf seinem iPhone via Email registrieren und einloggen. Der Feed zeigt echte Setup-Daten aus Supabase (nicht mehr Mock). Eine Profile-Page mit Logout existiert. Session bleibt nach App-Restart bestehen.

**Architecture:** Supabase als Backend-as-a-Service (Postgres + Auth + Storage + Realtime). React Native nutzt `@supabase/supabase-js` mit `expo-secure-store` für Session-Persistenz. Auth-State wird via React Context propagiert. Feed-Daten via simple `useState` + `useEffect` (kein React Query in V1 — kommt erst wenn Caching weh tut).

**Tech Stack:**
- `@supabase/supabase-js` (Client)
- `expo-secure-store` (Session-Persistenz)
- `react-native-url-polyfill` (URL polyfill für RN)
- Supabase SQL Editor (für DB-Migrationen)
- Existing: Expo SDK 54, React Native, TypeScript, Jest

**Scope-Exclusions (kommt in Phase 2.5 / 3 / V1.5):**
- Google OAuth (Phase 2.5)
- Password Reset (Phase 2.5)
- Email Verification Enforcement (Phase 2.5)
- Setup Upload Flow (Phase 3)
- Video Pipeline (Phase 3)
- Stripe (Phase 4)

---

## File Structure (Phase 2 additions)

```
app/
├── src/
│   ├── services/
│   │   └── supabase.ts             # NEW: Supabase client init
│   ├── auth/                       # NEW
│   │   ├── AuthContext.tsx         # Session state via React Context
│   │   └── useAuth.ts              # Hook
│   ├── screens/
│   │   ├── SignUpScreen.tsx        # NEW
│   │   ├── SignInScreen.tsx        # NEW
│   │   └── ProfileScreen.tsx       # NEW
│   ├── hooks/                      # NEW
│   │   └── useSetups.ts            # Fetch + state mgmt für Setups
│   ├── navigation/
│   │   └── RootNavigator.tsx       # MODIFY: Auth-Stack vs Main-Stack
│   └── types/
│       ├── database.ts             # NEW: Supabase-generated types
│       └── setup.ts                # MODIFY: align with DB schema
├── .env.local                       # NEW: SUPABASE_URL + SUPABASE_ANON_KEY
├── .env.example                     # NEW: Template
└── app.json                        # MODIFY: expo.extra for env vars
```

---

## Task 0: Supabase-Project (Sicci macht in der Web-UI)

**Files:** keine im Repo — externes Setup.

- [ ] **Step 0.1: Account + Project anlegen** — siehe Anweisung im Chat
- [ ] **Step 0.2: Project URL + anon-key im Chat teilen**
- [ ] **Step 0.3: Region = Frankfurt (eu-central-1) bestätigt**
- [ ] **Step 0.4: DB-Password im Password-Manager gespeichert**

---

## Task 1: Supabase Client Setup

**Files:**
- Create: `app/.env.example`
- Create: `app/.env.local` (gitignored, holds real keys)
- Create: `app/src/services/supabase.ts`
- Modify: `app/app.json` (expo.extra config)
- Install: `@supabase/supabase-js`, `expo-secure-store`, `react-native-url-polyfill`

- [ ] **Step 1.1: Packages installieren**

```bash
cd /Users/Sicci/ai-setups-marketplace/app
npx expo install @supabase/supabase-js expo-secure-store react-native-url-polyfill
```

- [ ] **Step 1.2: .env.example schreiben**

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 1.3: .env.local mit echten Werten anlegen** (gitignored)

Werte aus Task 0 reinpacken.

- [ ] **Step 1.4: app.json um expo.extra erweitern**

```json
"expo": {
  ...
  "extra": {
    "supabaseUrl": "${SUPABASE_URL}",
    "supabaseAnonKey": "${SUPABASE_ANON_KEY}"
  }
}
```

- [ ] **Step 1.5: Supabase-Client erstellen**

`app/src/services/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL und Anon-Key müssen in app.json gesetzt sein');
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 1.6: typecheck + lint**
- [ ] **Step 1.7: Commit:** `feat: integrate Supabase client with secure-store session persistence`

---

## Task 2: DB-Schema via SQL-Migration

**Files:** keine im Repo (SQL läuft in Supabase Web-UI)

- [ ] **Step 2.1: profiles-Tabelle anlegen**

In Supabase SQL Editor:

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  rating_average numeric(2,1) default 0.0,
  setups_count integer default 0,
  created_at timestamptz default now()
);
```

- [ ] **Step 2.2: setups-Tabelle anlegen**

```sql
create type asset_type as enum ('clonable', 'tutorial_bundle');
create type setup_status as enum ('draft', 'review', 'live', 'removed');

create table public.setups (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  video_url text,
  video_thumbnail text not null,
  asset_type asset_type not null,
  asset_url text,
  price_cents integer not null check (price_cents >= 500),
  currency text not null default 'EUR',
  tags text[] default '{}',
  rating_average numeric(2,1) default 0.0,
  ratings_count integer default 0,
  status setup_status default 'draft',
  created_at timestamptz default now()
);

create index idx_setups_status_created on public.setups (status, created_at desc) where status = 'live';
```

- [ ] **Step 2.3: likes + saves anlegen**

```sql
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  setup_id uuid references public.setups(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, setup_id)
);

create table public.saves (
  user_id uuid references public.profiles(id) on delete cascade,
  setup_id uuid references public.setups(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, setup_id)
);
```

- [ ] **Step 2.4: Auto-Profile-Trigger bei Auth-Signup**

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substring(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2.5: Verify in Supabase UI** — alle 4 Tabellen sichtbar unter „Table Editor"

---

## Task 3: Row-Level-Security Policies

**Files:** keine im Repo (SQL in Supabase)

- [ ] **Step 3.1: RLS für alle Tabellen aktivieren**

```sql
alter table public.profiles enable row level security;
alter table public.setups enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
```

- [ ] **Step 3.2: profiles-Policies**

```sql
create policy "Profiles: alle können lesen"
  on public.profiles for select using (true);

create policy "Profiles: eigenes profil bearbeiten"
  on public.profiles for update using (auth.uid() = id);
```

- [ ] **Step 3.3: setups-Policies**

```sql
create policy "Setups: alle können live-setups lesen"
  on public.setups for select using (status = 'live' or creator_id = auth.uid());

create policy "Setups: nur eigene erstellen"
  on public.setups for insert with check (creator_id = auth.uid());

create policy "Setups: nur eigene bearbeiten"
  on public.setups for update using (creator_id = auth.uid());
```

- [ ] **Step 3.4: likes + saves policies**

```sql
create policy "Likes: eigene lesen + alle counts"
  on public.likes for select using (true);

create policy "Likes: eigene anlegen + löschen"
  on public.likes for insert with check (user_id = auth.uid());

create policy "Likes: eigene löschen"
  on public.likes for delete using (user_id = auth.uid());

create policy "Saves: nur eigene lesen"
  on public.saves for select using (user_id = auth.uid());

create policy "Saves: eigene anlegen"
  on public.saves for insert with check (user_id = auth.uid());

create policy "Saves: eigene löschen"
  on public.saves for delete using (user_id = auth.uid());
```

---

## Task 4: TypeScript-Types von Supabase generieren

**Files:**
- Create: `app/src/types/database.ts`
- Modify: `app/src/types/setup.ts`

- [ ] **Step 4.1: Database-Types schreiben (manuell, basierend auf Schema)**

```typescript
export type AssetType = 'clonable' | 'tutorial_bundle';
export type SetupStatus = 'draft' | 'review' | 'live' | 'removed';

export interface DbProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  rating_average: number;
  setups_count: number;
  created_at: string;
}

export interface DbSetup {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  video_url: string | null;
  video_thumbnail: string;
  asset_type: AssetType;
  asset_url: string | null;
  price_cents: number;
  currency: string;
  tags: string[];
  rating_average: number;
  ratings_count: number;
  status: SetupStatus;
  created_at: string;
}
```

- [ ] **Step 4.2: setup.ts auf DB-Schema mappen + Mock-fähig halten**

Setup-Interface bleibt was UI braucht (mit `Creator` nested), aber Mapping-Function für `DbSetup → Setup` schreiben.

- [ ] **Step 4.3: typecheck + Commit**

---

## Task 5: SignUpScreen (TDD)

**Files:**
- Create: `app/src/screens/SignUpScreen.tsx`
- Create: `app/__tests__/SignUpScreen.test.tsx`

- [ ] **Step 5.1: Failing Test**

Form-Validation, Submit-Handler-Aufruf, Error-Display, Success-Navigation.

- [ ] **Step 5.2: Implementation**

UI: Email + Password + ConfirmPassword + Username + DisplayName + Submit-Button.
Validation: Email-Format, Password ≥ 8 Zeichen, Match, Username 3-20 Zeichen.
Submit:
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { username, display_name: displayName } },
});
```

- [ ] **Step 5.3: Tests grün, Commit**

---

## Task 6: SignInScreen (TDD)

**Files:**
- Create: `app/src/screens/SignInScreen.tsx`
- Create: `app/__tests__/SignInScreen.test.tsx`

- [ ] **Step 6.1: Failing Test**
- [ ] **Step 6.2: Implementation**

```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

- [ ] **Step 6.3: Tests grün, Commit**

---

## Task 7: Auth Context + Session Persistence

**Files:**
- Create: `app/src/auth/AuthContext.tsx`
- Create: `app/src/auth/useAuth.ts`
- Modify: `app/App.tsx`

- [ ] **Step 7.1: AuthProvider mit Session-Listener**

```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => setSession(session)
  );
  return () => subscription.unsubscribe();
}, []);
```

- [ ] **Step 7.2: useAuth Hook + AuthProvider in App.tsx wrappen**
- [ ] **Step 7.3: Commit**

---

## Task 8: Protected Routes

**Files:**
- Modify: `app/src/navigation/RootNavigator.tsx`

- [ ] **Step 8.1: Conditional Stack-Switching**

```typescript
const { session, loading } = useAuth();
if (loading) return <SplashScreen />;
return session ? <MainStack /> : <AuthStack />;
```

- [ ] **Step 8.2: AuthStack (SignIn + SignUp)** und **MainStack (Feed + Detail + Profile)**
- [ ] **Step 8.3: Tests anpassen für Auth-Wrapper, Commit**

---

## Task 9: ProfileScreen + Logout

**Files:**
- Create: `app/src/screens/ProfileScreen.tsx`
- Create: `app/__tests__/ProfileScreen.test.tsx`

- [ ] **Step 9.1: Profile-Daten via Supabase Query laden** (`profiles` Tabelle)
- [ ] **Step 9.2: Logout-Button** → `supabase.auth.signOut()`
- [ ] **Step 9.3: Tests + Commit**

---

## Task 10: Setup-Seed-Daten in Supabase

**Files:** SQL in Supabase Web-UI

- [ ] **Step 10.1: Sicci legt 1 Test-Profile an (durch Sign-Up in der App)**
- [ ] **Step 10.2: SQL INSERTs für 5 Test-Setups** (ich gebe SQL mit der echten profile-ID)
- [ ] **Step 10.3: Status = 'live' setzen**

---

## Task 11: FeedScreen mit echten Daten

**Files:**
- Create: `app/src/hooks/useSetups.ts`
- Modify: `app/src/screens/FeedScreen.tsx`
- Modify: `app/__tests__/FeedScreen.test.tsx`

- [ ] **Step 11.1: useSetups Hook**

```typescript
export function useSetups() {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSetups() {
      const { data, error } = await supabase
        .from('setups')
        .select('*, creator:profiles(*)')
        .eq('status', 'live')
        .order('created_at', { ascending: false });
      if (error) setError(error);
      else setSetups((data ?? []).map(mapDbToSetup));
      setLoading(false);
    }
    fetchSetups();
  }, []);

  return { setups, loading, error };
}
```

- [ ] **Step 11.2: FeedScreen umstellen** auf `useSetups`, mit Loading + Empty + Error States
- [ ] **Step 11.3: Tests mit Mock von supabase-client**
- [ ] **Step 11.4: Commit**

---

## Task 12: End-to-End auf iPhone

**Files:** keine

- [ ] **Step 12.1: Expo dev server starten**
- [ ] **Step 12.2: Auf iPhone via Expo Go laden**
- [ ] **Step 12.3: Sign-Up durchklicken** (Email + Username)
- [ ] **Step 12.4: Feed zeigt 5 Setups (Seed-Daten)**
- [ ] **Step 12.5: Setup öffnen, Detail-Page sehen**
- [ ] **Step 12.6: Profile öffnen, Daten korrekt**
- [ ] **Step 12.7: Logout, zurück zu SignIn**
- [ ] **Step 12.8: Re-Login funktioniert**
- [ ] **Step 12.9: App schließen + neu öffnen → Session bleibt**

---

## Phase-2 Abschluss-Check

- [ ] Sign-Up + Sign-In funktioniert auf iPhone
- [ ] Session bleibt nach App-Restart bestehen
- [ ] Feed zeigt echte Daten aus Supabase
- [ ] Profile-Page + Logout funktioniert
- [ ] RLS verhindert Cross-User-Datenzugriff
- [ ] Alle Tests grün, lint + typecheck sauber

**Was funktioniert noch NICHT (in späteren Phasen):**
- Setup-Upload (Phase 3)
- Echte Videos (Phase 3 via Mux)
- Käufe / Stripe (Phase 4)
- Google OAuth (Phase 2.5)
- Password-Reset (Phase 2.5)

---

## Nach Phase 2 — Was als Nächstes

**Phase 3:** Setup-Upload-Flow für Creator + Mux/Cloudflare Stream Video-Pipeline. Plan-Doc folgt sobald Phase 2 läuft.
