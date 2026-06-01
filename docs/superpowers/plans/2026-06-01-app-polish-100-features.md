# Setiq App Polish — 100 Features & Effekte

**Goal:** Setiq fühlt sich nach diesem Plan premium, lebendig und unmistakably Setiq an — ohne eine einzige Supabase-Änderung.

**Constraint:** Frontend-only. Keine neuen Tabellen, Columns, RLS-Policies, Storage-Buckets, Webhooks. Alles arbeitet mit existierenden Daten (`profiles`, `setups`, `purchases`, `likes`, `saves`, `comments`) oder lokalem State (AsyncStorage, in-memory).

**Tech:** Expo SDK 54, React Native 0.81, Reanimated 4, expo-haptics, expo-video, expo-linking. Alles schon installiert.

**Prio-Legende:**
- 🟢 **P0** — sofort spürbarer Wow- oder Brand-Effekt, wenig Code
- 🟡 **P1** — solide UX-Verbesserung, mittel Code
- 🔵 **P2** — Detail-Polish, optional

**Execution-Reihenfolge:** Track A → J. Brand-Foundation zuerst (A), damit alle nachfolgenden Effekte konsistent in Setiq-Teal landen. Innerhalb jedes Tracks: P0 → P1 → P2.

**Verifikation:** Nach jedem Track kurzer Smoke-Test mit Expo Go auf iPhone. Commit pro Track-Abschluss.

---

## Track A — Brand & Theme Sync (Foundation)

> Aktueller Accent ist `#facc15` (gelb). Setiq-Brand ist Teal. Vor allem anderen fixen — sonst polieren wir die falsche Farbe.

- A1 🟢 Theme-Accent `#facc15` → Setiq-Teal `#2DD4BF` in beiden Paletten · `ThemeProvider.tsx`
- A2 🟢 Sekundär-Accent Teal-Hell `#5EEAD4` + Teal-Dunkel `#14B8A6` in Palette aufnehmen · `ThemeProvider.tsx`
- A3 🟢 LinearGradient-Komponente `<TealGradient>` für Buttons/CTAs · neues `components/TealGradient.tsx`
- A4 🟢 Active-Tab-Indicator in TabBar auf Teal · `CustomTabBar.tsx`
- A5 🟢 Like-Heart bleibt pink/rot, Save-Bookmark → Teal · `SetupCard.tsx`
- A6 🟢 Primary-Button "Kaufen / Sign-Up" → Teal-Gradient statt Solid · global
- A7 🟡 Status-Bar dynamisch je Screen (Feed dark, Settings hell) · `expo-status-bar`
- A8 🟡 Selection-Highlight in TextInputs Teal · global
- A9 🟡 Pull-to-Refresh-Spinner-Color Teal · alle Screens mit RefreshControl
- A10 🔵 Loading-Spinner mit Teal-Gradient (custom statt nativer) · neues `components/Spinner.tsx`

---

## Track B — Feed Lebendigkeit (Wow-Surface)

> Der Feed ist die wichtigste Surface. Hier muss es sich nach TikTok-Mit-Mehrwert anfühlen.

- B1 🟢 Doppel-Tap-Heart größer + spring-bounce (Reanimated) · `FeedScreen.tsx` / `SetupCard.tsx`
- B2 🟢 Slide-In + Fade-In für jede Card beim ersten Render (stagger) · `FeedScreen.tsx`
- B3 🟢 Snap-Scrolling: jede Card snapt mittig (FlatList `snapToInterval`) · `FeedScreen.tsx`
- B4 🟢 Like-Counter increment animation (number tick up beim Like) · `SetupCard.tsx`
- B5 🟢 Floating "Scroll-to-Top" Button nach 5+ Cards · `FeedScreen.tsx`
- B6 🟡 Custom Pull-to-Refresh mit Setiq-S-Logo-Spinner · `FeedScreen.tsx`
- B7 🟡 Tag-Pills horizontal scrollable über Feed-Top als Quick-Filter · `FeedScreen.tsx`
- B8 🟡 "For You" / "Following" / "Trending" Tabs mit animated underline (Reanimated) · `FeedScreen.tsx`
- B9 🟡 Video-Progress-Bar unten am Card (für Auto-Play-Videos) · `SetupCard.tsx`
- B10 🟡 Mute-Indicator (kleines Speaker-Icon top-right) togglebar · `SetupCard.tsx`
- B11 🟡 Long-Press auf Card → Auto-Play pause + scale-down · `SetupCard.tsx`
- B12 🟡 Pinch-to-Zoom auf Cover-Image · `SetupCard.tsx`
- B13 🔵 Empty-Feed-State mit Setiq-Icon + "Be the first creator" CTA · `FeedScreen.tsx`
- B14 🔵 Swipe-up Geste auf Card → SetupDetail (zusätzlich zum Tap) · `SetupCard.tsx`
- B15 🔵 Subtile Background-Animation (radial gradient pulse hinter Card) · `FeedScreen.tsx`

