export default function Home() {
  return (
    <>
      {/* ═══ NAV ═══ */}
      <nav className="border-b-[2.5px] border-stroke bg-bg sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)] flex justify-between items-center h-16">
          <span className="font-h text-2xl font-black tracking-[-0.03em]">
            Kizu
          </span>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-stroke text-white font-b font-bold text-sm px-6 py-2.5 shadow-[3px_3px_0_#888] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#888] no-underline"
            >
              Start a pod →
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-[clamp(60px,10vw,120px)] pb-[clamp(48px,8vw,80px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-3 py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow mb-5">
            FIVE WITNESSES. EVERY WEEK.
          </span>
          <h1 className="font-h text-[clamp(42px,6vw,72px)] font-black tracking-[-0.04em] leading-[0.95] mt-5">
            Five people
            <br />
            <span className="text-[#888]">who&apos;ll notice</span>
            <br />
            whether you showed up
            <br />
            this week.
          </h1>
          <p className="text-[clamp(15px,1.8vw,18px)] text-[#666] mt-6 max-w-[520px] leading-[1.7]">
            One goal. One person you bet it to. If you miss, they set your next
            one. No one restarts alone.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <a
              href="/login"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-base px-10 py-4 shadow-[5px_5px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline"
            >
              Start a pod →
            </a>
            <a
              href="#how"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-base px-10 py-4 shadow-[5px_5px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline"
            >
              See how it works
            </a>
          </div>
          <div className="font-m text-[11px] text-[#AAA] mt-5">
            No download needed · Works in your browser
          </div>
        </div>
      </section>

      {/* ═══ QUOTE ═══ */}
      <section className="py-[clamp(32px,6vw,60px)] border-t-[2.5px] border-b-[2.5px] border-stroke">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <div className="flex gap-10 items-center flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <p className="text-[clamp(18px,2.5vw,24px)] italic font-medium leading-[1.5]">
                &ldquo;Most apps remind you.
                <br />
                <span className="font-bold">
                  Kizu makes you answer to someone.
                </span>
                &rdquo;
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow">
                THE BET
              </span>
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-lime">
                THE SEAL
              </span>
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-pink">
                THE DROP
              </span>
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-orange">
                THE FORFEIT
              </span>
            </div>
          </div>

          {/* Verbatim user voices (from research) */}
          <div className="mt-10">
            <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-4">
              WHY WE BUILT THIS
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
              <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[4px_4px_0_#1A1A1A] p-5">
                <p className="text-[13px] italic leading-[1.5] text-[#333]">
                  &ldquo;Just me, my laptop, and a ridiculous amount of
                  overthinking.&rdquo;
                </p>
                <div className="font-m text-[10px] font-bold text-[#999] mt-3">
                  r/SaaS · solo founder
                </div>
              </div>
              <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[4px_4px_0_#1A1A1A] p-5">
                <p className="text-[13px] italic leading-[1.5] text-[#333]">
                  &ldquo;Celebrating achievements feels strange. Who do you
                  share it with? Your reflection?&rdquo;
                </p>
                <div className="font-m text-[10px] font-bold text-[#999] mt-3">
                  r/indiehackers
                </div>
              </div>
              <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[4px_4px_0_#1A1A1A] p-5">
                <p className="text-[13px] italic leading-[1.5] text-[#333]">
                  &ldquo;Being the only person in the world who has read
                  it.&rdquo;
                </p>
                <div className="font-m text-[10px] font-bold text-[#999] mt-3">
                  r/writing
                </div>
              </div>
              <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[4px_4px_0_#1A1A1A] p-5">
                <p className="text-[13px] italic leading-[1.5] text-[#333]">
                  &ldquo;No one who cares if you applied today or not.&rdquo;
                </p>
                <div className="font-m text-[10px] font-bold text-[#999] mt-3">
                  r/jobhunting
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHO IT'S FOR ═══ */}
      <section className="py-[clamp(48px,8vw,100px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg">
            WHO IT&apos;S FOR
          </span>
          <h2 className="font-h text-[clamp(28px,4vw,42px)] font-black tracking-[-0.03em] mt-4 mb-8">
            Built for people who
            <br />
            actually want to change.
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
            {/* Indie hackers / side project builders — primary launch wedge */}
            <div className="bg-purple rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-purple-t mb-2">
                Indie hackers
              </div>
              <p className="text-sm text-purple-t opacity-70 leading-relaxed">
                Building at 11pm after your day job. Nobody knows, nobody asks.
                Pod of 5 changes that.
              </p>
            </div>
            {/* Writers & creators */}
            <div className="bg-blue rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-blue-t mb-2">
                Writers
              </div>
              <p className="text-sm text-blue-t opacity-70 leading-relaxed">
                You&apos;ve been the only person in the world who&apos;s read
                it. Now 4 others care whether you wrote this week.
              </p>
            </div>
            {/* Job seekers / career pivots */}
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-yellow-t mb-2">
                Job seekers
              </div>
              <p className="text-sm text-yellow-t opacity-70 leading-relaxed">
                3,000 applications in and nobody checking on you. Bet it to
                someone. They&apos;ll notice.
              </p>
            </div>
            {/* Niche fitness — return-after-stopping */}
            <div className="bg-orange rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-orange-t mb-2">
                Coming back
              </div>
              <p className="text-sm text-orange-t opacity-70 leading-relaxed">
                6 months off. Starting again and stopping again. Nobody&apos;s
                expecting you at the gym anymore. Pod of 5 expects you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-[clamp(48px,8vw,100px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg">
            HOW IT WORKS
          </span>
          <h2 className="font-h text-[clamp(28px,4vw,42px)] font-black tracking-[-0.03em] mt-4 mb-8">
            One week. Four moves.
          </h2>

          <div className="flex flex-col gap-3.5">
            {/* Step 1 — The Bet */}
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-yellow-t opacity-30 shrink-0">
                01
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-yellow-t">
                  The Bet{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    MONDAY
                  </span>
                </div>
                <p className="text-sm text-yellow-t opacity-70 leading-relaxed mt-1.5">
                  Write one goal. Direct it at the person in your pod whose
                  opinion you actually care about. &ldquo;I bet you I&apos;ll
                  send 5 cold emails.&rdquo; Your pod sees it all week.
                </p>
              </div>
            </div>

            {/* Step 2 — The Work */}
            <div className="bg-blue rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-blue-t opacity-30 shrink-0">
                02
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-blue-t">
                  The Work{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    TUES–SAT
                  </span>
                </div>
                <p className="text-sm text-blue-t opacity-70 leading-relaxed mt-1.5">
                  Every morning at 7am, The Brief lands — your AI-generated
                  daily action step plus what your pod is doing. Drop proof. See
                  who&apos;s sealed. Send presence: &ldquo;[Name] sees you.&rdquo;
                </p>
              </div>
            </div>

            {/* Step 3 — The Drop */}
            <div className="bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-[#444] shrink-0">
                03
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-white">
                  The Drop{" "}
                  <span className="font-m text-[10px] font-bold text-[#888]">
                    SUNDAY AT SUNSET
                  </span>
                </div>
                <p className="text-sm text-[#888] leading-relaxed mt-1.5">
                  At sunset, results reveal one by one. The wins get as much air
                  as the misses. Everyone finally sees. Your record updates:
                  14–4.
                </p>
              </div>
            </div>

            {/* Step 4 — The Forfeit */}
            <div className="bg-pink rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-pink-t opacity-30 shrink-0">
                04
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-pink-t">
                  The Forfeit{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    IF YOU MISSED
                  </span>
                </div>
                <p className="text-sm text-pink-t opacity-70 leading-relaxed mt-1.5">
                  If you missed, the person you bet to sets next week&apos;s
                  goal. Not punishment. Continuation. You don&apos;t restart
                  alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE BRIEF ═══ */}
      <section className="py-[clamp(48px,8vw,100px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-3 py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow">
            DAILY COACHING — FREE
          </span>
          <h2 className="font-h text-[clamp(28px,4vw,42px)] font-black tracking-[-0.03em] mt-4 mb-3">
            The Brief.
          </h2>
          <p className="text-[15px] text-[#666] max-w-[500px] leading-[1.7] mb-7">
            Every morning at 7am, an AI-generated daily action step plus what
            your pod is doing. The feature that turns Kizu from a weekly app into
            a daily habit.
          </p>

          <div className="grid grid-cols-2 gap-3.5 max-w-[700px]">
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-5 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-m text-[9px] font-bold text-yellow-t opacity-40 tracking-[0.08em] mb-2">
                TUESDAY
              </div>
              <p className="text-[13px] font-medium text-yellow-t leading-[1.5]">
                &ldquo;Day 2. Today&apos;s move: make a list of 8 target
                companies. Find HM names on LinkedIn. Priya sealed
                already.&rdquo;
              </p>
            </div>
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-5 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-m text-[9px] font-bold text-yellow-t opacity-40 tracking-[0.08em] mb-2">
                FRIDAY
              </div>
              <p className="text-[13px] font-medium text-yellow-t leading-[1.5]">
                &ldquo;2 days. If you miss, Priya sets your goal next week.
                She&apos;s creative.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RECORD PREVIEW ═══ */}
      <section className="py-[clamp(48px,8vw,100px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg">
            YOUR RECORD
          </span>
          <h2 className="font-h text-[clamp(28px,4vw,42px)] font-black tracking-[-0.03em] mt-4 mb-7">
            W-L like a fighter.
            <br />
            Never resets.
          </h2>

          <div className="grid grid-cols-2 gap-3.5 max-w-[700px]">
            {/* Black record card */}
            <div className="bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#888] p-8">
              <div className="font-m text-[10px] font-bold text-[#555] tracking-[0.1em] mb-3.5">
                YOUR RECORD
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-h text-[64px] font-black text-white leading-none tracking-[-0.04em]">
                  14
                </span>
                <span className="font-m text-2xl text-[#444]">–</span>
                <span className="font-h text-5xl font-black text-red leading-none">
                  4
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-lime">
                  TESTED
                </span>
                <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-purple">
                  5W 🔥
                </span>
              </div>
            </div>

            {/* Titles card */}
            <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-lg font-extrabold mb-3">Titles</div>
              <div className="flex flex-col gap-1.5 text-sm text-[#666]">
                <div>
                  <span className="inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg mr-2">
                    0W
                  </span>
                  Unproven
                </div>
                <div>
                  <span className="inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg mr-2">
                    5W
                  </span>
                  Clean
                </div>
                <div>
                  <span className="inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-lime mr-2">
                    10W
                  </span>
                  <strong>Tested</strong>
                </div>
                <div>
                  <span className="inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg mr-2">
                    20W
                  </span>
                  Veteran
                </div>
                <div>
                  <span className="inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-bg mr-2">
                    30W
                  </span>
                  Scarred
                </div>
                <div>
                  <span className="inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow mr-2">
                    50W
                  </span>
                  Legend
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MISSION COMMITMENT ═══ */}
      <section className="py-[clamp(32px,5vw,64px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 max-w-[760px]">
            <span className="inline-block font-m text-[10px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-pink mb-4">
              WHERE WE&apos;RE HEADED
            </span>
            <div className="font-h text-xl font-extrabold tracking-[-0.02em] mb-2">
              Built for founders first. Recovery communities next.
            </div>
            <p className="text-sm text-[#555] leading-relaxed">
              Kizu launches with indie hackers and solo builders because
              that&apos;s where we can survive long enough to help others. The
              people who need this most — people rebuilding after addiction,
              after a fall — are who we&apos;re building toward. Nothing we
              ship is designed to exclude them.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section
        id="start"
        className="py-[clamp(48px,8vw,100px)] border-t-[2.5px] border-stroke"
      >
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)] text-center">
          <h2 className="font-h text-[clamp(32px,5vw,52px)] font-black tracking-[-0.04em] leading-[0.95]">
            Stop promising yourself.
            <br />
            <span className="text-[#888]">Start promising someone.</span>
          </h2>
          <p className="text-base text-[#666] mt-4 max-w-[420px] mx-auto leading-relaxed">
            Create a pod. Invite 3-5 friends. Make your first bet. Free forever.
          </p>
          <div className="mt-7">
            <a
              href="/login"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-lg px-12 py-[18px] shadow-[5px_5px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline"
            >
              Start a pod →
            </a>
          </div>
          <div className="font-m text-[11px] text-[#AAA] mt-4">
            No download · No credit card · Works in your browser
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t-[2.5px] border-stroke py-7">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)] flex justify-between items-center flex-wrap gap-3">
          <div>
            <span className="font-h text-lg font-black">Kizu</span>
            <span className="font-m text-[10px] text-[#AAA] ml-2">
              Someone&apos;s watching. That&apos;s the whole point.
            </span>
          </div>
          <div className="font-m text-[10px] text-[#AAA]">
            © 2026 Kizu · kizu.app
          </div>
        </div>
      </footer>
    </>
  );
}
