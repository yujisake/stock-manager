import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "在庫管理 | 土田酒造",
  description: "土田酒造 在庫管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-washi font-[family-name:var(--font-geist-sans)]">
        <header className="bg-moss text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              {/* 家紋風ロゴマーク */}
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gold text-gold text-sm font-bold leading-none select-none"
                aria-hidden="true"
              >
                土
              </span>
              <div className="leading-tight">
                <p className="text-xs text-moss-pale tracking-widest">TSUCHIDA SAKE BREWERY</p>
                <p className="text-sm font-bold tracking-wide">在庫管理システム</p>
              </div>
            </Link>
            <span className="text-xs text-moss-pale opacity-70 hidden sm:block tracking-wider">
              STOCK MANAGER
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border mt-8 py-4 text-center text-xs text-sumi-light opacity-60">
          © 土田酒造株式会社
        </footer>
      </body>
    </html>
  );
}