---

## Track C — SetupCard Polish

- C1 🟢 Creator-Avatar mit Teal-Border-Ring · `SetupCard.tsx`
- C2 🟢 Price-Badge mit Glass-Morph-Effekt (semi-transparent blur) · `SetupCard.tsx`
- C3 🟢 "Bought"-Badge wenn `useMyPurchases` enthält die ID (Häkchen + Teal) · `SetupCard.tsx`
- C4 🟢 "New"-Badge wenn `created_at < 24h` · `SetupCard.tsx`
- C5 🟢 Setup-Type-Icon (GPT/Workflow/Prompt) prominenter · `SetupCard.tsx`
- C6 🟡 Press-Down Scale auf 0.97 für tactile feedback · `SetupCard.tsx`
- C7 🟡 Tag-Pills monochrome border statt full-bg (cleaner) · `SetupCard.tsx`
- C8 🟡 Comment-Count Icon mit number (klickbar → öffnet Comments) · `SetupCard.tsx`
- C9 🔵 Long-Press lift-shadow effect (Reanimated `elevation` anim) · `SetupCard.tsx`
- C10 🔵 View-Count anzeigen (lokal getrackt via AsyncStorage) · `SetupCard.tsx`

---

## Track D — SetupDetailScreen Tiefe

- D1 🟢 Sticky Buy-Button (immer sichtbar beim scroll) · `SetupDetailScreen.tsx`
- D2 🟢 Stats-Row: Likes · Saves · Comments · Buys aus existierenden Queries · `SetupDetailScreen.tsx`
- D3 🟢 Tag-Click → TagFeedScreen direkt · `SetupDetailScreen.tsx`
- D4 🟢 "Author"-Section mit Bio + "Other Setups" Carousel (re-use `useSetups` mit creator filter) · `SetupDetailScreen.tsx`
- D5 🟡 Hero-Image Parallax-Scroll (Reanimated `useAnimatedScrollHandler`) · `SetupDetailScreen.tsx`
- D6 🟡 "Wie nutzen" expandable section (collapsible block aus description) · `SetupDetailScreen.tsx`
- D7 🟡 "Ähnliche Setups" am Ende (lokal nach gemeinsamen Tags filtern) · `SetupDetailScreen.tsx`
- D8 🟡 Share-Sheet mit Custom-Preview-Text (`expo-sharing`) · `SetupDetailScreen.tsx`
- D9 🟡 Setup-Description Markdown-Support (`react-native-markdown-display`, leicht installierbar) · `SetupDetailScreen.tsx`
- D10 🔵 "Report"-Button mit Reasons-Sheet (lokal Toast, später echte Action) · `SetupDetailScreen.tsx`
- D11 🔵 Swipe-from-left-edge → back (iOS-Style, schon nativ aber explizit verbessern) · navigation config
- D12 🔵 Top-Comment immer als Preview im Detail-Screen · `SetupDetailScreen.tsx`

---

## Track E — Profile & Identity

- E1 🟢 Stats-Bar: Setups · Likes Received · Total Sales (existierende Queries kombiniert) · `ProfileScreen.tsx`
- E2 🟢 Avatar-Glow-Ring: silber wenn 10+ Sales, gold wenn 100+ (lokal berechnet) · `ProfileScreen.tsx`
- E3 🟢 "Joined since" date · `ProfileScreen.tsx`
- E4 🟡 Bio mit `#hashtag`-Parsing → Tag-Click öffnet TagFeed · `ProfileScreen.tsx`
- E5 🟡 "Best Setup" Highlight am Profile-Top (most-liked) · `ProfileScreen.tsx`
- E6 🟡 Edit-Profile smooth slide-in animation · `EditProfileScreen.tsx`
- E7 🔵 Profile-Share als QR-Code (lokal mit `react-native-qrcode-svg`) · `ProfileScreen.tsx`
- E8 🔵 "Coming Soon" Verified-Badge Slot (Placeholder für Phase 5) · `ProfileScreen.tsx`
- E9 🔵 Profile-Card Flip-Animation auf Tap (front: stats, back: bio) · `ProfileScreen.tsx`
- E10 🔵 Achievement-Bar ("Du bist Discoverer / Trader / Creator" — lokal berechnet) · `ProfileScreen.tsx`

