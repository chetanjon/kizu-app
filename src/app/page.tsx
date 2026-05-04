export default function Home() {
  return (
    <>
      {/* ═══ NAV ═══ */}
      <nav className="border-b-[2.5px] border-stroke bg-bg sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)] flex justify-between items-center h-16">
          <span className="font-h text-2xl font-black tracking-[-0.03em]">
            kizu
          </span>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-stroke text-white font-b font-bold text-sm px-6 py-2.5 shadow-[3px_3px_0_#888] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#888] no-underline"
            >
              start a pack →
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-[clamp(60px,10vw,120px)] pb-[clamp(48px,8vw,80px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-3 py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow mb-5">
            ONE MOMENT A DAY. AT SUNSET.
          </span>
          <h1 className="font-h text-[clamp(42px,6vw,72px)] font-black tracking-[-0.04em] leading-[0.95] mt-5">
            witness what
            <br />
            <span className="text-[#888]">you&apos;re witnessing.</span>
            <br />
            for the people who
            <br />
            already know you.
          </h1>
          <p className="text-[clamp(15px,1.8vw,18px)] text-[#666] mt-6 max-w-[520px] leading-[1.7]">
            kizu is a private place for 5–20 friends. one back-camera photo a
            day. one wall, building slowly across the year. no algorithm, no
            audience, no one watching but the people you actually want.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <a
              href="/login"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-base px-10 py-4 shadow-[5px_5px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline"
            >
              start a pack →
            </a>
            <a
              href="#how"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-base px-10 py-4 shadow-[5px_5px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline"
            >
              see how it works
            </a>
          </div>
          <div className="font-m text-[11px] text-[#AAA] mt-5">
            web-first · invite-only · no app to download
          </div>
        </div>
      </section>

      {/* ═══ QUOTE ═══ */}
      <section className="py-[clamp(32px,6vw,60px)] border-t-[2.5px] border-b-[2.5px] border-stroke">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <div className="flex gap-10 items-center flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <p className="text-[clamp(18px,2.5vw,24px)] italic font-medium leading-[1.5]">
                &ldquo;every other app asks you to perform.
                <br />
                <span className="font-bold">
                  this one asks what you actually saw.
                </span>
                &rdquo;
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow">
                SUNSET
              </span>
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-lime">
                BACK CAMERA
              </span>
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-blue">
                RECEIPT
              </span>
              <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-purple">
                THE WALL
              </span>
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
            for people tired of
            <br />
            performing on the internet.
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
            <div className="bg-purple rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-purple-t mb-2">
                you have 5–20 friends
              </div>
              <p className="text-sm text-purple-t opacity-70 leading-relaxed">
                people you&apos;d actually call. not 800 followers, not a
                broadcast list. the ones you want around for the next decade.
              </p>
            </div>
            <div className="bg-blue rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-blue-t mb-2">
                you&apos;re sick of the feed
              </div>
              <p className="text-sm text-blue-t opacity-70 leading-relaxed">
                you closed instagram a hundred times this month. you don&apos;t
                want a smaller feed. you want a different shape entirely.
              </p>
            </div>
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-yellow-t mb-2">
                you notice things
              </div>
              <p className="text-sm text-yellow-t opacity-70 leading-relaxed">
                light through a window. a stranger&apos;s hands. a screenshot
                you can&apos;t stop thinking about. you already see the world.
                this is just somewhere to put it.
              </p>
            </div>
            <div className="bg-orange rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-xl font-extrabold text-orange-t mb-2">
                you&apos;d rather build something
              </div>
              <p className="text-sm text-orange-t opacity-70 leading-relaxed">
                a year of attention, rendered in gold across 365 days. nothing
                you can post on instagram is going to look like this.
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
            one day. four moves.
          </h2>

          <div className="flex flex-col gap-3.5">
            <div className="bg-yellow rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-yellow-t opacity-30 shrink-0">
                01
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-yellow-t">
                  sunset&apos;s coming{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    DAILY
                  </span>
                </div>
                <p className="text-sm text-yellow-t opacity-70 leading-relaxed mt-1.5">
                  one email a day, at your local sundown. one button. no push
                  notifications, no random pings. the day is ending. what did
                  you actually see?
                </p>
              </div>
            </div>

            <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-lime-t opacity-30 shrink-0">
                02
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-lime-t">
                  back camera only{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    NO FILTERS
                  </span>
                </div>
                <p className="text-sm text-lime-t opacity-70 leading-relaxed mt-1.5">
                  one photo, the camera pointed outward. no selfies, no edits,
                  no retakes. whatever the lens sees is what your pack sees.
                </p>
              </div>
            </div>

            <div className="bg-blue rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-blue-t opacity-30 shrink-0">
                03
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-blue-t">
                  paste a receipt{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    ANY TIME
                  </span>
                </div>
                <p className="text-sm text-blue-t opacity-70 leading-relaxed mt-1.5">
                  a screenshot of a tweet, a text thread, a weird autocorrect,
                  a screen-time stat. drop it in. names and numbers blur on
                  upload. screenshots are how you already talk — kizu just gives
                  it a permanent home.
                </p>
              </div>
            </div>

            <div className="bg-purple rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 flex gap-5 items-start transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-4xl font-black text-purple-t opacity-30 shrink-0">
                04
              </div>
              <div>
                <div className="font-h text-xl font-extrabold text-purple-t">
                  the wall stitches{" "}
                  <span className="font-m text-[10px] font-bold opacity-40">
                    SUNDAY AT SUNSET
                  </span>
                </div>
                <p className="text-sm text-purple-t opacity-70 leading-relaxed mt-1.5">
                  every sunday, a permanent gold line stitches the week&apos;s
                  posts together. across the year, your pack&apos;s wall becomes
                  a kintsugi artifact — the cracks made beautiful.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE WALL ═══ */}
      <section className="py-[clamp(48px,8vw,100px)]">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)]">
          <span className="inline-block font-m text-[11px] font-bold px-3 py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow">
            THE WALL — A YEAR OF ATTENTION
          </span>
          <h2 className="font-h text-[clamp(28px,4vw,42px)] font-black tracking-[-0.03em] mt-4 mb-3">
            kintsugi, but it&apos;s yours.
          </h2>
          <p className="text-[15px] text-[#666] max-w-[600px] leading-[1.7] mb-7">
            the wall doesn&apos;t load. it builds. one moment at a time, gold
            cracks forming between them, four or five seconds of intentional
            render. on sunday at sunset, you watch the week stitch shut. it is
            something to sit with — not something to scroll.
          </p>

          <div className="grid grid-cols-2 gap-3.5 max-w-[700px]">
            <div className="bg-stroke rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#888] p-8">
              <div className="font-m text-[10px] font-bold text-[#555] tracking-[0.1em] mb-3.5">
                THIS YEAR
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-h text-[64px] font-black text-white leading-none tracking-[-0.04em]">
                  287
                </span>
                <span className="font-m text-2xl text-[#444]">/365</span>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] bg-yellow">
                  GOLD STITCHED
                </span>
              </div>
              <p className="text-xs text-[#888] mt-4 leading-relaxed">
                empty days are quiet. they are not failures. they are the cracks
                the gold runs through.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-8 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A]">
              <div className="font-h text-lg font-extrabold mb-3">
                what kizu doesn&apos;t do
              </div>
              <div className="flex flex-col gap-1.5 text-sm text-[#666]">
                <div>— no algorithm. no for-you.</div>
                <div>— no front camera. ever.</div>
                <div>— no filters. no retakes.</div>
                <div>— no streaks. no scoring friends.</div>
                <div>— no comments. no dms.</div>
                <div>— no public-by-default content.</div>
                <div>— no push notifications.</div>
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
              intimate or cosmic. nothing in between.
            </div>
            <p className="text-sm text-[#555] leading-relaxed">
              kizu has two scales: your pack, and the city — an ambient
              visualization of every other pack out there, breathing in the
              dark. there is no middle layer. no recommendations, no trending,
              no &ldquo;people you might know.&rdquo; the middle layer is what
              every other social app has, and it is what we&apos;re refusing.
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
            stop performing.
            <br />
            <span className="text-[#888]">start witnessing.</span>
          </h2>
          <p className="text-base text-[#666] mt-4 max-w-[420px] mx-auto leading-relaxed">
            create a pack. invite the people who already know you. wait for
            sunset.
          </p>
          <div className="mt-7">
            <a
              href="/login"
              className="inline-block rounded-xl border-[2.5px] border-stroke bg-yellow text-yellow-t font-b font-bold text-lg px-12 py-[18px] shadow-[5px_5px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] no-underline"
            >
              start a pack →
            </a>
          </div>
          <div className="font-m text-[11px] text-[#AAA] mt-4">
            free · invite-only · web-first
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t-[2.5px] border-stroke py-7">
        <div className="max-w-[1100px] mx-auto px-[clamp(20px,4vw,48px)] flex justify-between items-center flex-wrap gap-3">
          <div>
            <span className="font-h text-lg font-black">kizu</span>
            <span className="font-m text-[10px] text-[#AAA] ml-2">
              we don&apos;t fill the empty space. we honor it.
            </span>
          </div>
          <div className="font-m text-[10px] text-[#AAA]">
            © 2026 kizu · kizu.app
          </div>
        </div>
      </footer>
    </>
  );
}
