# Phase 3: Setup-Upload + Asset-Handling — Implementation Plan

**Goal:** Sicci (oder jeder eingeloggte User) kann auf seinem iPhone ein eigenes Setup hochladen — Video aus Gallery, Title, Description, Tags, Preis, Asset (PDF/Video-Bundle oder externer Link). Setup geht direkt live im Feed.

**Architecture:** Videos + Assets gehen direkt zu **Supabase Storage** (kein Mux für V1). Eigene Buckets für `setup-videos` und `setup-assets`. Storage-RLS sichert Owner-only-Schreibrechte. Setup-Upload-Screen via Floating Action Button im Feed erreichbar.

**Tech Stack additions:**
- `expo-image-picker` (Video aus Gallery)
- `expo-document-picker` (PDF Upload)
- `expo-file-system` (für Upload)
- Supabase Storage API

**Scope-Exclusions:**
- Video-Encoding / Compression (V1 nimmt was Picker liefert, max ~30 MB)
- In-App Recording (V1.5)
- Manual Review Workflow (status='live' direkt für V1)
- Käufer-Flow für Assets (Phase 4 mit Stripe)
- Setup-Edit / -Delete (V1.5)

---

## Task 0: Storage Buckets in Supabase (Sicci)

Im Supabase Dashboard → **Storage** (Datenbank-Icon mit Cloud):

1. **„New bucket"** → Name: `setup-videos`, **Public: AN** (für direkte Video-URLs) → Create
2. **„New bucket"** → Name: `setup-assets`, **Public: AN** → Create

Beide auf Public weil wir später Käufer-only-Logic über signed URLs machen — für V1 reicht Public.

Im **SQL Editor** dann RLS-Policy für Storage:

```sql
-- Nur eingeloggte User dürfen hochladen
create policy "Authenticated users can upload setup-videos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'setup-videos');

create policy "Authenticated users can upload setup-assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'setup-assets');

-- Public read
create policy "Public read on setup-videos"
  on storage.objects for select using (bucket_id = 'setup-videos');

create policy "Public read on setup-assets"
  on storage.objects for select using (bucket_id = 'setup-assets');

-- Owner kann eigene löschen
create policy "Owners can delete own setup-videos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'setup-videos' and owner = auth.uid());

create policy "Owners can delete own setup-assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'setup-assets' and owner = auth.uid());
```

Sicci confirmt Buckets + RLS.

---

## Task 1: Setup-Upload Screen + Navigation

**Files:**
- Create: `app/src/screens/SetupUploadScreen.tsx`
- Modify: `app/src/navigation/RootNavigator.tsx` (add Route)
- Modify: `app/src/screens/FeedScreen.tsx` (FAB → SetupUpload)

UI-Skeleton: Form mit Title-Input, Description-Textarea, Tags (comma-separated), Asset-Type-Switch (clonable vs tutorial_bundle), Preis-Input (€), submit-button (initial disabled). Video-Picker und Asset-Picker kommen in Task 2-3.

FAB: kleiner "+" Button im FeedScreen unten rechts → `navigation.navigate('SetupUpload')`.

---

## Task 2: Video Picker + Preview

**Install:** `npx expo install expo-image-picker`

**Permissions:** Pop-up beim ersten Tap auf "Video wählen" → expo-image-picker fragt automatisch.

**Code-Sketch:**
```typescript
import * as ImagePicker from 'expo-image-picker';

async function pickVideo() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    videoMaxDuration: 60,
    quality: 0.7,
  });
  if (!result.canceled) {
    setVideoUri(result.assets[0].uri);
  }
}
```

Preview: kleines `<Video>` component aus `expo-av` zeigt das gepickte Video.

**Install:** `npx expo install expo-av`

---

## Task 3: Video Upload zu Supabase Storage

Beim Submit:
1. Generate unique filename: `${userId}/${uuid}.mp4`
2. `FileSystem.uploadAsync` → Supabase Storage
3. Get public URL
4. Saved als `video_url` in setup
5. Generate Thumbnail: für V1 nutze einfach random picsum (V1.5 wird echtes Thumbnail aus Video extrahiert via `expo-video-thumbnails`)

**Install:** `npx expo install expo-file-system`

---

## Task 4: Asset-Pipeline (clonable URL OR tutorial_bundle PDF+Video)

**Switch zwischen Asset-Types:**

- **clonable:** TextInput für URL (Validation: muss `https://` starten)
- **tutorial_bundle:** Zwei Picker — PDF (via `expo-document-picker`) + optional weiteres Video für Tutorial

**Install:** `npx expo install expo-document-picker`

Upload-Logic gleich wie bei Video (Storage Bucket = `setup-assets`).

---

## Task 5: Save Mutation + Navigate

Submit-Handler:
1. Validation: alle Pflichtfelder gefüllt, Preis ≥ 500 cents
2. Upload Video → get URL
3. Upload Asset (PDF/Video) → get URL ODER use clonable URL
4. Insert in `setups` mit `status='live'`
5. Toast "Setup ist live!"
6. `navigation.popToTop()` → zurück zum Feed
7. Feed re-fetched → neues Setup ist da

---

## Task 6: My-Setups Screen

**Files:**
- Create: `app/src/screens/MySetupsScreen.tsx`
- Modify: `RootNavigator` + `ProfileScreen` (Button "Meine Setups")

Liste eigener Setups (alle Status, nicht nur live). Tap → SetupDetail. Long-press → Optionen (V1.5: edit/delete).

---

## Task 7: Setup-Detail mit echtem Video-Player

**Modify:** `SetupDetailScreen` — wenn `setup.videoUrl` da ist, ersetzt das den Hero-Thumbnail mit `<Video>`-Player aus expo-av. Auto-Play disabled (User tippt Play).

---

## Task 8: E2E iPhone Test

1. Sign-In
2. Feed → "+" FAB
3. Setup-Upload-Screen
4. Video aus Gallery wählen
5. Form ausfüllen (Title, Description, Tags, Preis 29€, AssetType clonable, URL `https://chat.openai.com/g/test`)
6. Submit
7. Toast "Setup ist live"
8. Zurück im Feed → eigenes Setup sichtbar
9. Tap drauf → Detail-Page mit echtem Video-Player
10. Profile → "Meine Setups" → eigenes Setup gelistet

---

## Phase 3 Abschluss-Check

- [ ] Video-Upload funktioniert (Gallery → Storage → URL)
- [ ] Asset-Upload funktioniert (PDF/Video → Storage URL ODER External Link)
- [ ] Setup wird gespeichert + erscheint im Feed
- [ ] My-Setups zeigt eigene Setups
- [ ] Setup-Detail zeigt echtes Video
- [ ] Storage-RLS verhindert Cross-User-Upload-Spam

**Was bewusst NICHT in Phase 3:**
- Käufer-Flow (Phase 4 mit Stripe)
- Setup-Edit / -Delete (V1.5)
- Thumbnail-Extraction aus Video (V1.5)
- Video-Compression (V1.5)
- Review-Workflow (kommt mit Multi-Creator-Onboarding)

---

## Nach Phase 3 — Was als Nächstes

**Phase 4:** Stripe Connect Onboarding + Web-Checkout + Käufer-Flow + Asset-Delivery nach Kauf.
