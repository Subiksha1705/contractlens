import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Disclaimer } from "@/components/Disclaimer";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContractLens — Evidence-First Contract Intelligence",
  description:
    "Turn contracts into traceable, reviewable, deadline-ready obligations with exactly one AI call per upload.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`light ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body
        className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-[#005CB9]/20 selection:text-[#005CB9]"
        style={{ colorScheme: "light", backgroundColor: "#f8fafc", color: "#0f172a" }}
      >
        <ToastProvider>
          <main className="flex-1">{children}</main>
          <Disclaimer />
        </ToastProvider>
      </body>
    </html>
  );
}
