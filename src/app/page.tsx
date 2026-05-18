import Link from "next/link";
import { BrandLogoLink } from "@/components/brand-logo-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { primaryButtonClassName } from "@/lib/primary-button-styles";

const BRAND = "#0EA5E9";

const themeToggleClassName =
  "h-10 w-10 px-0 rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/60";

const navBtnClass =
  "landing-nav-btn inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-900/60";

const ctaPrimaryClass = `landing-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold ${primaryButtonClassName}`;

export default function Home() {
  return (
    <main className="landing-shell min-h-screen bg-[#f9fafb] text-heading dark:bg-background dark:text-foreground">
      <div className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 hidden bg-center bg-cover opacity-25 dark:block"
          style={{ backgroundImage: "url(/hero-abstract.svg)" }}
        />
        <div className="absolute inset-0 -z-10 hidden dark:block bg-gradient-to-b from-black/40 via-black/20 to-background" />
        <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(900px_600px_at_70%_35%,rgba(217,70,239,0.18),transparent_62%),radial-gradient(900px_600px_at_20%_20%,rgba(99,102,241,0.18),transparent_60%)]" />

        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <BrandLogoLink subtitle="Reusable payment links for any business" />
              <nav className="flex items-center gap-2">
                <ThemeToggle className={themeToggleClassName} />
                <Link href="/admin/login" className={navBtnClass}>
                  Log in
                </Link>
                <Link href="/admin/signup" className={`${ctaPrimaryClass} h-10 px-4`}>
                  Sign up
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div className="text-center lg:text-left">
              <div className="landing-card inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-subheading shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
                Launch a payment page in minutes
                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                No code
                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                Shareable link
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-heading sm:text-6xl">
                Get paid fast with a link.
              </h1>
              <p className="mt-4 text-base text-subheading sm:text-lg dark:text-zinc-300">
                Create a branded payment experience for services, invoices, donations, or fees.
                Share a URL, embed it on your site, or print a QR.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/admin/signup" className={`${ctaPrimaryClass} w-full sm:w-auto`}>
                  Create your first page
                </Link>
                <Link href="/admin/pages" className={`${navBtnClass} w-full sm:w-auto rounded-xl px-6 font-semibold`}>
                  Open dashboard
                </Link>
              </div>
              <div className="landing-card mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <blockquote className="text-lg font-semibold leading-snug text-heading sm:text-xl">
                  “The fastest way to turn an invoice into a paid receipt.”
                </blockquote>
                <p className="mt-2 text-sm text-subheading dark:text-zinc-400">
                  — Your finance team, five minutes from now
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="landing-card rounded-[28px] border border-zinc-200 bg-white p-4 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.12)] dark:border-zinc-800 dark:bg-zinc-950/40 dark:shadow-none">
                <div className="landing-muted-surface flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/30">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex shrink-0 gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-300/90" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
                    </div>
                    <div className="min-w-0 truncate rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] text-subheading dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                      yourdomain.com/pay/consulting-session
                    </div>
                  </div>
                  <div className="h-2.5 w-10 shrink-0 rounded-full" style={{ backgroundColor: BRAND }} aria-hidden="true" />
                </div>
                <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-950/20">
                  <div className="flex flex-col items-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="h-7 w-7 rounded-lg" style={{ backgroundColor: BRAND }} />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-heading">Consulting Session</h3>
                    <p className="mt-1 text-sm text-subheading dark:text-zinc-400">Pay securely in under a minute</p>
                    <div className="landing-card mt-6 w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                      <div className="landing-muted-surface border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <p className="text-center text-xs font-medium text-subheading">Payment Amount</p>
                        <p className="mt-1 text-center text-3xl font-semibold tracking-tight text-heading">$89.00</p>
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-subheading dark:text-zinc-300">Email</p>
                          <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-500">
                            you@company.com
                          </div>
                        </div>
                        <button
                          type="button"
                          className="h-11 w-full rounded-xl text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                          style={{ backgroundColor: BRAND }}
                        >
                          Complete Payment
                        </button>
                        <p className="text-center text-xs text-subheading dark:text-zinc-400">Secure · Encrypted</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-subheading dark:text-zinc-400">Powered by Quick Payment Pages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-6">
        <div className="landing-card rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              {
                title: "Branded checkout",
                body: "Match your colors, add a logo, and keep payers confident they’re in the right place.",
              },
              {
                title: "Flexible amounts",
                body: "Fixed price, min/max range, or payer-entered. Perfect for services and donations.",
              },
              {
                title: "Share anywhere",
                body: "Send a link, embed an iframe, or print a QR code for in-person payments.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-semibold text-heading">{item.title}</h3>
                <p className="mt-2 text-sm text-subheading dark:text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            {
              step: "Step 1",
              title: "Create a page",
              body: "Choose a title, amount type, and fields you need for reconciliation.",
            },
            {
              step: "Step 2",
              title: "Share the link",
              body: "Send a URL, embed it, or drop a QR on an invoice—works everywhere.",
            },
            {
              step: "Step 3",
              title: "Get paid",
              body: "Payments flow into your dashboard with the data you need.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="landing-card rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <p className="text-xs font-medium text-subheading dark:text-zinc-400">{item.step}</p>
              <h3 className="mt-2 text-base font-semibold text-heading">{item.title}</h3>
              <p className="mt-2 text-sm text-subheading dark:text-zinc-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
