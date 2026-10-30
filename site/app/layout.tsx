import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import MenuConta from "./MenuConta";
import NavInferior from "./NavInferior";
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
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
          <nav className="conteiner flex items-center justify-between gap-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                ✈
              </span>
              Voo<span className="-ml-1.5 text-sky-600">Barato</span>
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/#ofertas" className="hidden rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 sm:block">
                Promoções
              </Link>
              <Link href="/alertas" className="hidden rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 sm:block">
                Meus alertas
              </Link>
              <Suspense fallback={<span className="w-16" />}>
                <MenuConta />
              </Suspense>
            </div>
          </nav>
        </header>
        <main className="conteiner w-full flex-1 py-6">{children}</main>
        <footer className="px-4 pb-28 pt-6 text-center text-xs text-slate-400 sm:pb-6">
          Preços do Google Voos, atualizados às 0h, 6h, 12h e 18h. A compra é feita no site da companhia.
        </footer>
        <NavInferior />
      </body>
    </html>
  );
}
