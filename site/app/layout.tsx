import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import MenuConta from "./MenuConta";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voo Barato",
  description: "Busque passagens em todas as companhias e receba aviso quando o preço cair, na ida, na volta ou nas duas.",
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-sky-700">
              <span aria-hidden>✈</span> Voo Barato
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/alertas" className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                Meus alertas
              </Link>
              <Suspense fallback={<span className="w-16" />}>
                <MenuConta />
              </Suspense>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="py-6 text-center text-xs text-slate-400">
          Preços do Google Voos, atualizados a cada 6 horas. A compra é feita no site da companhia.
        </footer>
      </body>
    </html>
  );
}
