import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quick Payment Pages",
  description: "Configurable payment pages for any business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='qpp_theme',t=localStorage.getItem(k),d=t==='dark'||(t!=='light'&&t!=='dark'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(t==='light')d=false;if(t==='dark')d=true;document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="grid min-h-dvh grid-rows-[1fr_auto]">
        <ThemeProvider>
          <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">{children}</div>
        </ThemeProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
