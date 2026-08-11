import type { Metadata, Viewport } from "next";
import { Cinzel, Alegreya_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import { DISPLAY_BOOT_SCRIPT } from "@/lib/themes";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const alegreya = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-alegreya",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.tagline,
};

export const viewport: Viewport = {
  // The default palette's mid tone. Reading the chosen theme here would force
  // every page to render per-request and lose static generation, which is a bad
  // trade for the colour of the mobile browser chrome.
  themeColor: "#ece3f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script sets data-theme on this element
    // before React hydrates, so server and client markup legitimately differ.
    <html
      lang="en"
      className={`${cinzel.variable} ${alegreya.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking on purpose. It must run before the body paints, or every
            visitor on a non-default theme sees a flash of Midnight. */}
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