---

## Track F — Search & Discovery

- F1 🟢 Recent-Searches (AsyncStorage, last 10) · `SearchScreen.tsx`
- F2 🟢 Trending-Tags Carousel (Top 8 aus existierenden Setups computed) · `SearchScreen.tsx`
- F3 🟢 "Discover by Category" Grid (Custom-GPT / Prompt / Workflow / Tutorial Cards) · `SearchScreen.tsx`
- F4 🟡 Search-Suggestions als-du-tippst (lokal aus existierender Setups-Liste) · `SearchScreen.tsx`
- F5 🟡 Search-Filter-Sheet: Setup-Type, Price-Range, Sort (Newest/Top/Cheapest) · `SearchScreen.tsx`
- F6 🟡 "No Results" Empty State mit 3 Tag-Vorschlägen · `SearchScreen.tsx`
- F7 🟡 Recently-Viewed History (AsyncStorage, max 20) · neuer Hook `useRecentlyViewed`
- F8 🔵 Voice-Search-Button (Placeholder-UI, später echte Mic-Integration) · `SearchScreen.tsx`
- F9 🔵 Save-Search "Alert me when…" (lokal Liste, später Push) · `SearchScreen.tsx`
- F10 🔵 Top-Creator-Carousel (computed aus existierenden Setups+Sales) · `SearchScreen.tsx`

---

## Track G — Comments Verfeinerung

> Threading/Replies: prüfen ob `comments.parent_id` existiert — falls ja, ohne DB-Touch nutzbar. Falls nicht, alle Comments flat lassen, fakes hier streichen.

- G1 🟢 Comment-Sort-Toggle: Newest / Top (lokal sortiert nach Like-Counts) · `CommentsSection.tsx`
- G2 🟢 Comment-Length-Counter (max ~280 char) · `CommentsSection.tsx`
- G3 🟡 Mention-Autocomplete: `@user` während Tippen (lokal aus geladenen Profiles) · `CommentsSection.tsx`
- G4 🟡 Emoji-Picker für Comments (kleiner native Picker) · `CommentsSection.tsx`
- G5 🟡 Comment-Replies UI wenn `parent_id` in Schema existiert · `CommentsSection.tsx`
- G6 🔵 Comment-Markdown light (bold/italic/code via regex parse) · `CommentsSection.tsx`
- G7 🔵 Comment "Copy" via Long-Press · `CommentsSection.tsx`
- G8 🔵 Animated Comment Send → fly-in von unten · `CommentsSection.tsx`

---

## Track H — Onboarding & Empty States

- H1 🟢 First-Run Welcome-Sheet 3-Slides (AsyncStorage `setiq.onboarded`) · neuer `WelcomeSheet.tsx`
- H2 🟢 Empty-Saved mit "Discover Setups" CTA + 3 Trending-Suggestions · `SavedSetupsScreen.tsx`
- H3 🟢 Empty-Liked mit Heart-Illustration + CTA · `LikedSetupsScreen.tsx`
- H4 🟢 Empty-Purchases mit "Browse Marketplace" CTA · `MyPurchasesScreen.tsx`
- H5 🟢 Empty-MySetups mit Hero "Add your first Setup" + Plus-Button · `MySetupsScreen.tsx`
- H6 🟡 Feed-Tutorial-Overlay nur beim allerersten Feed-Open (Swipe ↑↓ Hand) · `FeedScreen.tsx`
- H7 🟡 Empty-Notifications mit Bell-Off-Illustration · `NotificationsScreen.tsx`
- H8 🟡 Empty-Comments "Be the first" mit Pulse-Animation am Input · `CommentsSection.tsx`
- H9 🔵 "Welcome back" Toast wenn last-seen > 24h (AsyncStorage timestamp) · App.tsx
- H10 🔵 Lokales Achievement-System: "Setiq Explorer" (10 Setups gesehen), "Discoverer" (5 likes), "Trader" (1 buy) — alles AsyncStorage · neuer Hook `useAchievements`

---

## Track I — Upload UX

