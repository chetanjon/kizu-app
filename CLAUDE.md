# CLAUDE.md — Instructions for Claude Code working on kizu

You are helping build **kizu**, a private **group taste space** for small friend groups (5–20 people). This file is your live context. It supersedes the old witness-app instructions (archived in `CLAUDE-old.md`). `KIZU-DESIGN-DOC.md` describes an EARLIER product direction — treat it as historical, not current. `AGENTS.md` has Next.js framework rules worth reading.

---

## What kizu is, in one paragraph

kizu is a web-first app where a small group of friends drop the **movies, music, and places (outside)** they love into one blended space, rate them their own way, react, and queue what they want to act on. An AI **"vibe read"** reads the group's collective taste back as a shareable card. The product has pivoted twice (accountability → witness → taste space); **taste space is the keeper.** It is LIVE at **https://kizu.app**.

---

## The strategic spine (this drives every decision)

- **Core outcome = trusted discovery:** "I never run out of great things to watch / listen to / go do, from people I trust — and I can decide *tonight*." The **queue is the product**; the **vibe read is the hook**; romance/relationships are a deferred, opt-in byproduct, never the headline.
- **North-star metric:** *recs that landed per active group per week.* A "landed" rec = someone queued a thing another person dropped/sent and marked it loved/liked. Every feature must move this number or it gets cut.
- **#1 structural risk = low frequency.** Taste discovery isn't daily. We fight this with: Kizu Curate (manufactures a daily reason to open), a low bar for what's drop-worthy (a craving, a lyric, a rewatch), and the queue ("what do I do tonight?" = a recurring real need).

---

## Tech stack — locked

- **Framework:** Next.js 16 + TypeScript (App Router)
- **Styling:** Tailwind CSS v4 (tokens in `src/app/globals.css`)
- **DB / Auth / Realtime:** Supabase (project `undcbbwiytfzquriwwqx`)
- **AI (vibe read + Curate automation):** **Google Gemini 2.5 Flash** — free tier, the budget is $0. The provider is swappable in `src/lib/vibe.ts` (upgrade to Claude if budget ever appears). `src/lib/claude.ts` exists but is not the default path.
- **Hosting:** Vercel (Hobby, free; auto-deploys from `main`). Domain `kizu.app` via Squarespace DNS.

**Budget = $0.** Do not introduce anything that requires payment without flagging it first. Don't suggest switching frameworks/ORMs/backends without a very strong reason.

---

## Auth + write pattern (learned the hard way)

Route-handler writes with the user-scoped Supabase client hit `new row violates RLS` (`auth.uid()` is null on writes in route handlers). **Pattern used everywhere:** authorize with `getUser()` + a membership check, then write via `createAdminClient()` (service role), setting `created_by`/`user_id` from the verified user. Follow this for every new write route.

**Embed gotcha:** `items` ↔ `users` is an ambiguous embed (`created_by` AND via `reactions`) → `PGRST201` and silent 0 rows. Always disambiguate with the FK hint, e.g. `users!items_created_by_fkey(name)`.

---

## Code style preferences

- **Clean components, low abstraction.** Prefer readable code over 5 layers of indirection. Don't preemptively factor things out.
- **Server components first; client components only when needed.** App Router patterns.
- **Supabase types:** `src/lib/database.types.ts`. Regenerate (or hand-update to match) after every schema change.
- **No CSS-in-JS, no styled-components, no MUI, no shadcn-by-default.** Tailwind utilities inline; a `.module.css` next to a component only if genuinely needed.
- **No state-management library** (no Zustand/Redux/Jotai). React state + URL state + Supabase realtime are enough unless I ask.
- **Small files.** A 200-line component is fine; an 800-line one should be split.
- **No premature optimization.** No memoization/virtualization/caching without a measured problem.
- **Ask before adding npm dependencies** — quick justification first.

---

## Brand DNA — visual constraints (source of truth: `src/app/globals.css`)

