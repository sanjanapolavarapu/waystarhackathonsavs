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

        <header className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
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
        </header>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur">
              Launch a payment page in minutes
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
              Get paid fast with a link.
            </h1>

            <p className="mt-4 text-base text-zinc-600 sm:text-lg">
              Create a branded payment experience for services, invoices, donations, or fees. Share a URL, embed it
              on your site, or print a QR.
            </p>

            <div className="mt-10 rounded-3xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur p-7 sm:p-10">
              <blockquote className="text-xl sm:text-2xl font-semibold text-zinc-900 leading-snug">
                “The fastest way to turn an invoice into a paid receipt.”
              </blockquote>
              <div className="mt-3 text-sm text-zinc-500">— Your finance team, five minutes from now</div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/admin/signup"
                className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
              >
                Create your first page
              </Link>
              <Link
                href="/admin/pages"
                className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/80 backdrop-blur text-sm font-semibold text-zinc-900 shadow-sm hover:bg-white"
              >
                Go to admin UI
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur p-6 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">Branded checkout</div>
            <p className="mt-2 text-sm text-zinc-600">
              Match your colors, add a logo, and keep payers confident they’re in the right place.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur p-6 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">Flexible amounts</div>
            <p className="mt-2 text-sm text-zinc-600">
              Fixed price, min/max range, or payer-entered. Perfect for services and donations.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur p-6 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">Share anywhere</div>
            <p className="mt-2 text-sm text-zinc-600">
              Send a link, embed an iframe, or print a QR code for in-person payments.
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
