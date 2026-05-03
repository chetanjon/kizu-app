# kizu — design document v1.0

**A private social layer for your real-life pack.**

> *"witness what i'm witnessing."*
> — the soul of kizu, in one sentence

---

**Author:** CJ
**Date:** May 1, 2026
**Status:** Locked decisions, open craft
**Stack:** Next.js 15 + TypeScript + Tailwind v4 + Supabase + Resend + Claude API + Vercel
**Domain:** kizu.app

---

## Contents

0. [Read this first](#0-read-this-first)
1. [What kizu is](#1-what-kizu-is)
2. [The philosophy](#2-the-philosophy)
3. [The pack — kizu's atomic unit](#3-the-pack--kizus-atomic-unit)
4. [The daily mechanic — sunset](#4-the-daily-mechanic--sunset)
5. [The receipt mechanic](#5-the-receipt-mechanic)
6. [The wall — kintsugi as artifact](#6-the-wall--kintsugi-as-artifact)
7. [The city — ambient world](#7-the-city--ambient-world)
8. [Weekly themes](#8-weekly-themes)
9. [The introduction mechanic — cross-pod](#9-the-introduction-mechanic--cross-pod)
10. [Brand DNA](#10-brand-dna)
11. [Rituals & cadence](#11-rituals--cadence)
12. [Craft details — the soul](#12-craft-details--the-soul)
13. [What kizu is NOT](#13-what-kizu-is-not)
14. [Tech stack](#14-tech-stack)
15. [Phased build roadmap (v1 / v2 / v3)](#15-phased-build-roadmap)
16. [Legal & strategic — the F-1 reality](#16-legal--strategic--the-f-1-reality)
17. [Monetization — deferred, not absent](#17-monetization--deferred-not-absent)
18. [Launch playbook](#18-launch-playbook)
19. [Risks & failure modes](#19-risks--failure-modes)
20. [Open questions (deliberately undecided)](#20-open-questions-deliberately-undecided)
21. [The decision log — what got rejected and why](#21-the-decision-log--what-got-rejected-and-why)

---

## 0. Read this first

This document is the source of truth for kizu's design as of May 1, 2026. It captures every locked decision from a long working session — and, just as importantly, the things that got rejected, and why.

Read this when you forget what kizu is supposed to be. Read this when you're tempted to add a feature that contradicts what's already here. Read this before you reopen any locked decision.

**The cardinal rule:** if you find yourself wanting to add discovery, location, public-by-default content, individual ratings, streaks, dares, or anything that pulls kizu toward TikTok or BeReal — stop. Re-read Section 13 ("What kizu is NOT"). Those exclusions are load-bearing. Removing them removes kizu's soul.

**The other cardinal rule:** kizu has no deadline. This is a hobby project, a portfolio piece, and a learning vehicle while you're on F-1 / STEM OPT. Build slowly. Build well. Don't rush.

> *"intimate + cosmic, nothing in between. that's the brand discipline."*

---

## 1. What kizu is

**One sentence:** kizu is a private social layer for your real-life pack — a place where 5–20 trusted friends witness each other daily through what they're looking at, accumulate a year of shared raw moments into a kintsugi-styled artifact, and occasionally meet other packs in an ambient "city" of pods.

**What it isn't:** kizu is not an accountability app. It is not a journaling app. It is not a dating app. It is not anti-Instagram (though Instagram users will likely love it). It is not a wellness product. It is not a productivity tool. Treating it as any of these will distort the design.

### Background context

kizu (傷, Japanese for "scar") was originally designed as a weekly accountability app for friend groups. After extensive design work and conversation, it pivoted to its current form in May 2026. The original brand DNA — neo-brutalist design, the kintsugi metaphor, the voice — all carry forward. The mechanics are completely different.

### Who it's for

kizu is for people aged ~22–32 who:

- have a friend group of 5–20 people they want to stay close with
- are aesthetic-conscious (would notice neo-brutalist design)
- are tired of performing for Instagram and TikTok algorithms
- value depth over reach, intimacy over audience
- would rather have a small place that's beautiful than a big place that's loud
- read Substack, listen to podcasts, follow specific aesthetic accounts on X

Critically: kizu is **not** for everyone. Most people will not get it. That is a feature, not a bug.

---

## 2. The philosophy

> **"Witness what i'm witnessing."**

Every social app has a philosophy embedded in where the camera points:

| App | Implicit message |
|---|---|
| Instagram (front + edited) | *"approve of me"* |
| TikTok (front, performed) | *"entertain me"* |
| BeReal (dual cam) | *"prove you're real"* |
| Snapchat (front, ephemeral) | *"acknowledge me"* |
| Locket (either, lockscreen) | *"think of me"* |
| **kizu (back cam only)** | **"witness what i'm witnessing"** |

Every other app centers on **the self being seen**. kizu inverts this: the user disappears, and what remains is their gaze. You don't show what you look like. You show what you are looking at.

This isn't just a camera direction choice. It's a worldview. kizu draws from a tradition closer to:

- John Berger's *Ways of Seeing* (the camera as a way of paying attention)
- Wim Wenders' photography ("photography is an act of looking")
- Tarkovsky's notion of cinema as sculpting in time
- Early Flickr, before it became performative

None of these are mainstream social references. That's a feature. kizu has a philosophical lineage no other app in this category is drawing from.

### The kintsugi metaphor, fully realized

Kintsugi is the Japanese art of repairing broken pottery with gold lacquer — making the cracks the most beautiful part of the object. In kizu's original accountability framing, the "scars" were missed goals and forfeits.

In the new framing, the kintsugi is something better: **the gold is your attention**. What you chose to point your camera at is the act of repair. You are saying "this mattered enough to look at." Your year-end wall is a literal kintsugi artifact — your attention rendered in gold across 365 days.

---

## 3. The pack — kizu's atomic unit

Everything in kizu starts with the pack. It is the unit of belonging.

### Rules

| Field | Value |
|---|---|
| **Size** | 5 to 20 members. Hard caps. No flexibility. |
| **Identity** | Each pack has a name, a 2-color palette, a chosen icon, and a founding date. |
| **Membership** | Multi-pod allowed: a user can be in up to 5 packs total. |
| **Home pod** | Each user designates ONE pack as their "home pod" — this owns their wall, their tournament identity, and their public-facing kizu identity. |
| **Other pods** | Other pods you're in: you participate, post, see content. They do not accumulate to your personal identity. |
| **Switching home pod** | Rare and consequential. Cooldown enforced. Visible to all pods you're in. |
| **Visibility** | Pack metadata (name, colors, icon, member count, founding date, scar count) is visible to all kizu users via the city. Pack content is private by default. |

### Why these specific numbers

**5–20 size:** Smaller than 5 = pack is fragile (one dropout kills it). Larger than 20 = activity dilutes intimacy, kizu becomes Discord. The 5–20 band keeps a pack feeling like a small private community.

**5 packs max per user:** Humans typically have 3–5 distinct close friend circles (work, college, home, neighborhood, etc.). 5 is enough realism without diluting commitment. Going higher would make kizu feel like Discord servers.

**Home pod model:** Without a home pod, multi-pod membership would dilute team identity completely ("which pod am I loyal to?"). With it, you get realism (multiple groups) without losing the team-identity backbone that makes tournaments and the wall meaningful.

### Failure mode to design against

Pack death by attrition. If 2–3 members of an 8-person pack go inactive, the remaining members lose their reason to open kizu. Mitigations: weekly pod-health insights via Claude API; auto-notify the pack founder if pod activity drops below 50% for 7 consecutive days; enable graceful dissolution and re-formation rather than zombie packs.

---

## 4. The daily mechanic — sunset

kizu's heartbeat is one moment per day, triggered by the sunset.

### How it works

1. At each user's local sunset (calculated from their stored timezone), Resend delivers a single email: *"sunset's coming."*
2. The email contains one button: **witness today** → kizu.app
3. On the website, the user is prompted to take ONE photo using their device's **back camera only**. No filters, no edits, no retakes.
4. The photo posts to their home pod (and any other pods they choose to share to).
5. The window stays open until midnight (local time). After that, the moment is gone.
6. Pack members react with one of 8 fixed emoji. No comments. No likes counter.

### Constraints (all structural, all on purpose)

- **Back camera only.** No selfies. Ever. The product literally cannot show your face.
- **No filters, no edits, no retakes.** Whatever the camera sees is what gets posted.
- **One moment per day.** Not multiple. Not bonus posts (the BeReal trap).
- **No streaks.** Missing a day produces no guilt mechanic, no broken-streak counter. Empty days are honored as quiet space on the wall.
- **Frequency adjustable.** Default is daily. User can change to every-2-days, weekly, or off in settings.
- **One email per day.** kizu never sends marketing email. The sunset email is the product itself, not promotion.

### Why sunset (and not random pings)

The original 2-minute random push (BeReal-coded) was rejected for several reasons:

- PWA push notifications are unreliable on iOS. Half of users would never hear the prompt.
- Random pings train urgency. kizu is supposed to be the opposite of urgency.
- Sunset is a natural, predictable, beautiful trigger. The voice ("sunset's coming") was always pointing here.
- Tying the moment to actual sundown anchors kizu in the physical world, not the algorithm world.

> *"the day is ending. what did you actually see?"*

---

## 5. The receipt mechanic

kizu has two sources of moments: the camera (the physical world) and the receipt (the digital world). Both are valid forms of witnessing.

### How it works

- Anywhere in the app, paste in a screenshot — a tweet, a text thread, a weird autocorrect, a screen-time stat, an embarrassing Google search, anything from your digital life.
- Claude API auto-blurs sensitive data on upload: phone numbers, email addresses, full names from contact threads. This is a moderation+privacy guardrail.
- Receipts post to your home pod (and others you choose). Same 8 emoji reactions as photos. No comments.
- Receipts and photos co-exist on the wall. Both are part of your year of attention.

### Why this works

Screenshots are the modern receipt of how Gen Z and young Millennials communicate. They are already shared in group chats constantly. kizu just gives the practice a permanent, intentional home alongside the camera mechanic. It also dramatically expands what counts as a daily moment — not every day has a great back-camera photo, but most days have a screenshot worth keeping.

### Privacy note

Receipts can include other people's words (texts, DMs, etc.). Auto-blur of identifying info is a hard requirement. ToS makes the user solely responsible for what they post. Server-side OCR is used only for moderation and is not stored long-term beyond what's needed for that purpose.

---

## 6. The wall — kintsugi as artifact

The wall is your pack's accumulated year. It is the lock-in, the moat, and the soul of kizu's long-term value.

### How it works

- Every photo and receipt posted in your pack appears on the wall.
- Layout is neo-brutalist: thick borders, hard offset shadows, gold cracks (kintsugi) connecting the week's posts each Sunday.
- When you open the wall, it doesn't load instantly. It **builds, slowly** — one item at a time, with gold cracks forming between items. 4–5 seconds of intentional render. The wait is the magic.
- Sundays are special: at sunset, the previous week's posts get "stitched" with a permanent gold line. You watch it form.
- Year-end: the wall renders as a high-resolution printable poster. Free for all packs.
- Empty days are visible but quiet. Missed days are not failures — they are the cracks that the gold runs through.

### Why the wall is sacred

Every dead app in this category (BeReal, Gas, Poparazzi) died because it had mechanics but no artifact. Once the novelty wore off, there was no reason to stay. The wall is what kizu users would **lose** by leaving — and that's the only durable retention mechanic in private social.

The wall is not a feed. It is not designed for scrolling or browsing. It is designed to be sat with — the way you sit with a photo album, not the way you scan an Instagram grid.

### Year-end ritual

On December 31 (or the pack's anniversary, configurable), kizu surfaces the entire year as a printable poster. The pack votes whether to publish the wall publicly to the city as a year-end art piece (default: private). Pods that opt to publish get featured in the city's annual reveal — a kind of "Spotify Wrapped" moment for kizu, but on the pack's terms.

---

## 7. The city — ambient world

After you post, kizu opens to **the city**. Not a feed. A place to be in.

### Visual

- Thousands of dark tiles, dots, points of light — each one is a pod.
- Yours is the brightest, in the center, when you visit.
- Tiles vary in: brightness (active today vs. dim), size (small pod vs. large), and subtle color (pod's chosen palette).
- The city **breathes**: tiles pulse subtly when their pods post.
- Time of day affects the look — the city looks different at 3am than at noon.
- Weather (real-time, location-based) bleeds into the visual. Rainy day = the city looks rainy.
- On Sundays at sunset, the entire city pulses with the week's theme color.

### Interaction (combo 4 + opt-in publishing)

- You can **wander** the city — pan, zoom, drift. You don't scroll it.
- Tap a tile → see that pod's **profile**: name, colors, icon, member count, founding date, scar count. **No content.**
- Some tiles have a small "publishing" indicator showing they have shared individual posts publicly.
- Tap into a publishing pod → see their public posts (small handful, typically). React with same emoji.
- Public posts require a **unanimous vote** from the pod's members. No single member can make the pod public.
- There is no infinite stream. There is no "For You." There is no algorithm. You will see maybe 20–50 public posts a day across all of kizu, total.

### Why the city is not a feed

kizu has TWO scales: **intimate** (your pack) and **cosmic** (the city). Nothing in between. There is no "pods you might like," no recommended posts, no trending content, no algorithmic discovery. The middle layer is what every other social app has, and it is what kizu rejects.

> *"intimate + cosmic, nothing in between. that's the brand discipline."*

### Why the city exists at all

A purely sealed app is a dead app. Users posted and there was nothing to look at. The city solves the "what do I do after I post" problem without becoming TikTok. You wander. You see lights. You feel kizu's scale. You sometimes find a public post from a pod that opted to share. Mostly you just look.

---

## 8. Weekly themes

Every Monday morning, kizu emails all packs globally with a single weekly theme. "This week: post something blue." "This week: your worst Monday morning face." "This week: a stranger's hands." The theme is a shared cultural moment across all of kizu — without breaking pack privacy.

### How it works

- Monday at 7am local time: kizu emails the theme. Voice-driven copy, never cheerful.
- Packs participate privately throughout the week, posting to the theme alongside their normal moments.
- Sunday at sunset: the city pulses with the theme color. "143,000 blue things were witnessed this week."
- A small handful of standout public posts from opt-in publishing pods are featured in a "this week, the city saw" view. Always opt-in. Always small in number.
- The theme appears as a tag on items that participated. It becomes searchable on your pack's wall.

### Why this works

Weekly themes give kizu a heartbeat across time. The city alone is beautiful but static; themes make it change every week. Gives you a marketing moment every Monday. Creates organic conversation between people who know each other in real life across different pods ("oh, did you do this week's theme?"). Sets up the v3 tournament mechanic without building it yet.

---

## 9. The introduction mechanic — cross-pod

Real friendship and real romance both happen through mutual friends. kizu digitizes that pattern with a single mechanic.

### How it works

1. Any pack member can **propose introducing** a person from their pod (person X) to a different pod (pod Y).
2. The proposal goes to **both** pods. Person X's pod must approve ("yes, X is open to meeting people in pod Y"). Pod Y must approve ("yes, we're open to X visiting").
3. If both approve, X gets **7-day visiting status** in pod Y. They can see pod Y's posts and post to pod Y during this period.
4. After 7 days, pod Y votes whether to make X a full member. If yes, X is now in two pods (their home pod stays, X is added to pod Y as a non-home pod).
5. If no, X returns to their home pod. The visit ends cleanly. No drama, no notification of rejection, no public visibility.

### Why this exists

Real-life social fabric works like this. Your friend introduces you to their friends. You hang out as a group. You either click or you don't. If you click, you get folded in. If you don't, no harm done. kizu is one of the only apps designed to digitize this exact pattern instead of the cold-stranger swipe model that dominates dating and friend-finding apps.

### The subtle dating layer

Some introductions will lead to friendship. Some will lead to romance. Some will lead to nothing. **kizu does not distinguish.** The introduction mechanic is brand-neutral — it is never marketed as a dating feature, never has a "romantic interest" toggle, never differentiates between platonic and romantic introductions.

This is deliberate. Every dating app that has tried to integrate friend-graph vouching (Hinge's original version, Wingman, The League's friends-of-friends mode) has failed because they branded as dating apps first. kizu is the inverse: it is a friendship app where romance is a natural emergent property of the social fabric, never the headline.

### Safety constraints

- Every introduction is vouched by an existing mutual friend (the proposer). No stranger contact.
- Both pods must approve. No solo opt-in.
- kizu is 18+ for v1. Underage users are not permitted.
- Visiting period is fixed (7 days). Cannot be extended without full membership vote.
- Pods that abuse the introduction mechanic (introducing too many random people, harassment patterns) get rate-limited or suspended.

### Free tier limit

Until kizu has a legal monetization path, all features are free. When monetization eventually happens, introductions are a likely paid feature (e.g., $2.99 per introduction or unlimited monthly). Charging for introductions is structurally good UX — it makes them deliberate and rare. See Section 17.

---

## 10. Brand DNA

### Name

**kizu** (傷, Japanese for "scar"). The name carries from the original accountability framing but now means something gentler — every photo, every receipt, every day is a small mark. The kintsugi gold runs through them.

### Metaphor

**Kintsugi** — the Japanese art of repairing broken pottery with gold lacquer. Every scar becomes the most beautiful part of the object. In kizu, the gold is your attention. What you chose to point your camera at is the act of repair.

### Aesthetic

| Element | Spec |
|---|---|
| **Style** | Neo-brutalist |
| **Background** | Warm cream `#F2F0E6` (not stark white) |
| **Borders** | `2.5px solid #1A1A1A` — thick, intentional, like ink |
| **Shadows** | `5px` hard offset, no blur, color `#1A1A1A` |
| **Hover** | Cards lift like physical buttons |
| **Accents** | Flat saturated colors per feature: yellow, lime, pink, blue, orange, purple, red, green |
| **Black cards** | For emphasis on critical elements |
| **Whitespace** | Luxurious. Things have room to breathe. |

### Typography

| Use | Font |
|---|---|
| **Headlines / numbers** | Archivo, 600–900 weight |
| **Body / names** | Plus Jakarta Sans, 300–700 |
| **Labels / data / records** | Space Mono, 400 / 700 |
| **All fonts** | Google Fonts (free) |

### Voice

Direct, slightly unsettling, never cheerful. Reads like a friend who knows you too well. Examples:

- *"sunset's coming."* — daily prompt
- *"[friend] saw you."* — reaction notification
- *"the moment passed. it always does."* — missed daily window
- *"nothing yet. that's not nothing."* — empty wall state
- *"this week. show us [theme]. sunset's coming."* — weekly theme drop
- *"your pod has been quiet for 3 days. that's okay."* — inactive pod nudge

**kizu reads like a poem.** Every word is curated. There is no "reminder: please check in!" copy. There is no exclamation-heavy onboarding. The voice is what makes kizu feel like itself instead of Yet Another App.

---

## 11. Rituals & cadence

kizu's defense against the BeReal/Gas/Poparazzi novelty trap is rituals tied to time. Time is part of the product. Users open kizu because it's *that time*, not because they're bored.

| Cadence | Ritual |
|---|---|
| **Daily** | Sunset email → witness moment via back camera or receipt |
| **Weekly (Monday 7am)** | Theme drops via email |
| **Weekly (Sunday sunset)** | Wall stitching — gold cracks form between the week's posts. The city pulses with the theme color. |
| **Monthly** | Pack health insights surfaced via Claude API (private to pod) |
| **Annually** | Year-end wall poster export. Optional opt-in publish to city. |
| **Seasons (v3)** | Tournament cadence — quarterly seasons with soft reset of records |

**Time becomes part of the product.** Sunset is not just a notification trigger; it is the daily ritual. Sunday is not just data; it is when the wall stitches. Every cadence is meaningful, not arbitrary.

---

## 12. Craft details — the soul

These are the details that make a small product feel like a love affair instead of a tool. They matter more than features. They are why people will fall in love with kizu instead of deleting it after a week.

### 1. Rituals tied to time

Sunset triggers the daily moment. Monday 7am triggers themes. Sunday sunset triggers wall stitching. Each cadence is a deliberate, named moment in the product. Time is part of the experience, not a background variable.

### 2. The city as living art

The city is not a static visualization. Tiles breathe with subtle pulse animations tied to global activity. Real-time weather of where you are bleeds into the visual. Day/night cycle is real. The city you see today is slightly more dense than last month. The city should look beautiful as a screensaver — that is the test.

### 3. The wall as a hand-made thing

The wall does not load instantly. It **builds, slowly** — one item at a time, with gold cracks forming between them. Takes 4–5 seconds. The wait is the magic. On Sundays, you watch the gold stitch form in real time. The wall is a monument, not a feed.

### 4. Sound design

Wildly underrated. kizu has a sound. The sunset email arrival has a specific subtle tone. Wall stitching makes a soft sound. Reactions have tactile feedback. The city has ambient hum if you leave the app open. Sounds make products feel premium and alive.

### 5. Text and copy as poetry

Every empty state, every notification, every onboarding line is curated copy. See Section 10 for voice examples. Cheerful, hype-y copy is forbidden anywhere in kizu.

### 6. Typography and motion

Everything moves slowly on purpose. Transitions are 600–800ms (most apps are 200ms). kizu is deliberate, not snappy. Whitespace is luxurious. Typography is bold, brutalist, considered.

### 7. The unfilled spaces

When there is no activity, kizu does not fill the space with suggestions or notifications. It shows you the empty space. "Your pod has been quiet for 3 days. That's okay." Empty space is a feature. **Instagram fills empty space. kizu honors it.** This is the most counter-intuitive design choice in the entire product, and it is the most important.

---

## 13. What kizu is NOT

These exclusions are **load-bearing**. Removing any of them removes kizu's soul. If you find yourself wanting to add one of these features, re-read this section before doing anything else.

### Locked OUT of kizu

**No streaks (personal).** Snap streaks correlate with lower self-esteem and FOMO. Personal streak counters are forbidden. Pack-level collective progress (e.g., "we participated in 7 themes in a row") is allowed because it is collective, not individual loss-aversion.

**No algorithm.** No 'For You,' no 'recommended,' no 'pods you might like,' no engagement-based ranking. Anywhere.

**No infinite scroll.** Anywhere. The city is wandered, not scrolled. The wall is sat with, not scrolled.

**No public-by-default content.** All pack content is private by default. Public publishing requires unanimous pack vote.

**No location features.** Not now, not ever. Privacy risk, brand risk, child safety risk, doomscroll risk. Already-existing alternatives (Find My Friends, etc.) handle utility location.

**No front camera.** Ever. No selfies. The product literally cannot show your face.

**No filters or edits.** On any photo. What the camera sees is what gets posted.

**No retakes.** First take, only take.

**No individual ratings or scores of friends.** No "rate your friend 1–10," no leaderboards of pod members, no Stare Cam mechanic. Peeple, Lulu, and adjacent products are dead for a reason.

**No dares as a core mechanic.** Truth-or-dare apps own that category. kizu is not a dare app. The introduction ritual exists for joining pods, but it is an attention exchange, not a test.

**No accountability framing.** Original kizu was punishment-coded. New kizu is witness-coded. Bets, forfeits, and W-L records are removed.

**No monetization while founder is on F-1 / STEM OPT.** Legal constraint. See Section 16.

**No native app yet.** Web-first PWA only for v1 and v2. Native is v2.5 or later.

**No notifications other than the sunset email.** User-adjustable. No push notifications, no daily summary email, no "X reacted to your post" pings. Calm by design.

**No marketing email.** The sunset email is the product, not promotion. kizu does not send newsletters, growth nudges, or re-engagement campaigns.

**No comments.** Reactions only. 8 fixed emoji. Discussion happens in real life or in iMessage.

**No DMs.** Pods are the only communication surface. No private messaging between users outside their pods.

---

## 14. Tech stack

### Existing stack (carried forward from original kizu)

| Layer | Tech |
|---|---|
| **Framework** | Next.js 15 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database / Auth / Realtime** | Supabase |
| **Email** | Resend (sunset emails, weekly themes) |
| **AI** | Claude API (receipt blurring, weekly theme generation, pack health insights, future tournament judging) |
| **Hosting** | Vercel |
| **Domain** | kizu.app |

### Why web-first / PWA

- Founder already knows Next.js. No new stack to learn during F-1 / job search period.
- PWA-installable to home screen — close enough to a native app for v1.
- No App Store review, no platform tax, no native compile cycles.
- kizu's aesthetic (city visualization + wall + neo-brutalist design) actually looks better on larger screens. Web is a stronger canvas for the brand than native mobile would be.
- Web-first signals brand discipline. Substack, Notion, Are.na, Read.cv are all web-first. They are aesthetically aligned with kizu.

### PWA limitations to acknowledge

- Push notifications are unreliable on iOS. **Sunset email** is the answer — not push.
- Camera UX is more constrained on mobile browsers. Use the `capture="environment"` attribute and `getUserMedia` constraints to enforce back-camera-only.
- Discoverability is harder than the App Store. Growth happens through invite codes and word of mouth. See Section 18.

### Native app is v2.5+

If kizu reaches meaningful retention as a PWA, a native app (likely React Native via Expo) becomes the next investment. React Native lets the founder reuse JavaScript skills from the Next.js codebase. Camera and push become first-class. The Supabase backend, Claude API integration, and design system all carry over.

---

## 15. Phased build roadmap

kizu has no deadline. The phasing below is a sequence, not a schedule.

### v1 — The foundation

Build for learning. Get the core loop working end-to-end.

- Auth + onboarding (Supabase auth, email magic links)
- Pack creation: name, colors, icon, founding date, 5–20 size cap
- Multi-pod membership with home pod designation
- Daily mechanic: sunset email via Resend, back-camera capture, no edits, post to pack
- Receipt mechanic: paste-in screenshot, Claude API auto-blur, post to pack
- Pack feed (the wall) — basic version, no kintsugi animation yet
- 8 emoji reactions, no comments, no DMs
- Settings: timezone, sunset email frequency

**v1 done = a real pack of 5–20 people can use kizu daily and have it work.**

### v2 — Team identity layer

Build for craft. Make kizu feel alive, not just functional.

- Public pack profiles (combo 4 — metadata visible, content private)
- The city — full ambient visualization with breathing tiles, weather, day/night cycle
- Wall kintsugi animation: build slowly, gold cracks, Sunday stitching
- Year-end printable poster export
- Weekly themes mechanic: Monday email, theme tagging, Sunday city pulse
- Collective pack streaks ("we participated in 7 themes in a row")
- Introduction mechanic for cross-pod movement
- Opt-in public posts (unanimous pack vote required)
- Sound design pass: sunset email tone, wall stitching sound, ambient city hum

**v2 done = kizu feels like itself. The brand is fully expressed.**

### v3 — The meta-game

Build for fun. Add the tournament layer once retention is proven.

- Tournament brackets (start monthly, not weekly — less moderation load)
- Voting mechanic (pod members vote on other pods, anti-gaming via pod-only voting)
- Season cadence (3-month seasons with soft reset of records)
- Pod titles and badges: champion, runner-up, comeback story, etc.
- Wall updated to show competitive history alongside daily moments
- Year-end "city wrapped" — kizu's annual public reveal moment

**v3 done = kizu has a meta-game on top of its daily ritual. Long-term retention is structural.**

### v4 — Polish & legitimacy (when status allows)

- Native app (React Native via Expo)
- Premium tier introduced (when monetization is legally possible)
- Proper moderation tooling for opt-in public posts
- Annual artifact upgrades (printed posters as paid add-on, etc.)

---

## 16. Legal & strategic — the F-1 reality

The founder is on an F-1 student visa, transitioning to STEM OPT in May 2026. This has direct, non-negotiable consequences for what kizu can be in 2026–2029.

### What F-1 / STEM OPT means

- F-1 students cannot generate active income from a US business they own or operate. This is "engaging in business" / self-employment, which is prohibited.
- STEM OPT requires a formal employer-employee relationship with an E-Verify employer. Self-employment is generally NOT allowed on STEM OPT.
- App Store revenue counts as US-source income to USCIS even if the app is "just a hobby." There is a paper trail.
- Violating status can affect future H-1B sponsorship, green card eligibility, and re-entry to the US. The cost of getting this wrong is severe.
- 2025–2026 enforcement of student visa compliance has been aggressive. The tolerance for ambiguity has dropped sharply.

### What this means for kizu

**kizu cannot monetize while the founder is on F-1 or STEM OPT.** Period.

Practical implications:

- No business entity. No LLC. No incorporation.
- No revenue from any source — no subscriptions, no in-app purchases, no Stripe, no ads, no affiliate links, no donations even.
- kizu exists as a free product hosted by the founder personally. There is no "company."
- Apple Developer Account ($99/yr) is fine — it is a personal expense, not business income.
- Vercel, Supabase, Resend, Anthropic API costs are personal expenses, paid out of personal income from W-2 employment.
- **Before any monetization is even considered, an immigration attorney consultation is required.** Not a DSO meeting — an actual immigration attorney who handles entrepreneur cases.

### What kizu IS during F-1 / STEM OPT

- **A portfolio piece.** A beautiful, working consumer social app the founder designed and shipped — a 10x more impressive resume item than most PM applications have. Helps land jobs.
- **A learning project.** Full-stack consumer app development. Next.js, Supabase, real-time features, mobile responsive design, AI integration. All employable skills.
- **A community-building exercise.** If 1,000 people use kizu and love it, that is a community of people who know the founder made something for them.
- **An optionality bet.** When visa status changes (H-1B → green card → citizenship, however long that takes), kizu exists as a base. It can be monetized then, or used as a launching pad for the next thing.

> *"focus on making something people love. the rest follows."*

---

## 17. Monetization — deferred, not absent

kizu is free during the F-1 / STEM OPT period. When the founder's status allows, the following monetization model is the recommended starting point. **Do not implement any of this until a US immigration attorney has confirmed it is legally permissible.**

### The 'modules, not tiers' philosophy

Most consumer apps charge tiered subscriptions (Free / Pro / Premium). kizu is recommended to charge **per-feature modules** instead. This is closer to Patreon, Discord Nitro, and Canva: the core is fully free, and specific opt-in features cost money.

### Recommended paid modules (post-visa)

| Module | Price | What it unlocks |
|---|---|---|
| **The Matchmaker** | $2.99 per cross-pod introduction OR $9.99/mo unlimited | Charging for introductions is structurally good UX — it makes them deliberate and rare. The dating layer monetizes without ever being labeled as such. |
| **Pack+** | $4.99/mo per pack (any member can sponsor for the whole pack) | Multi-pod beyond default, custom emoji slots, custom pack colors and icons, expanded member cap. |
| **The Kintsugi Poster** | FREE for digital. Paid version: high-quality printed and shipped poster, $24/yr per pack. | The wall as a physical year-end artifact. |

### Why per-pack instead of per-user

Per-user subscriptions on a friend-group product create social friction (some pack members pay, others don't, the experience fragments). Per-pack pricing means one member can sponsor the upgrade for the whole pack, or they can split it. Discord nitro boosts work this way for the same reason.

### Realistic revenue expectations

Friend-group social monetizes at ~1–5% conversion at best. At 100K active users, that's 1,000–5,000 paying users. At an average $4–6/month blended ARPU per paying user, that is roughly **$50K–$360K/year in revenue.**

This is a small lifestyle-business outcome, not a venture-scale outcome. That is fine. kizu is not trying to be a billion-dollar company. The category does not support that, and the design does not optimize for it.

---

## 18. Launch playbook

kizu launches invite-only. Scarcity is the only credible "premium" lever a hobby-built app has, and invite-only is the proven mechanism (Clubhouse, Partiful, Superhuman, Bookface, Dispo). It also solves the cold-start problem: every user arrives with people they will actually use it with.

### Phase 1 — Closed alpha (months 1–2)

- 100 friends-of-friends. No public landing page yet.
- Private URL only.
- Founder personally onboards each pack.
- Goal: validate that 5–20 person packs can use kizu daily and the wall accumulates meaningfully.

### Phase 2 — Invite codes (months 3–6)

- Public landing page at kizu.app, no signup form, just brand and waitlist email collection.
- Each existing user gets **5 invite codes**. Codes expire in 14 days if unused.
- Total user cap: 10,000 for the first 6 months. Hard cap, no exceptions.
- First 1,000 paid users (when monetization eventually opens) get a permanent **Founder badge** on their profile and wall.

### Phase 3 — Progressive opening (months 7–12)

- Public waitlist application form added. Approve in batches of 200/week.
- Invite codes still work and bypass the waitlist (this preserves the "earned" feel for invited users).
- Cap softens but kizu is not yet open to the public.

### Phase 4 — Re-evaluate (month 12+)

- If the brand has stuck and kizu is associated with "exclusive friend-group app," keep some friction.
- If the brand is more flexible, open to public signup with onboarding gates instead.
- **Critical:** never let invite-only become a cope. Set a clear internal trigger — if active user count plateaus and is not growing despite scarcity, open up. Clubhouse died from clinging to scarcity past its useful life.

### Distribution and marketing

- **The artifact is the marketing.** Ship a 30-second video showing the year-end wall poster. The wall, not the feature list, is what makes people want kizu.
- Pack-card screenshots (the public-facing pod profile) are designed to look beautiful when shared on X / Instagram. Pods doing the marketing for kizu organically.
- Targeted seeding: aesthetic-conscious creator communities (design Twitter, Are.na users, certain Substack writers, dark-academia subreddits).
- No paid ads. Ever. Word of mouth or nothing.

---

## 19. Risks & failure modes

Be honest about how kizu can die. The history of consumer social is littered with apps that had beautiful designs and dead user bases. kizu is not exempt.

**Pack death by attrition.** If 2–3 of 8 pack members go inactive, the remaining members lose their reason to open kizu. *Mitigation:* weekly pack-health insights via Claude API; auto-notify pack founder if activity drops below 50% for 7 consecutive days; graceful dissolution flow.

**BeReal-style novelty trap.** Daily-prompt apps with no creator/network economy decay 6–18 months in. *Mitigation:* the wall artifact is the moat. The wall MUST ship in v1 with kintsugi animation, or kizu has nothing to retain users on. Weekly themes give kizu a heartbeat that BeReal never had.

**Privacy / IP exposure on receipts.** Someone screenshots an ex's text and posts to their pack. Even though the pack is private, kizu has data liability. *Mitigation:* auto-redaction of phone numbers and emails on upload via Claude API; ToS makes user solely responsible; no long-term server-side OCR storage.

**"Premium" credibility for a hobby-built app.** kizu's brand wants to feel premium and exclusive, but it is solo-built and small. *Mitigation:* physical printed wall for top tier (margins allow it at scale ≥ 1,000 paid); never discount below the planned price point; manufactured scarcity through invite codes.

**F-1 / STEM OPT enforcement.** Any monetization or business activity during the visa period puts the founder's immigration status at risk. *Mitigation:* kizu is fully free during this period. No business entity. No revenue. Section 16 is non-negotiable.

**Solo founder bandwidth.** kizu competes for the founder's time with: graduating, full-time PM job search, eventually a full-time PM job. *Mitigation:* phased build, no deadline, no monetization pressure. kizu is a hobby. If kizu dies because the founder is too busy with their career, that is the right outcome.

**Meta / Snap / Discord clone risk.** If kizu takes off, larger platforms could ship similar features. *Mitigation:* the back-camera-only constraint and the kintsugi wall artifact are weird enough that mainstream platforms won't ship them — the brand risk is too high for them. kizu's defensibility is its weirdness, not its technology.

**Moderation as kizu grows.** Opt-in public posts and the introduction mechanic both create surfaces that need moderation. As a solo founder, this is real overhead. *Mitigation:* default privacy on everything; strict invite-only growth; pack-vote requirements for any public action; report flows in v2.

**Minor protection.** If anyone under 18 uses kizu, COPPA and post-NGL FTC enforcement create real legal risk. *Mitigation:* kizu is 18+ for v1 and v2. Age verification at signup. No exceptions.

**The founder reopening locked decisions.** This document was written specifically because the founder has a documented pattern of reopening decisions and adding rejected features back through side doors. *Mitigation:* re-read this document, especially Section 13, before adding anything. Iterate on craft, not on locked decisions.

### Kill metrics

If any two of the following sustain for 60 days, the kizu thesis is broken and a pivot or shutdown is warranted:

- WAU/MAU ratio falls below 35%
- Wall views per user trend below 1 per week
- (When monetization is live) paid conversion below 2% of MAU at month 6
- Pack creation rate falls below 5% of new signups
- Invite code redemption rate falls below 30%

---

## 20. Open questions (deliberately undecided)

These are real product questions that have not been answered yet. They are deliberately deferred — either because they require building v1 first to learn what the right answer is, or because they depend on legal or growth conditions that haven't materialized yet.

**Exact tournament structure (v3).** Cadence (weekly / monthly / quarterly?), judging mechanism (cross-pod votes, AI judging, or hybrid?), what winners actually get (badges, custom emoji, shoutouts in the city?). This will be designed after v2 retention data exists.

**Moderation strategy at scale.** What happens when someone posts something illegal or harmful? Who handles reports? How is the introduction mechanic abused, and how is it stopped? Required before v2 ships. Likely needs a small panel of trusted moderators (could be early kizu users) and clear escalation paths.

**Minor protection policy specifics.** kizu is 18+ for v1, but how is age verified? Self-attestation at signup is weakest, government ID verification is strongest. The right answer depends on what regulators expect by the time kizu reaches scale.

**Exact invite code mechanics.** Currently planned: 5 codes per user, 14-day expiration, codes generated on signup. Open: do codes refresh? Is there a "super-invite" that bypasses caps? Do early users get more codes than late users?

**Pod death and archival.** What happens when a pod goes inactive for 90+ days? Does kizu archive it? Notify members? Auto-dissolve? What happens to the wall — does it become a private artifact, get exported as PDF, get deleted? Emotional design moment that matters.

**Onboarding flow specifics.** First-time user journey from sunset email → kizu.app → pack creation → first post → wait for pack to fill. The flow needs to feel ceremonial, not transactional. Will require multiple iterations after v1 ships.

**The empty state for the city.** What does the city look like when kizu has 50 pods total (week 1) vs 5,000 pods (year 2)? The visual must be beautiful at every scale. May require dynamic camera framing — zoom out for big cities, zoom in for small ones.

**Notifications beyond the sunset email.** Should there be weekly digest emails? Pack milestones? Reaction notifications? Currently planned: only the sunset email. But this may need to evolve once real users tell us what they actually want.

**Native app timing.** When does kizu graduate from PWA to native (React Native + Expo)? The trigger should be clear retention + clear demand from users for native-only features (lockscreen widget, reliable iOS push, etc.). Until then, web-first.

**Internationalization.** kizu is launched in English. Do we localize? When? Which markets? The neo-brutalist aesthetic and "sunset's coming" voice both translate poorly to certain languages — this is a real design constraint.

**Identity / profiles.** Currently planned: users are visible only through their pack role (no standalone profile). Open: do users get usernames? Bios? Avatars? Or is identity entirely pack-mediated? Pack-mediated identity is more on-brand but may feel limiting.

---

## 21. The decision log — what got rejected and why

These ideas were considered and rejected during the design conversation that produced this document. They are documented here so future-you remembers **why** they were rejected, and does not accidentally reintroduce them through a side door.

**Movie character AI app.** First idea floated. Rejected as: saturated category (Character.AI, Replika, Talkie, Janitor AI all dominant), legal landmine (selling licensed character personalities = lawsuits), and not based on a real observed problem.

**Original kizu — accountability framing.** Original concept: weekly bets, dares, forfeits, W-L records. Rejected as: punishment-coded, fragile (3-person pod dropouts kill the product), no daily ritual, and creates the kind of social pressure that damages friendships rather than strengthens them.

**The Commons (hyperlocal resource sharing).** Considered as a pivot direction. Rejected as: 15-year category graveyard (NeighborGoods, SnapGoods, Streetbank, Yerdle, ShareWaste, Peerby, etc.), Nextdoor is the only survivor and is itself in decline, US suburbs are structurally the worst geography for hyperlocal sharing.

**The Forge (invite-only builder network).** Considered as a pivot direction. Rejected as: Polywork, Read.cv, Lunchclub, Cocoon all dead; Farcaster publicly admitted social-first didn't work after $180M and 4.5 years; founder is wrong profile (early-career, non-technical-enough) for senior-builder network.

**Indian-immigrant community app.** Considered as a pivot direction. Has the strongest founder-market fit and largest white space, but parked as a future bet. Notable in notes file for revisit when visa status changes — this is the strongest venture-scale idea on the table for kizu's founder.

**Memento mori / Sunday reckoning journaling.** Considered as kizu pivot direction. Rejected as: niche too small, friction too high (people don't manually journal), and the founder's gut said no even though data validated it.

**Stare Cam (numerical rating of friends).** Considered as one of four 'fun' concepts. Rejected as: friendship-destroying mechanic (Peeple, Lulu post-mortems), Snapchat streaks research shows numerical scoring damages mental health, and would generate negative PR for kizu.

**The Dare Loop (daily friend-group dares as core mechanic).** Considered as one of four 'fun' concepts. Rejected as core mechanic because: 24-hour cycle is fragile (if any member ghosts, the whole pod's loop breaks); 'tiny dare' category is owned by free truth-or-dare apps with massive content libraries. Reduced to: optional secondary feature, not core.

**Location-based features.** Floated late in design conversation. Rejected as: privacy and child safety nightmare (Yubo / Wizz precedent), brand-incoherent (kizu is about attention, not coordinates), redundant with Find My Friends, doomscroll fuel. Not now, not ever.

**Public-by-default content / browsing other pods' posts.** Floated multiple times in design conversation as 'people are curious.' Rejected because: this is the path-2 trap that makes kizu another TikTok-clone competitor. Replaced with: opt-in publishing (rare, vote-required) + the city as ambient world visualization.

**Per-user subscription monetization.** Originally proposed. Rejected as: per-user pricing on a friend-group product creates social fragmentation when some pack members pay and others don't. Replaced with: per-pack pricing (Discord Nitro model).

**Tiered subscription (Free / Pro / Premium).** Originally proposed. Rejected as: feels extractive, doesn't fit kizu's brand. Replaced with: à-la-carte modules (Patreon / Canva model).

**Charging for the year-end wall poster.** Originally proposed as paid. Rejected as: the wall IS kizu. Charging for the year-end ritual undermines the soul. Wall is free. (Future: physical printed-and-shipped poster could be paid.)

**Native iOS-first launch.** Considered. Rejected because: founder doesn't know Swift, would require 6–12 months of learning, kizu's aesthetic is actually stronger on web, and PWA is shippable now.

**Random push notifications (BeReal-style).** Originally part of the daily mechanic. Rejected because: PWA push is unreliable on iOS, random pings train the wrong urgency, sunset is a more on-brand trigger. Replaced with: sunset email.

**Personal streak counters.** Considered briefly for retention. Rejected as: Snap streaks correlate with reduced self-esteem and FOMO; streaks are exactly the loss-aversion mechanic kizu opposes. Collective pack streaks ("we participated in 7 themes") are allowed because they are collective progress, not individual punishment.

**Front camera / selfies / filters / edits.** Original kizu mechanic. Rejected as: front camera is performative, filters destroy the witness philosophy. The whole point is back-camera-only, raw, unedited. This is a foundational constraint, not a tweak.

---

*End of document v1.0 — May 1, 2026.*

> *kizu has no deadline. build slowly. build well. honor the empty space.*
