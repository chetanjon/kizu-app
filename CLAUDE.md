# CLAUDE.md — Instructions for Claude Code working on kizu

You are helping me build **kizu**, a private social layer for friend groups (5-20 people). This file is your context. The full design vision lives in `KIZU-DESIGN-DOC.md` — read it before making any architectural decisions. Also read `AGENTS.md` for Next.js 15-specific rules — Next.js 15 has breaking changes that older training data may not cover.
---

#

# What kizu is, in one paragraph

kizu is a web-first PWA where small groups of friends ("packs") witness each other daily through what they're looking at. The core philosophy is "witness what i'm witnessing" — the camera points outward, never at the user. Photos are back-camera-only, no filters, no edits, no retakes. Posts accumulate into a year-end "wall" — a kintsugi-styled artifact. There is also a "city" view that shows all kizu pods as ambient lights, and an introduction mechanic that lets pack members introduce friends across packs. Brand: neo-brutalist, dark, deliberate, anti-doomscroll.

---

## Tech stack — locked

- **Framework:** Next.js 15 + TypeScript
- **Styling:** Tailwind CSS v4
- **Database / Auth / Realtime:** Supabase
- **Email:** Resend
- **AI:** Claude API (sonnet by default; haiku for cheap tasks)
- **Hosting:** Vercel
- **Domain:** kizu.app

Do NOT suggest switching frameworks, ORMs, or backends without an extremely strong reason.

---

## Code style preferences

- **Clean components, low abstraction.** I prefer reading code, not threading my way through 5 layers of abstraction. Don't preemptively factor things out.
- **Server components first, client components only when needed.** Use Next.js App Router patterns.
- **Supabase types should be generated, not hand-written.** Run `supabase gen types typescript` and import from there.
- **No CSS-in-JS, no styled-components, no MUI, no shadcn-by-default.** Tailwind utility classes inline. If a component genuinely needs custom CSS, put it in a `.module.css` next to the component.
- **No state management library.** React state, URL state, and Supabase realtime are sufficient. Do not introduce Zustand, Redux, Jotai, etc. unless I explicitly ask.
- **Prefer small files.** A 200-line component is fine. A 800-line component should probably be split.
- **No premature optimization.** Don't add memoization, virtualization, or caching unless there's a measured problem.

---

## Brand DNA — these are visual constraints

- Background: warm cream `#F2F0E6` (NOT stark white)
- Borders: `2.5px solid #1A1A1A`
- Shadows: `5px 5px 0 #1A1A1A` (hard offset, NO blur)
- Hover: cards lift like physical buttons (translate)
- Typography: Archivo (headlines/numbers), Plus Jakarta Sans (body), Space Mono (data/labels) — all Google Fonts
- Accents: flat saturated colors per feature (yellow, lime, pink, blue, orange, purple, red, green)
- Black cards `#1A1A1A` for emphasis on critical elements
- Whitespace is luxurious — components have room to breathe
- Transitions are 600-800ms (deliberate, NOT snappy)

---

## Voice — for any UI copy you write

Direct, slightly unsettling, never cheerful. Reads like a friend who knows you too well.

- ✅ "sunset's coming."
- ✅ "[friend] saw you."
- ✅ "the moment passed. it always does."
- ✅ "nothing yet. that's not nothing."
- ❌ "Welcome back! 🎉 Let's check in!"
- ❌ "Reminder: don't forget to post today!"
- ❌ Any exclamation marks. Any emoji. Any hype words.

If you generate copy that sounds like a typical SaaS app, you have failed.

---

## Comments — constrained, not free-form

Comments exist on kizu, but only inside hard rails. This is a deliberate override of the original design doc's blanket exclusion of comments — the override only holds if these constraints hold:

- **One comment per user per post.** Enforced in the database (`UNIQUE (post_id, author_id)`). Editable, deletable, but never duplicable.
- **200-char hard cap.** Enforced in the DB (`CHECK`) and the API.
- **No line breaks.** Stripped client-side and again server-side.
- **No threading.** No replies-to-comments. No quote-comments. No @mentions. The pack is small enough that none of these are needed.
- **No likes on comments. No reactions to comments.** No second-order engagement metrics anywhere.
- **No edit history rendered.** A comment shows its current state. `updated_at` is internal, never user-facing.
- **Pack-visible only.** No public comments. No DM-by-stealth.
- **No notifications outside the (eventual) sunset email digest.** No "X commented on your post" pings.

