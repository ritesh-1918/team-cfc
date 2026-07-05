import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CivicPulse — Citizen Voice for MPs",
  description: "AI-powered citizen feedback platform for development prioritization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} font-sans bg-zinc-950 text-zinc-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