- I1 🟢 Multi-Step-Wizard: Cover → Title/Desc → Tags → Preis (Progress-Indicator 1/4) · `SetupUploadScreen.tsx`
- I2 🟢 Tags-Suggester aus Top-Tags (computed local) · `SetupUploadScreen.tsx`
- I3 🟢 Auto-Save Draft in AsyncStorage (`setiq.upload.draft`) · `SetupUploadScreen.tsx`
- I4 🟡 Live-Preview-Card während Upload (was Käufer sehen) · `SetupUploadScreen.tsx`
- I5 🟡 Cover-Image-Cropping (`expo-image-picker` allowsEditing) · `SetupUploadScreen.tsx`
- I6 🟡 Video-Length-Warning bei > 60s · `SetupUploadScreen.tsx`
- I7 🟡 Upload-Progress in Top-Bar während Bytes hochladen · `SetupUploadScreen.tsx`
- I8 🔵 Success-Animation: Confetti-Particles via Reanimated · `SetupUploadScreen.tsx`

---

## Track J — Polish & Performance

- J1 🟢 Optimistic-UI für Like/Save (UI sofort, DB im Hintergrund + rollback bei Error) · `useToggleLike.ts`, `useToggleSave.ts`
- J2 🟢 Skeleton-Loaders auf allen Listen (haben `SetupCardSkeleton`, in MySetups/Saved/Liked/Purchases einsetzen) · diverse Screens
- J3 🟢 AsyncStorage-Cache für Feed-Setups (last 20, instant-render beim re-open) · neuer Hook `useCachedFeed`
- J4 🟢 Empty-Number-Badge auf NotificationsTab wenn ungelesen > 0 · `CustomTabBar.tsx`
- J5 🟡 Image-Prefetch beim Feed-Scroll (next 2 Cards via `Image.prefetch`) · `FeedScreen.tsx`
- J6 🟡 Network-Lost Toast + Offline-Indicator-Banner · App.tsx + `@react-native-community/netinfo`
- J7 🟡 Custom-Alert-Modal in Setiq-Style statt nativem `Alert.alert` · neuer `AlertModal.tsx`
- J8 🔵 Smooth Tab-Switch (cross-fade vs hard-cut) · `RootNavigator.tsx`
- J9 🔵 Spring-Animation für Modal-Slides (Settings, Edit-Profile) · navigation config
- J10 🔵 Performance-Audit: `React.memo` wo es lohnt (SetupCard, Avatar, Tag-Pill) · diverse

---

## Track-Zusammenfassung & Schätzungen

| Track | Items | Davon P0 | Zeit-Schätzung |
|---|---:|---:|---|
| A — Brand-Sync | 10 | 6 | ~30 min |
| B — Feed | 15 | 5 | ~2-3 h |
| C — Card | 10 | 5 | ~1.5 h |
| D — Detail | 12 | 4 | ~2-3 h |
| E — Profile | 10 | 3 | ~1.5 h |
| F — Search | 10 | 3 | ~1.5 h |
| G — Comments | 8 | 2 | ~1 h |
| H — Empty States | 10 | 5 | ~1.5 h |
| I — Upload | 8 | 3 | ~1.5 h |
| J — Polish | 10 | 4 | ~1.5 h |
| **Total** | **103** | **40** | **~14-16 h** |

**Phasen-Vorschlag:**
- **Phase 1 (P0-Sweep, ~6-7h):** alle 🟢 abarbeiten — 40 Items, danach wirkt App komplett anders
- **Phase 2 (P1-Sweep, ~5-6h):** die 🟡 — solide UX-Layer
- **Phase 3 (P2-Sweep, ~2-3h):** Detail-Polish

Sicci entscheidet nach Phase 1, ob 2+3 dazukommen oder ob wir auf Trust/Compliance (Phase 5) schwenken.

## Was bewusst draußen ist (braucht Supabase)

- Follow/Following-Layer (neue `follows` Tabelle)
- Reviews (neue `reviews` Tabelle)
- Push Notifications (FCM/APNs Setup)
- Real Verified Badges (neue `verified` Column)
- Cover-Photo am Profile (neuer Column oder Bucket)
- Echte Report-Funktion (neue `reports` Tabelle)
- Real Achievements (DB-tracked statt nur lokal)

Alles davon ist auf Sicci's Phase-5-Liste und kommt wenn er wieder ans Supabase-Dashboard kann.

## Verifikations-Protokoll pro Track

1. Track-Items implementieren in einer Sitzung
2. `npm run typecheck` + `npm run lint` — muss grün sein
3. Expo Go starten + Smoke-Test auf iPhone (5-10 min Klick-Test)
4. Commit mit `feat(polish): Track X — <kurz beschreiben>`
5. Status-Update an Sicci, ggf. Screenshots

**Stop-Punkte:** Nach jedem Track kurzes "Track X done, weiter?" an Sicci. Falls Bug/Regression entdeckt: stoppen, root cause fixen, dann weiter.
