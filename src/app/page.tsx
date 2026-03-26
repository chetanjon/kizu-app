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
            WEEKLY ACCOUNTABILITY FOR SMALL GROUPS
          </span>
          <h1 className="font-h text-[clamp(42px,6vw,72px)] font-black tracking-[-0.04em] leading-[0.95] mt-5">
            Make a bet
            <br />
            <span className="text-[#888]">to a friend.</span>
            <br />
            Keep it, or face the
            <br />
            consequences.
          </h1>
          <p className="text-[clamp(15px,1.8vw,18px)] text-[#666] mt-6 max-w-[520px] leading-[1.7]">
            One goal per week. Direct it at someone you trust. If you miss, they
            set your goal next week. Every Sunday at sunset — everyone finds out.
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
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)] flex gap-10 items-center flex-wrap">
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5">
            {/* Job seekers */}
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-yellow-t mb-2">
                Job seekers
              </div>
              <p className="text-sm text-yellow-t opacity-70 leading-relaxed">
                &ldquo;Apply to 10 roles this week.&rdquo; Your pod sees if you
                did. Priya&apos;s already sent 5 cold emails. You haven&apos;t
                started.
              </p>
            </div>
            {/* Grad students */}
            <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-lime-t mb-2">
                Grad students
              </div>
              <p className="text-sm text-lime-t opacity-70 leading-relaxed">
                &ldquo;Write 2,000 words of my thesis.&rdquo; Your advisor
                doesn&apos;t check. Your pod does. Every Sunday at sunset.
              </p>
            </div>
            {/* Side project builders */}
            <div className="bg-purple rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-purple-t mb-2">
                Side project builders
              </div>
              <p className="text-sm text-purple-t opacity-70 leading-relaxed">
                &ldquo;Ship the landing page.&rdquo; No one cares about your
                project except your pod. And they&apos;ll know if you
                didn&apos;t.
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
            One week. Five moves.
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
                  Write one goal for the week. Direct it at a specific friend in
                  your pod. &ldquo;I bet you I&apos;ll send 5 cold
                  emails.&rdquo; It goes on your Receipt Wall. Forever.
                </p>
              </div>
            </div>

            {/* Step 2 — The Dare */}
            <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-[#CCC] shrink-0">
                02
              </div>
              <div>
                <div className="font-h text-xl font-extrabold">
                  The Dare{" "}
                  <span className="font-m text-[10px] font-bold text-[#AAA]">
                    MONDAY
                  </span>
                </div>
                <p className="text-sm text-[#666] leading-relaxed mt-1.5">
                  The person you bet to can accept — or dare you to go bigger.
                  &ldquo;5 emails? Make it 10.&rdquo; Accept the dare or stick
                  to your original.
                </p>
              </div>
            </div>

            {/* Step 3 — The Work */}
            <div className="bg-blue rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-blue-t opacity-30 shrink-0">
                03
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
                  who&apos;s sealed. Send a Stare: &ldquo;[Name] is
                  watching.&rdquo;
                </p>
              </div>
            </div>

            {/* Step 4 — The Drop */}
            <div className="bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-[#444] shrink-0">
                04
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-white">
                  The Drop{" "}
                  <span className="font-m text-[10px] font-bold text-[#888]">
                    SUNDAY AT SUNSET
                  </span>
                </div>
                <p className="text-sm text-[#888] leading-relaxed mt-1.5">
                  At sunset, results reveal one by one. Delivered or missed.
                  Voice confessions play. Everyone sees. Your record updates:
                  14–4.
                </p>
              </div>
            </div>

            {/* Step 5 — The Forfeit */}
            <div className="bg-pink rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-pink-t opacity-30 shrink-0">
                05
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-pink-t">
                  The Forfeit{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    IF YOU MISSED
                  </span>
                </div>
                <p className="text-sm text-pink-t opacity-70 leading-relaxed mt-1.5">
                  If you missed, the person you bet to sets YOUR goal for next
                  week. Their creativity. Their rules. You don&apos;t get to
                  choose.
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
              Scars don&apos;t lie.
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
