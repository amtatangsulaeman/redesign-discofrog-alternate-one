import type { Metadata } from "next";
import { Google_Sans_Code, Google_Sans_Flex } from "next/font/google";
import Preloader from "@/components/Preloader";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
});

// Mono companion for labels and pills (the hero's tags)
const googleSansCode = Google_Sans_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Discofrog | Branding & Web Studio",
  description:
    "Discofrog makes brands move. Bold identities, high-performance websites and SEO from a small branding & web studio between Jakarta and Melbourne.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-loading locks scrolling until the preloader lifts (it removes the attribute)
    <html lang="en" className={`${googleSansFlex.variable} ${googleSansCode.variable}`} data-loading="">
      <body>
        <Preloader />
        {/* without JavaScript the preloader would never lift: hide it and unlock scrolling */}
        <noscript>
          <style>{`[data-preloader]{display:none!important}html{overflow:auto!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
