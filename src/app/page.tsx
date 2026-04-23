import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfbff]">
      <div className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-center bg-cover opacity-35"
          style={{ backgroundImage: "url(/hero-abstract.svg)" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/60 via-white/30 to-[#fbfbff]" />

        <header className="sticky top-0 z-20 border-b border-zinc-200/60 bg-white/50 backdrop-blur">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white border border-zinc-200/80 shadow-sm grid place-items-center">
                  <div className="h-5 w-5 rounded-lg bg-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 tracking-tight">
                    Quick Payment Pages
                  </div>
                  <div className="text-xs text-zinc-500">Reusable payment links for any business</div>
                </div>
              </div>

              <nav className="flex items-center gap-2">
                <Link
                  href="/admin/login"
                  className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/80 backdrop-blur text-sm font-medium text-zinc-900 shadow-sm hover:bg-white"
                >
                  Log in
                </Link>
                <Link
                  href="/admin/signup"
                  className="h-10 px-4 inline-flex items-center justify-center rounded-lg text-sm font-medium text-white shadow-sm bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
                >
                  Sign up
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur">
                Launch a payment page in minutes
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                No code
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                Shareable link
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
                Get paid fast with a link.
              </h1>

              <p className="mt-4 text-base text-zinc-600 sm:text-lg">
                Create a branded payment experience for services, invoices, donations, or fees. Share a URL, embed it
                on your site, or print a QR.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/admin/signup"
                  className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
                >
                  Start free
                </Link>
                <Link
                  href="/admin/pages"
                  className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/80 backdrop-blur text-sm font-semibold text-zinc-900 shadow-sm hover:bg-white"
                >
                  Open dashboard
                </Link>
              </div>

              <div className="mt-8 rounded-3xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur p-6">
                <blockquote className="text-lg sm:text-xl font-semibold text-zinc-900 leading-snug">
                  “The fastest way to turn an invoice into a paid receipt.”
                </blockquote>
                <div className="mt-2 text-sm text-zinc-500">— Your finance team, five minutes from now</div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-sky-500/15 blur-2xl" />
              <div className="rounded-[28px] border border-zinc-200/80 bg-white/75 backdrop-blur p-4 shadow-[0_24px_80px_-40px_rgba(2,6,23,0.25)]">
                <div className="flex items-center justify-between rounded-2xl bg-zinc-50/80 border border-zinc-200 px-3 py-2 text-xs text-zinc-700">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-300/90" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
                    </div>
                    <div className="ml-2 rounded-lg bg-white/70 border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600">
                      yourdomain.com/pay/consulting-session
                    </div>
                  </div>
                  <div className="h-2.5 w-10 rounded-full opacity-90 bg-gradient-to-r from-indigo-600 to-fuchsia-600" />
                </div>

                <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl border border-zinc-200 bg-zinc-50 grid place-items-center">
                      <div className="h-6 w-6 rounded-xl bg-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">Consulting Session</div>
                      <div className="text-xs text-zinc-500">Pay securely in under a minute</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-4">
                    <div className="text-xs font-medium text-zinc-500 text-center">Payment Amount</div>
                    <div className="mt-1 text-4xl font-semibold tracking-tight text-zinc-900 text-center">
                      $89.00
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-zinc-600">Email</div>
                      <div className="h-11 rounded-xl border border-zinc-200 bg-white px-4 flex items-center text-sm text-zinc-400">
                        you@company.com
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-zinc-600">Reference / invoice #</div>
                      <div className="h-11 rounded-xl border border-zinc-200 bg-white px-4 flex items-center text-sm text-zinc-400">
                        Optional
                      </div>
                    </div>
                    <div className="h-11 w-full rounded-xl text-white text-sm font-semibold shadow-sm grid place-items-center bg-gradient-to-r from-indigo-600 to-fuchsia-600">
                      Continue to payment
                    </div>
                    <div className="text-xs text-zinc-500 text-center">Secure, encrypted checkout</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-6">
        <div className="rounded-[36px] border border-zinc-200 bg-white/75 backdrop-blur p-6 shadow-sm sm:p-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Branded checkout</div>
              <p className="mt-2 text-sm text-zinc-600">
                Match your colors, add a logo, and keep payers confident they’re in the right place.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Flexible amounts</div>
              <p className="mt-2 text-sm text-zinc-600">
                Fixed price, min/max range, or payer-entered. Perfect for services and donations.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Share anywhere</div>
              <p className="mt-2 text-sm text-zinc-600">
                Send a link, embed an iframe, or print a QR code for in-person payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur p-6 shadow-sm">
            <div className="text-xs font-medium text-zinc-500">Step 1</div>
            <div className="mt-2 text-base font-semibold text-zinc-900">Create a page</div>
            <p className="mt-2 text-sm text-zinc-600">
              Choose a title, amount type, and fields you need for reconciliation.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur p-6 shadow-sm">
            <div className="text-xs font-medium text-zinc-500">Step 2</div>
            <div className="mt-2 text-base font-semibold text-zinc-900">Share the link</div>
            <p className="mt-2 text-sm text-zinc-600">
              Send a URL, embed it, or drop a QR on an invoice—works everywhere.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur p-6 shadow-sm">
            <div className="text-xs font-medium text-zinc-500">Step 3</div>
            <div className="mt-2 text-base font-semibold text-zinc-900">Get paid</div>
            <p className="mt-2 text-sm text-zinc-600">
              Payments flow into your dashboard with the data you need.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white/60">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">© {new Date().getFullYear()} Quick Payment Pages</div>
          <div className="text-xs text-zinc-500">
            Built for hackathons ·{" "}
            <Link className="underline underline-offset-4 hover:text-zinc-700" href="/admin/pages">
              Admin UI
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