If a future feature request would relax any of these, treat it as a load-bearing change and push back: comments work because of the constraints, not despite them.

---

## What kizu is NOT — these are LOAD-BEARING exclusions

If I ask you to add any of the following, push back hard before implementing:

- ❌ Personal streaks (collective pack streaks are OK)
- ❌ Algorithm / "For You" / recommendations
- ❌ Infinite scroll
- ❌ Public-by-default content (opt-in only, with unanimous pack vote)
- ❌ Location features (no maps, no nearby, ever)
- ❌ Front camera / selfies / filters / photo edits / retakes
- ❌ Individual ratings or scores of friends
- ❌ Dares as a core mechanic (truth-or-dare apps own that category)
- ❌ Accountability framing (no bets, no forfeits, no W-L records)
- ❌ Push notifications (sunset email only)
- ❌ Marketing emails (the sunset email is the ONLY scheduled email)
- ❌ Direct messages between users
- ❌ Native app (web-first PWA only for v1 and v2)
- ❌ Monetization of any kind (legal constraint — F-1 visa)

If I ask you to add one of these, respond with: "This is in the locked-out list in KIZU-DESIGN-DOC.md Section 13. Are you sure you want to revisit this decision?" and wait for confirmation before implementing.

---

## Phased build — current phase: v1

We are building **v1 — the foundation**. Scope:

- Auth + onboarding (Supabase magic links)
- Pack creation: name, colors, icon, founding date, 5-20 size cap
- Multi-pod membership with home pod designation
- Daily mechanic: sunset email via Resend, back-camera capture, post to pack
- Receipt mechanic: paste-in screenshot, Claude API auto-blur, post to pack
- Pack feed (the wall) — basic version, no kintsugi animation yet
- 8 emoji reactions, no comments, no DMs
- Settings: timezone, sunset email frequency

**v1 is done when:** a real pack of 5-20 people can sign up, create a pack, post daily moments and receipts, and react to each other's posts. That's it. No city, no themes, no introduction mechanic — those are v2.

If I drift into v2 features during a v1 session, remind me. Stay focused on v1.

---

## How I want you to work with me

1. **Plan before you code.** When I describe a feature, give me a plan first — files to change, new files to create, schema changes needed, API routes. Don't write code until I say "okay, do it."
2. **Small commits, frequent verification.** After each meaningful change, summarize the diff so I can review.
3. **Push back on bad ideas.** If I suggest something that contradicts the design doc, say so. I would rather argue with you for 5 minutes than ship the wrong thing.
4. **No over-engineering.** v1 is a hobby project. Don't build for 1M users. Build for 50 friends.
5. **Ask before installing dependencies.** New npm packages should require a quick justification.
6. **When stuck, ask for screenshots.** UI debugging is 10x faster with a screenshot than a description.

---

## Existing code context

The repo already contains the previous version of kizu (the accountability app). Some files carry forward, most don't. Specifically:

**Carries forward:**
- Supabase auth setup
- Resend integration boilerplate
- Claude API client
- The neo-brutalist design system (colors, fonts, component patterns)
- `kizu-landing-brutal.html` and `kizu-brutal.jsx` — reference files for the design language

**Needs to be deleted or rewritten:**
- All bet/dare/forfeit logic
- W-L records, title progression
- The Drop / The Stare / Receipt Wall (old version) mechanics
- Original schema.sql — needs a migration to the new pack/post/reaction model

The first task in this rebuild is to design the new Supabase schema. Wait for me to ask before generating it.

---

## File locations

- Full design doc: `KIZU-DESIGN-DOC.md`
- This file: `CLAUDE.md`
- Reference design files: `kizu-landing-brutal.html`, `kizu-brutal.jsx`
- Old schema (needs migration): `schema.sql`
- Dev handbook (founder's notes): `KIZU-DEV-HANDBOOK.md`

---

*kizu has no deadline. build slowly. build well. honor the empty space.*
