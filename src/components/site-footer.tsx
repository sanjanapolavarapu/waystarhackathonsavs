import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer shrink-0 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-xs text-subheading">© {year} Quick Payment Pages</p>
        <p className="text-xs text-subheading">
          Built for hackathons ·{" "}
          <Link
            className="underline underline-offset-4 hover:text-heading dark:hover:text-zinc-200"
            href="/admin/pages"
          >
            Admin UI
          </Link>
        </p>
      </div>
    </footer>
  );
}