Locked direction: **neo-brutalism × pop color × framed aurora**, edited down (not loud-for-loud's-sake).

- **Surfaces:** paper `#EDE3CE` (warm cream, never stark white), surface `#FFFFFF`, surface-2 `#F7EFDD`. Ink `#14110F`.
- **Borders:** ~2.5–3px solid ink. **Shadows:** hard offset, **no blur** (e.g. `5px 5px 0 #14110F`).
- **RED `#FF2E4D` is PRECIOUS — it is reserved ONLY for the period/dot in the `kizu.` wordmark.** Never buttons, links, focus rings, or fills.
- **Signature accent = violet/grape `#6B4BD6`** (token `--color-vibe`): primary buttons, headline highlights, the vibe surfaces. The **vibe read = an animated aurora gradient framed in a black border** — the one show-stopper; don't dilute it by reusing it everywhere.
- **Type colors (small functional tags only):** movies/watch = cobalt `#2F6FE0`, music/listen = rose `#E0567E`, outside/go = teal `#1B8A6B`. Extended accent set (indigo/clay/mustard/chartreuse/amber…) for cards/marquee.
- **Fonts:** Archivo (`font-h`: headlines/numbers/titles/logo), Plus Jakarta Sans (`font-b`: body), Space Mono (`font-m`: labels/ratings/tags). Set in `layout.tsx`.
- Luxurious whitespace; **anti-doomscroll** — the feed should help you *decide*, not scroll forever. "You're all caught up" is a feature, not a dead end.

Use the token names (`bg-paper`, `text-ink`, `bg-vibe`, `border-ink`, `font-h/b/m`, etc.), not raw hexes, in components.

---

## Voice — for any UI copy

Direct, a little knowing, never cheerful SaaS. kizu speaks sparingly — **one on-brand line only on earned moments** (first drop in the group, a rec that landed, the weekly read), then it's quiet. Cryptic and short, especially in notifications — trigger curiosity, don't spoil it.

- ✅ "good taste runs in the group." (the tagline)
- ✅ "someone left this for you."
- ✅ "it landed."
- ✅ "you're all caught up."
- ❌ "Welcome back! 🎉 Let's check in!"  ❌ exclamation-mark hype  ❌ generic emoji spam
If copy sounds like a typical SaaS app, it's wrong.

---

## What kizu is NOT — LOAD-BEARING exclusions

Push back before implementing any of these:

- ❌ Algorithmic "For You" ranking / engagement-maximizing feed. Discovery is **trust-based**, from your people + Curate — not a black-box algorithm.
- ❌ Infinite scroll. The feed is **bounded** (small group = finite content). Honor the empty space.
- ❌ Public-by-default content. kizu is **private group** first. (Rec-as-invite no-wall links are the one controlled exception — a single shared item, not a public profile.)
- ❌ Personal streaks / dark-pattern retention. Group rituals and earned status are OK; streaks are not.
- ❌ Individual scores/ratings *of friends*. We rate taste, not people.
- ❌ **Fake friend activity.** Seeding is done HONESTLY via Kizu Curate (a clearly-labeled house persona), never by faking humans inside a trust circle.
- ❌ Romance/dating as the headline. Taste-match % ships **platonic**; "kizu match" (opt-in, consenting, separate surface) is a deferred future layer with its own safety design.
- ❌ Monetization of any kind (legal constraint — F-1 visa).
- ❌ Push notifications by default. In-app, cryptic, earned-event notifications only to start; PWA push is a deliberate later decision, not an assumption. **(Override, 2026-06-27: PWA push is now live, and we deliberately push — cryptic, push-only, no in-app row — on EVERY drop to the rest of the group, not just earned events. These auto-clear from the tray once the user opens kizu. Owner-approved exception to the "earned-event only" rule.)**

If I ask for one of these, say so and ask me to confirm before building.

---

## Current phase — "Trusted Discovery" full build

We approved building the full strategic spine, **sequenced to ship in testable increments** (not one big-bang). Modules, roughly in build order:

1. **Queue + "landed"** (the core discovery loop) + **filter chips** (all · movies · music · outside)
2. **Kizu Curate** — hand-curated first (Wizard-of-Oz admin entry) to tune the voice; automate later
3. **Rec-as-invite** (drop *for* a specific person; no-wall `/r/<token>` for non-members) + **"recs that landed"** status
4. **Notifications** — in-app, cryptic, earned-event only
5. **Weekly ritual** — scheduled (cron) weekly group vibe read = the appointment mechanic
6. **Taste DNA profile** — the investment artifact that visibly grows
7. **Taste-match %** — platonic; the seed for a future opt-in "kizu match"
8. **Curate automation** — once the voice is dialed in

The current creative open question is **how the feed itself should look** — explicitly NOT a generic scroll/masonry feed. Resolve that before building module 1's feed surface.

---

## How I want you to work with me

1. **Plan before you code.** Give a plan (files, schema, routes) first; wait for "okay, do it."
2. **Small commits, frequent verification.** Summarize each meaningful diff.
3. **Push back on bad ideas** that contradict the spine or the locked-out list. I'd rather argue 5 minutes than ship the wrong thing.
4. **No over-engineering.** Build for ~50 friends, not 1M users.
5. **Ask before installing dependencies.**
6. **When stuck on UI, ask for a screenshot.**

---

## File locations

- This file: `CLAUDE.md` · archived witness instructions: `CLAUDE-old.md`
- Historical (earlier product): `KIZU-DESIGN-DOC.md`
- Design tokens (source of truth): `src/app/globals.css`
- Lib: `src/lib/` — `tmdb.ts`, `odesli.ts`, `itunes.ts`, `resolve.ts` (smart-paste URL→type), `vibe.ts` (vibe engine, Gemini default), `supabase-{server,browser,admin}.ts`, `database.types.ts`
- Migrations: `supabase/migrations/`
- Strategic design doc for this phase: `docs/superpowers/specs/` (to be written)

---

*kizu has no deadline. build slowly. build well. honor the empty space.*
